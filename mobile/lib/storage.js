import * as SecureStore from 'expo-secure-store';
import { createTransaction as createTransactionService } from './transactionService';

const SMS_MESSAGE_QUEUE_KEY = 'smsMessageQueue';

export const storeSMSMessage = async (message) => {
  try {
    const storedMessagesJson = await SecureStore.getItemAsync(SMS_MESSAGE_QUEUE_KEY);
    const storedMessages = storedMessagesJson ? JSON.parse(storedMessagesJson) : [];
    storedMessages.push(message);
    await SecureStore.setItemAsync(SMS_MESSAGE_QUEUE_KEY, JSON.stringify(storedMessages));
  } catch (error) {
    console.error('Failed to store SMS message:', error);
  }
};

export const getStoredSMSMessages = async () => {
  try {
    const storedMessagesJson = await SecureStore.getItemAsync(SMS_MESSAGE_QUEUE_KEY);
    return storedMessagesJson ? JSON.parse(storedMessagesJson) : [];
  } catch (error) {
    console.error('Failed to retrieve SMS messages:', error);
    return [];
  }
};

export const clearStoredSMSMessages = async () => {
  try {
    await SecureStore.deleteItemAsync(SMS_MESSAGE_QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear SMS messages:', error);
  }
};

export const storeParsedTransaction = async (transaction, userId, accountId) => {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Attempting to store parsed transaction (attempt ${retries + 1}/${MAX_RETRIES}):`, transaction);
      await createTransactionService(transaction, userId, accountId);
      console.log('Parsed transaction stored successfully via API.');
      return; // Exit on success
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed to store parsed transaction via API:`, error);
      retries++;
      if (retries < MAX_RETRIES) {
        const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Retrying in ${backoffTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else {
        console.error('All retry attempts failed. Could not store parsed transaction.');
        // Optionally, queue the transaction for later processing or notify the user
        // For now, we will just log the failure.
      }
    }
  }
};

// Add a utility for storing/retrieving SMS settings
const SMS_SETTINGS_KEY = 'smsSettings';

export const getSMSSettings = async () => {
  try {
    const settingsJson = await SecureStore.getItemAsync(SMS_SETTINGS_KEY);
    return settingsJson ? JSON.parse(settingsJson) : null;
  } catch (error) {
    console.error('Failed to retrieve SMS settings:', error);
    return null;
  }
};

export const setSMSSettings = async (settings) => {
  try {
    await SecureStore.setItemAsync(SMS_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to store SMS settings:', error);
  }
};
