import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getSMSSettings, setSMSSettings } from '../../lib/storage';
import { smsMonitorService } from '../../lib/SMSMonitorService';
import { permissionManager } from '../../lib/permissionManager';
import { overlayManager } from '../../lib/OverlayManager';
import { transactionExtractor } from '../../lib/transactionExtractor';
import { createTransaction } from '../../lib/transactionService';
import RootLayout from '../_layout'; // Import the RootLayout that sets up everything
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

// Mock all external dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
  router: {
    push: jest.fn(),
  },
}));
jest.mock('../../lib/storage');
jest.mock('../../lib/SMSMonitorService');
jest.mock('../../lib/permissionManager');
jest.mock('../../lib/OverlayManager');
jest.mock('../../lib/transactionExtractor');
jest.mock('../../lib/transactionService');
jest.mock('@clerk/clerk-expo', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  useAuth: jest.fn(() => ({ isSignedIn: true, isLoaded: true })),
  useUser: jest.fn(() => ({
    user: {
      id: 'user123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  })),
}));
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock Slider component from @react-native-community/slider
jest.mock('@react-native-community/slider', () => 'Slider');

describe('E2E Transaction Flow', () => {
  const mockUserId = 'user123';
  const mockAccountId = 'mock_account_id_123';

  const mockSMSSettings = {
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

  const mockParsedTransaction = {
    id: 'sms-txn-1',
    messageId: 'msg1',
    type: 'DEBIT',
    amount: 150.75,
    currency: 'USD',
    merchant: 'AMAZON',
    timestamp: new Date(),
    rawMessage: 'Debit of USD 150.75 from AMAZON. Ref: 12345',
    confidence: 0.9,
    source: 'sms',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getSMSSettings.mockResolvedValue(mockSMSSettings);
    setSMSSettings.mockResolvedValue(undefined);
    smsMonitorService.setUserId.mockImplementation(() => {});
    smsMonitorService.setDefaultAccountId.mockImplementation(() => {});
    smsMonitorService.isMonitoring.mockReturnValue(true);
    smsMonitorService.startMonitoring.mockResolvedValue(true);
    smsMonitorService.stopMonitoring.mockResolvedValue(true);
    permissionManager.requestAllPermissions.mockResolvedValue({
      sms: { granted: true, status: 'granted' },
      overlay: { granted: true, status: 'granted' },
    });
    permissionManager.getPermissionState.mockResolvedValue({
      smsPermission: 'granted',
      overlayPermission: 'granted',
      lastChecked: new Date(),
      requestCount: 1,
    });
    overlayManager.setPopupCallbacks.mockImplementation(() => {});
    overlayManager.showTransactionPopup.mockImplementation((transaction) => {
      // Simulate the popup being shown and then user adding transaction
      overlayManager.handleAddTransactionFromPopup(transaction, mockUserId, mockAccountId);
    });
    overlayManager.handleAddTransactionFromPopup.mockImplementation(async (transaction, userId, accountId) => {
      await createTransaction(transaction, userId, accountId);
    });
    overlayManager.handleViewDetailsFromPopup.mockImplementation((transactionId) => {
      useRouter().push(`/transactions/${transactionId}`);
    });
    transactionExtractor.extractTransactionData.mockReturnValue({
      success: true,
      data: mockParsedTransaction,
      confidence: 0.9,
      errors: [],
      warnings: [],
    });
    createTransaction.mockResolvedValue({ message: 'Transaction created' });
  });

  it('successfully processes a new SMS, shows popup, adds transaction, and navigates to details', async () => {
    const { getByText, getByLabelText, queryByText } = render(<RootLayout />);

    // 1. App starts up, SMS monitoring is initialized (mocked in RootLayout)
    await waitFor(() => expect(smsMonitorService.setUserId).toHaveBeenCalledWith(mockUserId));
    await waitFor(() => expect(smsMonitorService.setDefaultAccountId).toHaveBeenCalledWith(mockAccountId));
    await waitFor(() => expect(smsMonitorService.startMonitoring).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(overlayManager.setPopupCallbacks).toHaveBeenCalledTimes(1));

    // 2. Simulate an incoming SMS (e.g., from a background task callback)
    // This directly calls processIncomingSMS in the SMSMonitorService instance.
    const smsMonitorServiceInstance = smsMonitorService.getInstance();
    // Directly call the private method for testing purposes or expose a public trigger
    // For now, we'll simulate the TaskManager callback invoking processIncomingSMS.
    // In a real e2e scenario, this would be triggered by a native event.
    const mockMessage = { id: 'msg1', sender: 'BANKMSG', body: mockParsedTransaction.rawMessage, timestamp: new Date(), read: false };
    await smsMonitorServiceInstance.processIncomingSMS(mockMessage);

    // 3. SMSMonitorService processes it and triggers OverlayManager to show popup
    await waitFor(() => expect(transactionExtractor.extractTransactionData).toHaveBeenCalledWith(mockMessage));
    await waitFor(() => expect(overlayManager.showTransactionPopup).toHaveBeenCalledWith(expect.objectContaining({
      amount: 150.75,
      merchant: 'AMAZON',
    })));

    // 4. Simulate user interacting with the popup and adding the transaction
    // (mocked in beforeEach: overlayManager.showTransactionPopup directly calls handleAddTransactionFromPopup)
    await waitFor(() => expect(overlayManager.handleAddTransactionFromPopup).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 150.75, category: 'Shopping' }), // Default category
      mockUserId,
      mockAccountId
    ));

    // 5. TransactionService is called to create the transaction
    await waitFor(() => expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 150.75, category: 'Shopping', source: 'sms' }),
      mockUserId,
      mockAccountId
    ));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Transaction Added', expect.stringContaining('Successfully added')));

    // 6. Simulate user viewing details after adding transaction (optional step, but good for flow)
    const transactionId = mockParsedTransaction.id;
    await overlayManager.handleViewDetailsFromPopup(transactionId);
    await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith(`/transactions/${transactionId}`));
  });
});
