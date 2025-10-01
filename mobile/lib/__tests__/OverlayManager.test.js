import { OverlayManager } from '../OverlayManager';
import { ParsedTransaction, SMSSettings } from '../types';
import { getSMSSettings, setSMSSettings } from '../storage';

import { AppState } from 'react-native';

// Mock external modules
jest.mock('expo-permissions');
jest.mock('expo-secure-store'); // Mocked via storage.ts
jest.mock('../storage', () => ({
  getSMSSettings: jest.fn(),
  setSMSSettings: jest.fn(),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active',
  },
}));

// Mock the NativeOverlayModule behavior
const mockNativeOverlayModule = {
  requestOverlayPermission: jest.fn(() => Promise.resolve(true)),
  hasOverlayPermission: jest.fn(() => Promise.resolve(true)),
  isDeviceLocked: jest.fn(() => Promise.resolve(false)),
  hasOtherOverlaysActive: jest.fn(() => Promise.resolve(false)),
};

// Manually inject the mock into the module system where OverlayManager would import it
// This requires a bit of a hack since NativeOverlayModule is not directly exported for mocking.
// We'll achieve this by re-importing OverlayManager after setting up the global mock for NativeOverlayModule if possible,
// or by ensuring the mock is in place when OverlayManager is instantiated.
// For simplicity in testing, we'll directly manipulate the internal module for now if necessary or test its integration indirectly.
// A better approach in a real project would be to pass NativeOverlayModule as a dependency.

const mockTransaction = {
  amount: 100,
  type: 'expense',
  merchant: 'Test Store',
  timestamp: new Date(),
  rawMessage: 'Test message',
  confidence: 0.8,
  currency: 'INR',
};

