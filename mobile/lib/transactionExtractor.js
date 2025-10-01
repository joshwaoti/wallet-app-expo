/**
 * Transaction Extractor Service
 * 
 * This service handles extracting structured transaction data from SMS messages,
 * including amount extraction with currency handling, balance extraction,
 * account information parsing, and date/time extraction.
 */

import {
  PATTERN_UTILS,
  BANK_PATTERNS,
  DATETIME_PATTERNS
} from './bankingPatterns';

import {
  formatAmount,
  formatDate,
  generateId,
  validateParsedTransaction
} from './validation';

export class TransactionExtractor {
  static instance;

  constructor() {}

  static getInstance() {
    if (!TransactionExtractor.instance) {
      TransactionExtractor.instance = new TransactionExtractor();
    }
    return TransactionExtractor.instance;
  }

  /**
   * Extract complete transaction data from SMS message
   */
  extractTransactionData(message, parsedTransaction) {
    const errors = [];
    const warnings = [];
    let confidence = 0;

    try {
      // Extract amount with currency handling
      const amountResult = this.extractAmount(message.body);
      if (!amountResult.amount) {
        errors.push('Failed to extract transaction amount');
      }

      // Extract balance
      const balanceResult = this.extractBalance(message.body);
      if (!balanceResult.balance && this.shouldHaveBalance(message.body)) {
        warnings.push('Balance information expected but not found');
      }

      // Extract account information
      const accountResult = this.extractAccountInfo(message.body);
      if (!accountResult.accountNumber && !accountResult.cardLast4) {
        warnings.push('No account information found');
      }

      // Extract date/time
      const dateTimeResult = this.extractDateTime(message);

      // Extract merchant (if available from parsed transaction)
      const merchant = parsedTransaction?.merchant || this.extractMerchantFromMessage(message.body);

      // Extract transaction ID/reference
      const reference = this.extractReference(message.body);

      // Calculate overall confidence
      confidence = this.calculateExtractionConfidence(
        amountResult,
        balanceResult,
        accountResult,
        dateTimeResult,
        merchant,
        reference
      );

      const extractedData = {
        amount: amountResult.amount,
        currency: amountResult.currency,
        balance: balanceResult.balance,
        account: accountResult.accountNumber || accountResult.cardLast4,
        merchant: merchant,
        transactionDate: dateTimeResult.transactionDate,
        transactionId: reference,
        reference: reference
      };

      const validationResult = this.validateExtractedData(extractedData);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      return {
        success: validationResult.isValid && errors.length === 0, // Ensure both internal and external validations pass
        data: extractedData,
        errors,
        warnings,
        confidence
      };

    } catch (error) {
      errors.push(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        errors,
        warnings,
        confidence: 0
      };
    }
  }

