/**
 * SMS Monitor Service
 *
 * This service continuously monitors incoming SMS messages in the background,
 * filters financial content, and queues messages for processing.
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { PATTERN_UTILS } from './bankingPatterns';
import { storeSMSMessage, getSMSSettings } from './storage';
import { transactionExtractor } from './transactionExtractor';
import { overlayManager } from './OverlayManager'; // Import overlayManager
import { permissionManager } from './permissionManager'; // Import permissionManager

const SMS_TASK_NAME = 'BACKGROUND_SMS_MONITOR';

export class SMSMonitorService {
  static instance;
  isMonitoringFlag = false;
  currentUserId = null;
  defaultAccountId = null;

  constructor() {
    this.initBackgroundTask();
  }

  static getInstance() {
    if (!SMSMonitorService.instance) {
      SMSMonitorService.instance = new SMSMonitorService();
    }
    return SMSMonitorService.instance;
  }

  setUserId(userId) {
    this.currentUserId = userId;
  }

  setDefaultAccountId(accountId) {
    this.defaultAccountId = accountId;
  }

  async initBackgroundTask() {
    if (Platform.OS !== 'android') {
      console.warn('Background SMS monitoring is currently supported only on Android.');
      return;
    }

    TaskManager.defineTask(SMS_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('SMS_TASK_NAME error:', error);
        return;
      }
      if (data) {
        const { messages } = data;
        if (messages && messages.length > 0) {
          console.log(`Received ${messages.length} SMS messages in background.`);
          for (const message of messages) {
            await this.processIncomingSMS(message);
          }
        }
      }
    });
  }

  async startMonitoring() {
    if (Platform.OS !== 'android') {
      console.warn('Background SMS monitoring is currently supported only on Android.');
      return false;
    }

    if (!this.currentUserId || !this.defaultAccountId) {
      console.warn('User ID or Default Account ID not set. Cannot start monitoring.');
      return false;
    }

    const { status } = await permissionManager.requestSMSPermission();
    if (status !== 'granted') {
      console.warn('SMS permission not granted. Cannot start monitoring.');
      return false;
    }

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_TASK_NAME);
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(SMS_TASK_NAME);
      }

      this.isMonitoringFlag = true;
      console.log('SMS monitoring started successfully in background.');
      return true;
    } catch (error) {
      console.error('Failed to start SMS monitoring:', error);
      this.isMonitoringFlag = false;
      return false;
    }
  }

  async stopMonitoring() {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_TASK_NAME);
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(SMS_TASK_NAME);
        this.isMonitoringFlag = false;
        console.log('SMS monitoring stopped successfully.');
        return true;
      }
      console.log('SMS monitoring task not registered.');
      return false;
    } catch (error) {
      console.error('Failed to stop SMS monitoring:', error);
      return false;
    }
  }

  isMonitoring() {
    return this.isMonitoringFlag;
  }

  async processIncomingSMS(message) {
    console.log('Processing SMS:', message.body);

    const settings = await getSMSSettings();

    if (!settings || !settings.enabled) {
      console.log('SMS monitoring is disabled. Skipping message processing.');
      return;
    }

    if (!this.currentUserId || !this.defaultAccountId) {
      console.warn('User ID or Default Account ID not available for processing SMS. Message will be queued for later if in background.');
      await storeSMSMessage(message);
      return;
    }

    if (!this.isMessageRelevant(message, settings)) {
      console.log('SMS not relevant based on sender or content. Skipping.');
      return;
    }

    const appState = await BackgroundFetch.getStatusAsync();
    if (appState === BackgroundFetch.BackgroundFetchStatus.Available) {
      console.log('App is in foreground. Processing SMS immediately.');
      await this.handleFinancialSMS(message, this.currentUserId, this.defaultAccountId);
    } else {
      console.log('App is in background. Queuing SMS for later processing.');
      await storeSMSMessage(message);
    }
  }

  async handleFinancialSMS(message, userId, accountId) {
    console.log('Handling financial SMS:', message.body);
    const extractedData = transactionExtractor.extractTransactionData(message);
    if (extractedData.success && extractedData.data) {
      console.log('Extracted transaction:', extractedData.data);

      const parsedTransaction = {
        id: `sms-txn-${message.id}-${Date.now()}`, // Ensure unique ID
        messageId: message.id,
        type: (extractedData.data.amount && extractedData.data.amount < 0) ? "DEBIT" : "CREDIT",
        amount: Math.abs(extractedData.data.amount || 0),
        currency: extractedData.data.currency || 'UNKNOWN',
        merchant: extractedData.data.merchant || 'Unknown Merchant',
        balance: extractedData.data.balance || undefined,
        account: extractedData.data.account || undefined,
        timestamp: extractedData.data.transactionDate || message.timestamp,
        rawMessage: message.body,
        confidence: extractedData.confidence || 0,
        source: 'sms',
      };

      // Instead of directly storing, show the popup. The popup's action will then call storeParsedTransaction via OverlayManager.
      overlayManager.showTransactionPopup(parsedTransaction);

    } else {
      console.warn('Failed to extract transaction data:', extractedData.errors);
    }
  }

  isMessageRelevant(message, settings) {
    const lowerCaseBody = message.body.toLowerCase();
    const lowerCaseSender = message.sender.toLowerCase();

    const isTrustedSender = settings.trustedSenders.some(sender =>
      lowerCaseSender.includes(sender.toLowerCase())
    );
    if (isTrustedSender) {
      return true;
    }

    if (PATTERN_UTILS.containsFinancialKeywords(lowerCaseBody)) {
      return true;
    }

    return false;
  }

  onMessageReceived(callback) {
    console.warn('onMessageReceived is a placeholder for foreground listening. Background processing is active.');
  }

  async getPermissionsAsync() {
    const permissionState = await permissionManager.getPermissionState();
    return {
      smsPermission: permissionState.smsPermission,
      overlayPermission: 'not-requested',
      lastChecked: new Date(),
      requestCount: 0,
    };
  }

  async requestPermissionsAsync() {
    const { status: smsStatus } = await permissionManager.requestSMSPermission();
    return {
      smsPermission: smsStatus,
      overlayPermission: 'not-requested',
      lastChecked: new Date(),
      requestCount: 1,
    };
  }
}

export const smsMonitorService = SMSMonitorService.getInstance();