describe('OverlayManager', () => {
  let overlayManager: OverlayManager;
  let onShowMock: jest.Mock;
  let onDismissMock: jest.Mock;
  let onShowInAppNotificationMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset the singleton instance for each test
    (OverlayManager as any).instance = undefined;
    overlayManager = OverlayManager.getInstance();

    onShowMock = jest.fn();
    onDismissMock = jest.fn();
    onShowInAppNotificationMock = jest.fn();

    overlayManager.setPopupCallbacks(onShowMock, onDismissMock, onShowInAppNotificationMock);

    // Default settings
    (getSMSSettings as jest.Mock).mockResolvedValue({
      enabled: true,
      trustedSenders: [],
      popupDuration: 30,
      useOverlay: true,
      autoCategories: {},
      minimumAmount: 0
    });

    // Reset AppState mock
    (AppState.addEventListener as jest.Mock).mockClear();
    (AppState.removeEventListener as jest.Mock).mockClear();
    (AppState as any).currentState = 'active';

    // Directly manipulate the internal NativeOverlayModule mock if necessary,
    // or ensure that mockNativeOverlayModule is used by OverlayManager's internal implementation.
    // Since NativeOverlayModule is a const within the OverlayManager.ts file, direct mocking after import is tricky.
    // The current setup uses a locally defined mock that ShadowManager *imports* implicitly. We need to ensure
    // ShadowManager uses our mock. This is usually done by jest.mock('./path/to/NativeOverlayModule') if it was a separate file.
    // As it's internal, we'll assume its internal functions are overridden by our global mocks implicitly if Jest is configured correctly
    // or explicitly set them here if the import is dynamic or a getter.
    // For this test, we'll rely on the warning messages from NativeOverlayModule as an indicator of its usage
    // and mock its functions directly by replacing them on the actual object reference if possible after getInstance.

    // A more robust solution would be to refactor NativeOverlayModule into a separate injectable dependency.

    // Simulate NativeOverlayModule functions
    Object.assign((overlayManager as any).NativeOverlayModule, mockNativeOverlayModule);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Permission Handling', () => {
    test('should request overlay permission', async () => {
      (mockNativeOverlayModule.requestOverlayPermission as jest.Mock).mockResolvedValue(true);
      const granted = await overlayManager.requestOverlayPermission();
      expect(granted).toBe(true);
      expect(mockNativeOverlayModule.requestOverlayPermission).toHaveBeenCalled();
    });

    test('should return current permission state', async () => {
      (mockNativeOverlayModule.hasOverlayPermission as jest.Mock).mockResolvedValue(true);
      const state = await overlayManager.getPermissionState();
      expect(state.smsPermission).toBe('granted');
      expect(state.overlayPermission).toBe('granted');
      expect(state.lastChecked).toBeInstanceOf(Date);
    });

    test('should return denied if overlay permission not granted', async () => {
      (mockNativeOverlayModule.hasOverlayPermission as jest.Mock).mockResolvedValue(false);
      const state = await overlayManager.getPermissionState();
      expect(state.overlayPermission).toBe('denied');
    });
  });

  describe('Popup Display Coordination and Queue Management', () => {
    test('should display popup if conditions are met', async () => {
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).toHaveBeenCalledWith(mockTransaction);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(true);
    });

    test('should queue popup if another popup is already visible', async () => {
      await overlayManager.showTransactionPopup(mockTransaction);
      await overlayManager.showTransactionPopup({ ...mockTransaction, amount: 200 });

      expect(onShowMock).toHaveBeenCalledTimes(1);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(true);
      // Internally, popupQueue should have one item
      expect((overlayManager as any).popupQueue).toHaveLength(1);
    });

    test('should process queued popups after current one is dismissed', async () => {
      await overlayManager.showTransactionPopup(mockTransaction);
      await overlayManager.showTransactionPopup({ ...mockTransaction, amount: 200 });

      expect(onShowMock).toHaveBeenCalledTimes(1);

      overlayManager.hidePopup();
      expect(onDismissMock).toHaveBeenCalledTimes(1);
      expect(onShowMock).toHaveBeenCalledTimes(2); // Next popup from queue should be shown
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(true);
      expect((overlayManager as any).popupQueue).toHaveLength(0);
    });

    test('should not display popup if overlay usage is disabled in settings', async () => {
      (getSMSSettings as jest.Mock).mockResolvedValue({ useOverlay: false });
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).not.toHaveBeenCalled();
      expect(onShowInAppNotificationMock).toHaveBeenCalledWith(mockTransaction);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(false);
    });

    test('should not display popup if overlay permission is denied', async () => {
      (mockNativeOverlayModule.hasOverlayPermission as jest.Mock).mockResolvedValue(false);
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).not.toHaveBeenCalled();
      expect(onShowInAppNotificationMock).toHaveBeenCalledWith(mockTransaction);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(false);
    });
  });

  describe('Device State Checking', () => {
    test('should queue popup if device is locked', async () => {
      (mockNativeOverlayModule.isDeviceLocked as jest.Mock).mockResolvedValue(true);
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).not.toHaveBeenCalled();
      expect((overlayManager as any).popupQueue).toHaveLength(1);
    });

    test('should queue popup if other overlays are active', async () => {
      (mockNativeOverlayModule.hasOtherOverlaysActive as jest.Mock).mockResolvedValue(true);
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).not.toHaveBeenCalled();
      expect((overlayManager as any).popupQueue).toHaveLength(1);
    });

    test('should process queued popups when app comes to foreground', async () => {
      (mockNativeOverlayModule.isDeviceLocked as jest.Mock).mockResolvedValue(true);
      await overlayManager.showTransactionPopup(mockTransaction); // Queued due to locked device
      expect((overlayManager as any).popupQueue).toHaveLength(1);

      // Simulate app coming to foreground and device unlocking
      (mockNativeOverlayModule.isDeviceLocked as jest.Mock).mockResolvedValue(false);
      (AppState as any).currentState = 'active';
      // Manually trigger the AppState change listener if it's not automatically called in test env
      // In a real Jest setup with react-native mocks, this might be more direct.
      // For now, we'll manually call processQueue which would be triggered by AppState change.
      (overlayManager as any).handleAppStateChange('active');

      expect(onShowMock).toHaveBeenCalledWith(mockTransaction);
      expect((overlayManager as any).popupQueue).toHaveLength(0);
    });

    test('should hide active popup when app goes to background', async () => {
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).toHaveBeenCalledTimes(1);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(true);

      (AppState as any).currentState = 'background';
      (overlayManager as any).handleAppStateChange('background');

      expect(onDismissMock).toHaveBeenCalledTimes(1);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(false);
    });
  });

  describe('Popup Lifecycle Management', () => {
    test('popup should auto-dismiss after specified duration', async () => {
      (getSMSSettings as jest.Mock).mockResolvedValue({ popupDuration: 2, useOverlay: true });

      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(2000); // Advance by 2 seconds

      expect(onDismissMock).toHaveBeenCalledTimes(1);
      expect(overlayManager.isCurrentlyShowingPopup()).toBe(false);
    });

    test('auto-dismiss timer should be cleared on manual dismiss', async () => {
      await overlayManager.showTransactionPopup(mockTransaction);
      expect(onShowMock).toHaveBeenCalledTimes(1);

      overlayManager.hidePopup();

      jest.advanceTimersByTime(30000); // Advance past default 30 seconds

      expect(onDismissMock).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should use default popup duration if not set in settings', async () => {
      (getSMSSettings as jest.Mock).mockResolvedValue({ popupDuration: undefined, useOverlay: true });
      await overlayManager.showTransactionPopup(mockTransaction);

      expect(onShowMock).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(30000); // Default duration is 30 seconds
      expect(onDismissMock).toHaveBeenCalledTimes(1);
    });
  });
});
