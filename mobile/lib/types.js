/**
 * Type Definitions for SMS Transaction Processing
 */

/**
 * @typedef {Object} BankPattern
 * @property {string} name - Name of the bank
 * @property {RegExp[]} senderPatterns - Patterns to identify the SMS sender
 * @property {RegExp[]} debitPatterns - Patterns for debit transactions
 * @property {RegExp[]} creditPatterns - Patterns for credit transactions
 * @property {RegExp[]} balancePatterns - Patterns for balance inquiries
 * @property {RegExp[]} amountPatterns - Patterns for extracting amounts
 * @property {RegExp[]} merchantPatterns - Patterns to identify merchants
 * @property {RegExp[]} accountPatterns - Patterns for account information
 * @property {string[]} keywords - Keywords that indicate financial transactions
 * @property {string[]} excludeKeywords - Keywords that exclude messages from processing
 */

/**
 * @typedef {Object} TransactionData
 * @property {string} id - Unique identifier for the transaction
 * @property {string} userId - ID of the user
 * @property {string} accountId - ID of the account
 * @property {string} title - Title of the transaction
 * @property {number} amount - Transaction amount
 * @property {string} category - Transaction category
 * @property {string} type - Transaction type (DEBIT/CREDIT)
 * @property {string} currency - Currency code
 * @property {string} merchant - Merchant name
 * @property {Date} timestamp - Transaction timestamp
 * @property {string} rawMessage - Original SMS message
 * @property {number} confidence - Confidence score for the extraction
 * @property {string} source - Source of the transaction (e.g., 'sms')
 */

/**
 * @typedef {Object} ExtractedData
 * @property {number|null} amount - Extracted amount
 * @property {number|null} balance - Extracted balance
 * @property {string|null} accountNumber - Extracted account number
 * @property {string|null} cardLast4 - Extracted last 4 digits of card
 * @property {string|null} accountType - Extracted account type
 * @property {Date|null} transactionDate - Extracted transaction date
 * @property {string|null} merchant - Extracted merchant
 * @property {string|null} reference - Extracted reference number
 * @property {number} confidence - Overall confidence level
 */

/**
 * @typedef {Object} ParseResult
 * @property {boolean} success - Whether parsing was successful
 * @property {ExtractedData|null} data - Extracted data if successful
 * @property {string[]} errors - Error messages if parsing failed
 * @property {string[]} warnings - Warning messages
 */

/**
 * @typedef {Object} PermissionState
 * @property {'granted'|'denied'|'undetermined'} smsPermission - SMS permission status
 * @property {'granted'|'denied'|'undetermined'} overlayPermission - Overlay permission status (Android)
 * @property {boolean} canRequestSmsPermission - Whether SMS permission can be requested
 * @property {boolean} canRequestOverlayPermission - Whether overlay permission can be requested
 */

export {}; // Empty export to make this a module