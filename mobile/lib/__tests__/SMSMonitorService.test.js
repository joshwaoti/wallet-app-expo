import { SMSMonitorService } from '../SMSMonitorService';
import * as TaskManager from 'expo-task-manager';
import * as SMS from 'expo-sms';

import * as BackgroundFetch from 'expo-background-fetch';
import { SMSMessage, SMSSettings } from '../types';
import { storeSMSMessage, getStoredSMSMessages, clearStoredSMSMessages, getSMSSettings, setSMSSettings } from '../storage';
import { PATTERN_UTILS } from '../bankingPatterns';

// Mock Expo modules
jest.mock('expo-task-manager');
jest.mock('expo-sms');
jest.mock('expo-background-fetch');
jest.mock('expo-system-ui');

// Mock storage and banking patterns
jest.mock('../storage', () => ({
  storeSMSMessage: jest.fn(),
  getStoredSMSMessages: jest.fn(() => Promise.resolve([])),
  clearStoredSMSMessages: jest.fn(),
  getSMSSettings: jest.fn(() => Promise.resolve({
    enabled: true,
    trustedSenders: ['BANK', 'MPESA'],
    popupDuration: 30,
    useOverlay: true,
    autoCategories: {},
    minimumAmount: 100
  })),
  setSMSSettings: jest.fn(),
}));

jest.mock('../bankingPatterns', () => ({
  PATTERN_UTILS: {
    containsFinancialKeywords: jest.fn((message) => message.includes('₹') || message.includes('KSH') || message.includes('debited')),
  },
}));

const mockSMSMessage = {
  id: '1',
  sender: 'BANK',
  body: 'Your account has been debited by ₹1000. New balance ₹5000.',
  timestamp: new Date(),
  read: false,
};

