import { SMSMonitorService } from '../SMSMonitorService';
import * as TaskManager from 'expo-task-manager';
import * as SMS from 'expo-sms';

import * as BackgroundFetch from 'expo-background-fetch';
import { ParsedTransaction, SMSMessage, SMSSettings } from '../types';
import { storeSMSMessage, getSMSSettings, storeParsedTransaction } from '../storage';
import { PATTERN_UTILS } from '../bankingPatterns';
import { transactionExtractor } from '../transactionExtractor';
import { createTransaction as createTransactionService } from '../transactionService';

// Mock all external dependencies
jest.mock('expo-task-manager');
jest.mock('expo-sms');

jest.mock('expo-background-fetch');
jest.mock('../storage');
jest.mock('../bankingPatterns');
jest.mock('../transactionExtractor');
jest.mock('../transactionService');

describe('Transaction Data Flow Integration', () => {
  let smsMonitorService;
  const mockUserId = 'test_user_id';
  const mockAccountId = 'test_account_id';

  const mockSettings = {
    enabled: true,
    trustedSenders: ['BANKMSG'],
    popupDuration: 10,
    useOverlay: true,
    autoCategories: {},
    minimumAmount: 0,
    keywordFilters: [],
    excludeKeywords: [],
    currency: 'USD',
  };

  const mockIncomingSMS: SMSMessage = {
    id: 'sms-123',
    sender: 'BANKMSG',
    body: 'Your account has been debited with Rs. 500.00 on 2024-01-01 at Groceries. Ref: TXN12345',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    read: false,
  };

  const mockParsedTransaction: ParsedTransaction = {
    amount: 500,
    currency: 'INR',
    type: 'expense',
    merchant: 'Groceries',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    rawMessage: mockIncomingSMS.body,
    confidence: 0.9,
    smsId: 'sms-123',
    title: 'Groceries',
    category: 'Food', // Assuming category is set by user in popup or inferred
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset the singleton instance
    (SMSMonitorService as any).instance = undefined;
    smsMonitorService = SMSMonitorService.getInstance();

    // Mock default behaviors
    (getSMSSettings as jest.Mock).mockResolvedValue(mockSettings);
    (PATTERN_UTILS.containsFinancialKeywords as jest.Mock).mockReturnValue(true);
    (transactionExtractor.extractTransactionData as jest.Mock).mockReturnValue({
      success: true,
      data: mockParsedTransaction,
      errors: [],
      warnings: [],
      confidence: 0.9,
    });
    (createTransactionService as jest.Mock).mockResolvedValue({ id: 'txn-new-123' });
    (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Available);
    (storeSMSMessage as jest.Mock).mockResolvedValue(undefined);
    (storeParsedTransaction as jest.Mock).mockImplementation(async (transaction, userId, accountId) => {
      // Directly call the mocked service function for testing the flow
      await createTransactionService(transaction, userId, accountId);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should process an incoming financial SMS in foreground and create a transaction', async () => {
    // Simulate the background task being triggered by an incoming SMS
    const taskCallback = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    await taskCallback({
      data: { messages: [mockIncomingSMS] },
      error: undefined,
    });

    // Verify filtering
    expect(getSMSSettings).toHaveBeenCalledTimes(1);
    expect(PATTERN_UTILS.containsFinancialKeywords).toHaveBeenCalledWith(mockIncomingSMS.body.toLowerCase());

    // Verify immediate processing (foreground)
    expect(BackgroundFetch.getStatusAsync).toHaveBeenCalledTimes(1);
    expect(storeSMSMessage).not.toHaveBeenCalled(); // Should not be queued in foreground

    // Verify transaction extraction and creation
    expect(transactionExtractor.extractTransactionData).toHaveBeenCalledWith(mockIncomingSMS);
    expect(createTransactionService).toHaveBeenCalledWith(mockParsedTransaction, mockUserId, mockAccountId); // This is the final step where transaction is sent to backend
  });

  test('should queue an incoming financial SMS when app is in background', async () => {
    (BackgroundFetch.getStatusAsync as jest.Mock).mockResolvedValue(BackgroundFetch.BackgroundFetchStatus.Restricted);

    const taskCallback = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    await taskCallback({
      data: { messages: [mockIncomingSMS] },
      error: undefined,
    });

    // Verify queuing in background
    expect(BackgroundFetch.getStatusAsync).toHaveBeenCalledTimes(1);
    expect(storeSMSMessage).toHaveBeenCalledWith(mockIncomingSMS);
    expect(transactionExtractor.extractTransactionData).not.toHaveBeenCalled(); // Not processed immediately
    expect(createTransactionService).not.toHaveBeenCalled(); // Not created immediately
  });

  test('should not process non-financial SMS messages', async () => {
    (PATTERN_UTILS.containsFinancialKeywords as jest.Mock).mockReturnValue(false);
    const nonFinancialSMS: SMSMessage = { ...mockIncomingSMS, body: 'Hello, your OTP is 123456' };

    const taskCallback = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    await taskCallback({
      data: { messages: [nonFinancialSMS] },
      error: undefined,
    });

    expect(getSMSSettings).toHaveBeenCalledTimes(1);
    expect(PATTERN_UTILS.containsFinancialKeywords).toHaveBeenCalledWith(nonFinancialSMS.body.toLowerCase());
    expect(transactionExtractor.extractTransactionData).not.toHaveBeenCalled();
    expect(createTransactionService).not.toHaveBeenCalled();
    expect(storeSMSMessage).not.toHaveBeenCalled();
  });

  test('should handle transaction extraction failure gracefully', async () => {
    (transactionExtractor.extractTransactionData as jest.Mock).mockReturnValue({
      success: false,
      data: null,
      errors: ['Failed to parse amount'],
      warnings: [],
      confidence: 0,
    });

    const taskCallback = (TaskManager.defineTask as jest.Mock).mock.calls[0][1];
    await taskCallback({
      data: { messages: [mockIncomingSMS] },
      error: undefined,
    });

    expect(transactionExtractor.extractTransactionData).toHaveBeenCalledWith(mockIncomingSMS);
    expect(createTransactionService).not.toHaveBeenCalled(); // No transaction created on failure
    expect(storeSMSMessage).not.toHaveBeenCalled();
  });
});
