/**
 * SMS Transaction Detection - Core Types and Utilities
 *
 * This file serves as the main export point for all SMS transaction detection
 * types, interfaces, patterns, and utilities.
 */

// Export banking patterns and utilities
export * from './bankingPatterns';

// Export validation and formatting utilities
export * from './validation';

// Re-export commonly used constants
export {
  FINANCIAL_KEYWORDS,
  AMOUNT_PATTERNS,
  MERCHANT_PATTERNS,
  ACCOUNT_PATTERNS,
  BALANCE_PATTERNS,
  BANK_PATTERNS,
  PATTERN_UTILS
} from './bankingPatterns';

// Re-export validation utilities
export {
  ValidationUtils,
  validateSMSMessage,
  validateParsedTransaction,
  validateTransactionData,
  validateSMSSettings,
  validatePermissionState,
  formatAmount,
  formatDate,
  generateId,
  calculateConfidence,
  PermissionError
} from './validation';