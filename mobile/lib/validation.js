/**
 * Data Validation and Formatting Utilities
 * 
 * This file contains utility functions for validating and formatting
 * data used in SMS transaction detection.
 */

// Removed imports from './types'

import {
  PATTERN_UTILS,
  CURRENCY_SYMBOLS,
  FINANCIAL_KEYWORDS,
  // BANK_PATTERNS,
  // DATETIME_PATTERNS
} from './bankingPatterns';

// Permission Error Types (duplicated from types.ts for validation)
export const PermissionError = {
  NOT_SUPPORTED: 'PERMISSION_NOT_SUPPORTED',
  DENIED: 'PERMISSION_DENIED',
  TIMEOUT: 'PERMISSION_TIMEOUT',
  SYSTEM_ERROR: 'PERMISSION_SYSTEM_ERROR',
};

// Removed PermissionRequestResult interface

// SMS Message Validation
export const validateSMSMessage = (message) => {
  const errors = [];
  const warnings = [];

  if (!message) {
    errors.push('Message is required');
    return { isValid: false, errors, warnings };
  }

  if (typeof message.id !== 'string' || !message.id.trim()) {
    errors.push('Message ID is required and must be a non-empty string');
  }

  if (typeof message.sender !== 'string' || !message.sender.trim()) {
    errors.push('Sender is required and must be a non-empty string');
  }

  if (typeof message.body !== 'string' || !message.body.trim()) {
    errors.push('Message body is required and must be a non-empty string');
  }

  if (!(message.timestamp instanceof Date) && !isValidDateString(message.timestamp)) {
    errors.push('Timestamp must be a valid Date object or date string');
  }

  if (typeof message.read !== 'boolean') {
    warnings.push('Read status should be a boolean, defaulting to false');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Parsed Transaction Validation
export const validateParsedTransaction = (transaction) => {
  const errors = [];
  const warnings = [];

  if (!transaction) {
    errors.push('Transaction is required');
    return { isValid: false, errors, warnings };
  }

  if (typeof transaction.id !== 'string' || !transaction.id.trim()) {
    errors.push('Transaction ID is required and must be a non-empty string');
  }

  if (typeof transaction.messageId !== 'string' || !transaction.messageId.trim()) {
    errors.push('Message ID is required and must be a non-empty string');
  }

  if (![ 'expense', 'income', 'balance_inquiry', 'unknown' ].includes(transaction.type)) {
    errors.push('Transaction type must be a valid TransactionType enum value');
  }

  if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (typeof transaction.currency !== 'string' || !transaction.currency.trim()) {
    errors.push('Currency is required and must be a non-empty string');
  }

  if (typeof transaction.confidence !== 'number' || transaction.confidence < 0 || transaction.confidence > 1) {
    errors.push('Confidence must be a number between 0 and 1');
  }

  if (!(transaction.timestamp instanceof Date) && !isValidDateString(transaction.timestamp)) {
    errors.push('Timestamp must be a valid Date object or date string');
  }

  if (typeof transaction.rawMessage !== 'string') {
    errors.push('Raw message must be a string');
  }

  if (!transaction.extractedData || typeof transaction.extractedData !== 'object') {
    errors.push('Extracted data is required and must be an object');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Transaction Data Validation
export const validateTransactionData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data) {
    errors.push('Transaction data is required');
    return { isValid: false, errors, warnings };
  }

  if (typeof data.id !== 'string' || !data.id.trim()) {
    errors.push('Transaction ID is required and must be a non-empty string');
  }

  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (typeof data.category_id !== 'number') {
    errors.push('Category ID is required and must be a number');
  }

  if (!(data.date instanceof Date) && !isValidDateString(data.date)) {
    errors.push('Date must be a valid Date object or date string');
  }

  if (!['sms', 'manual', 'bank_api'].includes(data.source)) {
    errors.push('Source must be one of: sms, manual, bank_api');
  }

  if (data.confidence !== undefined && (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)) {
    warnings.push('Confidence should be a number between 0 and 1');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// SMS Settings Validation
export const validateSMSSettings = (settings) => {
  const errors = [];
  const warnings = [];

  if (!settings) {
    errors.push('SMS settings are required');
    return { isValid: false, errors, warnings };
  }

  if (typeof settings.enabled !== 'boolean') {
    errors.push('Enabled must be a boolean');
  }

  if (!Array.isArray(settings.trustedSenders)) {
    errors.push('Trusted senders must be an array');
  } else {
    settings.trustedSenders.forEach((sender, index) => {
      if (typeof sender !== 'string' || !sender.trim()) {
        errors.push(`Trusted sender at index ${index} must be a non-empty string`);
      }
    });
  }

  if (typeof settings.popupDuration !== 'number' || settings.popupDuration < 5 || settings.popupDuration > 300) {
    errors.push('Popup duration must be a number between 5 and 300 seconds');
  }

  if (typeof settings.useOverlay !== 'boolean') {
    errors.push('Use overlay must be a boolean');
  }

  if (typeof settings.autoCategories !== 'object' || settings.autoCategories === null) {
    errors.push('Auto categories must be an object');
  }

  if (typeof settings.minimumAmount !== 'number' || settings.minimumAmount < 0) {
    errors.push('Minimum amount must be a non-negative number');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Permission State Validation
export const validatePermissionState = (state) => {
  const errors = [];
  const warnings = [];

  if (!state) {
    errors.push('Permission state is required');
    return { isValid: false, errors, warnings };
  }

  const validStatuses = ['granted', 'denied', 'not-requested', 'undetermined'];

  if (!validStatuses.includes(state.smsPermission)) {
    errors.push('SMS permission must be one of: granted, denied, not-requested, undetermined');
  }

  if (!validStatuses.includes(state.overlayPermission)) {
    errors.push('Overlay permission must be one of: granted, denied, not-requested, undetermined');
  }

  if (!(state.lastChecked instanceof Date) && !isValidDateString(state.lastChecked)) {
    errors.push('Last checked must be a valid Date object or date string');
  }

  if (typeof state.requestCount !== 'number' || state.requestCount < 0) {
    errors.push('Request count must be a non-negative number');
  }

  if (state.lastDenied && !(state.lastDenied instanceof Date) && !isValidDateString(state.lastDenied)) {
    warnings.push('Last denied should be a valid Date object or date string');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

// Formatting Utilities
export const formatAmount = (amount, currency = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00';
  }

  const formatted = amount.toFixed(2);
  
  if (currency === 'INR') {
    return `₹${formatted}`;
  }
  
  if (currency === 'KSH') {
    return `Ksh${formatted}`;
  }
  
  if (currency === 'USD') {
    return `$${formatted}`;
  }
  
  return `${currency} ${formatted}`;
};

export const formatDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle Indian phone numbers
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  
  return phoneNumber;
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .trim()
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ');
};

export const capitalizeWords = (str) => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper Functions
const isValidDateString = (dateString) => {
  if (typeof dateString !== 'string') {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Calculate confidence score based on extraction quality
export const calculateConfidence = (extractedData) => {
  let score = 0;
  let maxScore = 0;

  // Amount extraction (most important)
  maxScore += 40;
  if (extractedData.amountMatch) {
    score += 40;
  }

  // Transaction type detection
  maxScore += 20;
  if (extractedData.keywords && extractedData.keywords.length > 0) {
    score += 20;
  }

  // Merchant extraction
  maxScore += 15;
  if (extractedData.merchantMatch) {
    score += 15;
  }

  // Account information
  maxScore += 10;
  if (extractedData.accountMatch) {
    score += 10;
  }

  // Balance information
  maxScore += 10;
  if (extractedData.balanceMatch) {
    score += 10;
  }

  // Bank pattern match
  maxScore += 5;
  if (extractedData.bankPattern) {
    score += 5;
  }

  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
};

// Export all validation and formatting utilities
export const ValidationUtils = {
  validateSMSMessage,
  validateParsedTransaction,
  validateTransactionData,
  validateSMSSettings,
  validatePermissionState,
  formatAmount,
  formatDate,
  formatPhoneNumber,
  sanitizeString,
  capitalizeWords,
  generateId,
  calculateConfidence
};