  /**
   * Extract amount with currency symbol and decimal handling
   */
  extractAmount(messageBody) {
    const result = {
      amount: null,
      currency: 'INR', // Default currency
      confidence: 0,
      rawMatch: null
    };

    // Detect currency first
    result.currency = PATTERN_UTILS.detectCurrency(messageBody);

    // Enhanced amount patterns with better decimal and currency handling
    const enhancedAmountPatterns = [
      // Currency symbol before amount
      /(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*|usd\s*|\$\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Currency symbol after amount
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|inr|₹|ksh\.?|usd|\$)/gi,
      // Amount with explicit labels
      /(?:amount|amt|sum)[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*|usd\s*|\$\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // M-Pesa specific patterns
      /(?:sent|received|paid|got)\s+(?:ksh\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Generic amount patterns
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g
    ];

    let bestMatch = null;
    let bestConfidence = 0;

    for (const pattern of enhancedAmountPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(messageBody);
      
      if (match && match[1]) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        if (!isNaN(amount) && amount > 0) {
          // Calculate confidence based on pattern specificity and context
          let confidence = this.calculateAmountConfidence(match, messageBody, pattern);
          
          if (confidence > bestConfidence) {
            bestMatch = match;
            bestConfidence = confidence;
            result.amount = amount;
            result.rawMatch = match[0];
          }
        }
      }
    }

    result.confidence = bestConfidence;

    // Validate extracted amount
    if (result.amount !== null) {
      const validation = this.validateAmount(result.amount, messageBody);
      if (!validation.isValid) {
        result.amount = null;
        result.confidence = 0;
      }
    }

    return result;
  }

  /**
   * Calculate confidence score for amount extraction
   */
  calculateAmountConfidence(match, messageBody, pattern) {
    let confidence = 0.3; // Base confidence

    // Higher confidence for currency-specific patterns
    if (match[0].includes('₹') || match[0].includes('rs') || match[0].includes('ksh')) {
      confidence += 0.3;
    }

    // Higher confidence for explicit amount labels
    if (/(?:amount|amt|sum)/i.test(match[0])) {
      confidence += 0.2;
    }

    // Higher confidence for transaction keywords nearby
    const contextBefore = messageBody.substring(Math.max(0, match.index - 50), match.index);
    const contextAfter = messageBody.substring(match.index + match[0].length, match.index + match[0].length + 50);
    const context = contextBefore + contextAfter;

    if (/(?:debited|credited|paid|sent|received|transaction)/i.test(context)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Validate extracted amount
   */
  validateAmount(amount, messageBody) {
    const errors = [];
    const warnings = [];

    // Check for reasonable amount range
    if (amount < 0.01) {
      errors.push('Amount too small to be valid');
    }

    if (amount > 10000000) { // 1 crore
      warnings.push('Amount seems unusually large');
    }

    // Check for decimal precision
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      warnings.push('Amount has more than 2 decimal places');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract balance with formatting
   */
  extractBalance(messageBody) {
    const result = {
      balance: null,
      currency: PATTERN_UTILS.detectCurrency(messageBody),
      confidence: 0,
      rawMatch: null
    };

    // Enhanced balance patterns
    const enhancedBalancePatterns = [
      // Standard balance patterns
      /(?:balance|bal|available|avbl)[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // M-Pesa balance patterns
      /new\s+(?:m-pesa\s+)?balance\s+is\s+(?:ksh\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      // Balance after amount patterns
      /(?:ksh\.?\s*|rs\.?\s*|₹\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(?:balance|bal|available)/gi,
      // Current balance patterns
      /current\s+balance[:\s]*(?:rs\.?\s*|₹\s*|ksh\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    let bestMatch = null;
    let bestConfidence = 0;

    for (const pattern of enhancedBalancePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(messageBody);
      
      if (match && match[1]) {
        const balanceStr = match[1].replace(/,/g, '');
        const balance = parseFloat(balanceStr);
        
        if (!isNaN(balance) && balance >= 0) {
          const confidence = this.calculateBalanceConfidence(match, messageBody);
          
          if (confidence > bestConfidence) {
            bestMatch = match;
            bestConfidence = confidence;
            result.balance = balance;
            result.rawMatch = match[0];
          }
        }
      }
    }

    result.confidence = bestConfidence;
    return result;
  }

  /**
   * Calculate confidence score for balance extraction
   */
  calculateBalanceConfidence(match, messageBody) {
    let confidence = 0.4; // Base confidence, lower than amount/balance

    // Higher confidence for explicit balance keywords
    if (/(?:balance|bal)/i.test(match[0])) {
      confidence += 0.3;
    }

    // Higher confidence for "available" or "current" balance
    if (/(?:available|current|new)/i.test(match[0])) {
      confidence += 0.2;
    }

    // Higher confidence for M-Pesa specific patterns
    if (/m-pesa/i.test(match[0])) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract account information when available
   */
  extractAccountInfo(messageBody) {
    const result = {
      accountNumber: null,
      accountType: null,
      cardLast4: null,
      confidence: 0
    };

    // Enhanced account patterns
    const accountPatterns = [
      // Full account number patterns (longer sequences are more confident)
      /(?:account|acc|a\/c|acct)[:\s]*(?:no\.?\s*)?(\d{6,20})/gi, // e.g., "Acc No 1234567890", "Account: 123456"
      // Card ending patterns
      /card\s+(?:ending\s+with\s+|no\.?\s*)([X*\-]*\d{4})/gi, // e.g., "card ending with 1234", "card no. XXXX1234"
      // UPI ID or VPA patterns
      /[a-zA-Z0-9.\-]+@[a-zA-Z0-9.\-]+/gi, // e.g., "user@bank"
      // Wallet/mobile money numbers (e.g., M-Pesa) - often 10-12 digits
      /(?:mobile|wallet|phone)\s*(?:no\.?\s*)?(\d{7,12})/gi, // e.g., "Mobile no 9876543210"
      // M-Pesa patterns for Paybill/Till
      /(?:paybill|till)\s+(?:no\.?\s*)?(\d{5,8})/gi, // e.g., "Paybill 12345"
      // Loan account patterns
      /(?:loan|ln)\s*(?:acc|account)[:\s]*(\d{6,15})/gi, // e.g., "Loan Acc: 1234567"
      // Cheque number
      /(?:cheque|chq)\s*(?:no\.?\s*)?(\d{6})/gi, // e.g., "Cheque no 123456"
      // Generic short account/card fragments (lower confidence)
      /(?:a\/c|acc|card)[:\s]*(\d{4,8})/gi // e.g., "A/c 1234" (more general, lower priority)
    ];

    let bestConfidence = 0;
    let extractedAccountNumber = null;
    let extractedCardLast4 = null;
    let extractedAccountType = null;

    for (const pattern of accountPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(messageBody);
      
      if (match && match[1]) {
        let currentConfidence = this.calculateAccountConfidence(match, messageBody, pattern);
        
        if (currentConfidence > bestConfidence) {
          bestConfidence = currentConfidence;
          const value = match[1].replace(/[X*-]/g, ''); // Clean up masking chars

          if (/(?:card)/i.test(match[0]) && value.length === 4) {
            extractedCardLast4 = value;
            extractedAccountNumber = null; // Prioritize card if it's clearly a card ending
          } else if (value.length >= 4) {
            extractedAccountNumber = value;
            extractedCardLast4 = null;
          }

          // Attempt to derive account type from the pattern or surrounding text
          if (/(?:savings|current|checking|loan)/i.test(match[0])) {
            const matchResult = match[0].match(/(savings|current|checking|loan)/i);
            extractedAccountType = matchResult ? matchResult[0].toLowerCase() : null;
          } else if (/(?:paybill|till)/i.test(match[0])) {
            extractedAccountType = 'mpesa_business';
          } else if (/@/i.test(value)) {
            extractedAccountType = 'upi';
          }
        }
      }
    }

    // Final assignment to result
    result.accountNumber = extractedAccountNumber;
    result.cardLast4 = extractedCardLast4;
    result.accountType = extractedAccountType;
    result.confidence = Math.min(bestConfidence, 1.0);
    return result;
  }

  /**
   * Calculate confidence score for account extraction
   */
  calculateAccountConfidence(match, messageBody, pattern) {
    let confidence = 0.2; // Base confidence, lower than amount/balance

    // Higher confidence for explicit keywords
    if (/(?:account|acc|a\/c|acct)/i.test(match[0])) {
      confidence += 0.3;
    }

    // Higher confidence for card patterns
    if (/card/i.test(match[0])) {
      confidence += 0.2;
    }

    // Higher confidence for UPI/VPA patterns
    if (/@/i.test(match[0])) {
      confidence += 0.25;
    }

    // Higher confidence for Paybill/Till numbers
    if (/(?:paybill|till)/i.test(match[0])) {
      confidence += 0.25;
    }

    // Higher confidence for longer account numbers
    if (match[1] && match[1].replace(/[X*-]/g, '').length >= 8) {
      confidence += 0.2;
    } else if (match[1] && match[1].replace(/[X*-]/g, '').length === 4 && /card/i.test(match[0])) {
      confidence += 0.15; // Still good for card last 4
    }

    // Boost if close to transaction keywords
    const context = messageBody.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50);
    if (/(?:transaction|payment|debited|credited|sent|received)/i.test(context)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract date/time from message timestamps and content
   */
  extractDateTime(message) {
    const result = {
      transactionDate: null,
      dateSource: 'message_timestamp',
      confidence: 0.8 // High confidence for message timestamp
    };

    // First, try to extract date from message content using PATTERN_UTILS
    const contentDate = PATTERN_UTILS.extractDateTime(message.body);
    if (contentDate) {
      result.transactionDate = contentDate;
      result.dateSource = 'message_content';
      result.confidence = 0.9;
      return result;
    }

    // Fall back to message timestamp
    if (message.timestamp) {
      result.transactionDate = new Date(message.timestamp);
      result.dateSource = 'message_timestamp';
      result.confidence = 0.8;
      return result;
    }

    // Last resort: current time
    result.transactionDate = new Date();
    result.dateSource = 'inferred';
    result.confidence = 0.3;

    return result;
  }

  /**
   * Extract transaction reference/ID
   */
  extractReference(messageBody) {
    const referencePatterns = [
      /(?:ref|reference|txn|transaction)[:\s]*([A-Z0-9]{6,20})/gi,
      /(?:id|ref)[:\s]*([A-Z0-9]{6,20})/gi,
      /([A-Z]{2}\d{8,12})/g, // Bank reference format
      /([0-9]{10,15})/g // Numeric reference
    ];

    for (const pattern of referencePatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(messageBody);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract merchant from message content
   */
  extractMerchantFromMessage(messageBody) {
    const merchantPatterns = [
      /(?:at|to|from)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /merchant[:\s]+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /(?:spent|paid)\s+at\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi
    ];

    for (const pattern of merchantPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(messageBody);
      if (match && match[1]) {
        return PATTERN_UTILS.cleanMerchantName(match[1]);
      }
    }

    return null;
  }

  /**
   * Check if message should contain balance information
   */
  shouldHaveBalance(messageBody) {
    const balanceKeywords = ['balance', 'bal', 'available', 'current'];
    const lowerMessage = messageBody.toLowerCase();
    return balanceKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Calculate overall extraction confidence
   */
  calculateExtractionConfidence(
    amountResult,
    balanceResult,
    accountResult,
    dateTimeResult,
    merchant,
    reference
  ) {
    let totalWeight = 0;
    let weightedScore = 0;

    // Amount extraction (40% weight)
    const amountWeight = 40;
    totalWeight += amountWeight;
    weightedScore += amountResult.confidence * amountWeight;

    // Date/time extraction (20% weight)
    const dateWeight = 20;
    totalWeight += dateWeight;
    weightedScore += dateTimeResult.confidence * dateWeight;

    // Balance extraction (15% weight)
    const balanceWeight = 15;
    totalWeight += balanceWeight;
    weightedScore += balanceResult.confidence * balanceWeight;

    // Account extraction (10% weight)
    const accountWeight = 10;
    totalWeight += accountWeight;
    weightedScore += accountResult.confidence * accountWeight;

    // Merchant extraction (10% weight)
    const merchantWeight = 10;
    totalWeight += merchantWeight;
    if (merchant) {
      weightedScore += merchantWeight;
    }

    // Reference extraction (5% weight)
    const referenceWeight = 5;
    totalWeight += referenceWeight;
    if (reference) {
      weightedScore += referenceWeight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight / 100 : 0;
  }

  /**
   * Validate extracted transaction data
   */
  validateExtractedData(data) {
    const errors = [];
    const warnings = [];

    // Validate amount
    if (data.amount === null) {
      errors.push('Amount is required but not found');
    } else if (data.amount <= 0) {
      errors.push('Amount must be greater than zero');
    }

    // Validate currency
    if (!data.currency) {
      warnings.push('Currency not detected, defaulting to INR');
    }

    // Validate date
    if (!data.transactionDate) {
      warnings.push('Transaction date not found');
    } else if (data.transactionDate > new Date()) {
      warnings.push('Transaction date is in the future');
    }

    // Validate account information
    if (!data.account) {
      warnings.push('No account information found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Format extracted data for display
   */
  formatExtractedData(data) {
    return {
      amount: data.amount ? formatAmount(data.amount, data.currency) : 'N/A',
      balance: data.balance ? formatAmount(data.balance, data.currency) : 'N/A',
      account: data.account || 'N/A',
      merchant: data.merchant || 'N/A',
      date: data.transactionDate ? formatDate(data.transactionDate) : 'N/A',
      reference: data.reference || 'N/A'
    };
  }
}

// Export singleton instance
export const transactionExtractor = TransactionExtractor.getInstance();