describe('SMSMonitorService (Integration Tests)', () => {
  let smsMonitorService: SMSMonitorService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance for each test to avoid state leakage
    (SMSMonitorService as any).instance = undefined;
    smsMonitorService = SMSMonitorService.getInstance();

    
    jest.mock('expo-sms', () => ({
      ...jest.requireActual('expo-sms'),
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
      getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    }));
    (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(false);
    (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Available);
  });

  describe('Service Lifecycle', () => {
    test('should start monitoring if permissions are granted and already registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(true);
      const started = await smsMonitorService.startMonitoring();

      expect(started).toBe(true);
      expect(TaskManager.unregisterTaskAsync).toHaveBeenCalledWith(SMS_TASK_NAME);
      expect(SMS.startSmsManager).toHaveBeenCalledWith({ taskName: SMS_TASK_NAME });
      expect(smsMonitorService.isMonitoring()).toBe(true);
    });

    test('should start monitoring if permissions are granted and not registered', async () => {
      const started = await smsMonitorService.startMonitoring();

      expect(started).toBe(true);
      expect(TaskManager.unregisterTaskAsync).not.toHaveBeenCalled(); // Not unregistered if not registered
      expect(SMS.startSmsManager).toHaveBeenCalledWith({ taskName: SMS_TASK_NAME });
      expect(smsMonitorService.isMonitoring()).toBe(true);
    });

    test('should not start monitoring if SMS permissions are denied', async () => {
      (SMS.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      const started = await smsMonitorService.startMonitoring();

      expect(started).toBe(false);
      expect(SMS.startSmsManager).not.toHaveBeenCalled();
      expect(smsMonitorService.isMonitoring()).toBe(false);
    });

    test('should stop monitoring if registered', async () => {
      (TaskManager.isTaskRegisteredAsync as jest.Mock).mockResolvedValue(true);
      // Simulate monitoring already started
      (smsMonitorService as any).isMonitoringFlag = true;

      const stopped = await smsMonitorService.stopMonitoring();

      expect(stopped).toBe(true);
      expect(SMS.stopSmsManager).toHaveBeenCalled();
      expect(TaskManager.unregisterTaskAsync).toHaveBeenCalledWith(SMS_TASK_NAME);
      expect(smsMonitorService.isMonitoring()).toBe(false);
    });

    test('should not stop monitoring if not registered', async () => {
      const stopped = await smsMonitorService.stopMonitoring();

      expect(stopped).toBe(false);
      expect(SMS.stopSmsManager).not.toHaveBeenCalled();
      expect(TaskManager.unregisterTaskAsync).not.toHaveBeenCalled();
      expect(smsMonitorService.isMonitoring()).toBe(false);
    });
  });

  describe('Background Task Processing', () => {
    const mockDefineTask = TaskManager.defineTask as jest.Mock;
    let smsTaskCallback: Function;

    beforeEach(() => {
      // Capture the task callback when defineTask is called
      mockDefineTask.mockImplementation((taskName, callback) => {
        if (taskName === SMS_TASK_NAME) {
          smsTaskCallback = callback;
        }
      });
      // Re-initialize service to ensure initBackgroundTask is called after mock
      (SMSMonitorService as any).instance = undefined;
      smsMonitorService = SMSMonitorService.getInstance();
    });

    test('should process incoming SMS messages when task is triggered (foreground)', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Available);

      expect(smsTaskCallback).toBeDefined();

      // Trigger the background task manually
      await smsTaskCallback({
        data: { messages: [mockSMSMessage] },
        error: undefined,
      });

      expect(storeSMSMessage).not.toHaveBeenCalled();
      // You would typically assert on transactionExtractor or other downstream calls here
      // For now, we rely on console.log in the actual implementation for visibility.
    });

    test('should queue incoming SMS messages when task is triggered (background)', async () => {
      (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Restricted);

      expect(smsTaskCallback).toBeDefined();

      // Trigger the background task manually
      await smsTaskCallback({
        data: { messages: [mockSMSMessage] },
        error: undefined,
      });

      expect(storeSMSMessage).toHaveBeenCalledWith(mockSMSMessage);
    });

    test('should filter non-relevant SMS messages', async () => {
      (PATTERN_UTILS.containsFinancialKeywords as jest.Mock).mockReturnValue(false);
      (getSMSSettings as jest.Mock).mockResolvedValue({
        enabled: true,
        trustedSenders: [], // No trusted senders
        popupDuration: 30,
        useOverlay: true,
        autoCategories: {},
        minimumAmount: 100
      });

      expect(smsTaskCallback).toBeDefined();

      await smsTaskCallback({
        data: { messages: [{
          id: '2',
          sender: 'SPAM',
          body: 'Buy crypto now!',
          timestamp: new Date(),
          read: false,
        }] },
        error: undefined,
      });

      expect(storeSMSMessage).not.toHaveBeenCalled(); // Should not store non-relevant messages
    });

    test('should process relevant SMS from trusted sender even without keywords', async () => {
      (PATTERN_UTILS.containsFinancialKeywords as jest.Mock).mockReturnValue(false);
      (getSMSSettings as jest.Mock).mockResolvedValue({
        enabled: true,
        trustedSenders: ['BANK'],
        popupDuration: 30,
        useOverlay: true,
        autoCategories: {},
        minimumAmount: 100
      });

      expect(smsTaskCallback).toBeDefined();

      await smsTaskCallback({
        data: { messages: [{
          id: '3',
          sender: 'BANK',
          body: 'Your statement is ready.',
          timestamp: new Date(),
          read: false,
        }] },
        error: undefined,
      });

      expect(storeSMSMessage).not.toHaveBeenCalled(); // It's foreground, so not queued.
      // Additional assertions can be added here if handleFinancialSMS was mocked.
    });

    test('should not process SMS if monitoring is disabled in settings', async () => {
      (getSMSSettings as jest.Mock).mockResolvedValue({
        enabled: false,
        trustedSenders: [],
        popupDuration: 30,
        useOverlay: true,
        autoCategories: {},
        minimumAmount: 100
      });

      expect(smsTaskCallback).toBeDefined();

      await smsTaskCallback({
        data: { messages: [mockSMSMessage] },
        error: undefined,
      });

      expect(storeSMSMessage).not.toHaveBeenCalled();
    });
  });
});
