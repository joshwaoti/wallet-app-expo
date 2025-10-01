/**
 * Message Parser Service
 * 
 * This service handles parsing SMS messages to detect financial transactions,
 * classify transaction types, extract merchant information, and calculate confidence scores.
 */


import {
  BANK_PATTERNS,
  FINANCIAL_KEYWORDS,
  AMOUNT_PATTERNS,
  MERCHANT_PATTERNS,
  ACCOUNT_PATTERNS,
  BALANCE_PATTERNS,
  PATTERN_UTILS
} from './bankingPatterns';

import {
  generateId,
  calculateConfidence,
  sanitizeString,
  capitalizeWords
} from './validation';

export class MessageParser {
  static instance;

  constructor() {}

  static getInstance() {
    if (!MessageParser.instance) {
      MessageParser.instance = new MessageParser();
    }
    return MessageParser.instance;
  }

  /**
   * Parse an SMS message to detect financial transactions
   */
  async parseMessage(message) {
    const startTime = Date.now();

    try {
      // Step 1: Check if message contains financial keywords
      if (!this.isFinancialMessage(message.body)) {
        return {
          success: false,
          error: 'Message does not contain financial keywords',
          confidence: 0,
          processingTime: Date.now() - startTime
        };
      }

      // Step 2: Identify bank pattern
      const bankPattern = this.identifyBankPattern(message.sender, message.body);

      // Step 3: Extract transaction data
      const extractedData = this.extractTransactionData(message.body, bankPattern);

      // Step 4: Classify transaction type
      const transactionType = this.classifyTransactionType(message.body, extractedData);

      // Step 5: Extract merchant information
      const merchant = this.extractMerchant(message.body, extractedData);

      // Step 6: Extract amount
      const amount = this.extractAmount(message.body, extractedData);

      // Step 7: Extract account information
      const account = this.extractAccount(message.body, extractedData);

      // Step 8: Extract balance
      const balance = this.extractBalance(message.body, extractedData);

      // Step 9: Calculate confidence score
      const confidence = this.calculateConfidenceScore(extractedData, amount, transactionType, merchant);

      // Step 10: Detect currency
      const currency = PATTERN_UTILS.detectCurrency(message.body);

      // Step 11: Create parsed transaction
      const parsedTransaction = {
        id: generateId(),
        messageId: message.id,
        type: transactionType,
        amount: amount || 0,
        currency: currency,
        merchant: merchant,
        account: account,
        balance: balance,
        timestamp: message.timestamp,
        confidence: confidence,
        rawMessage: message.body,
        extractedData: extractedData
      };

      return {
        success: true,
        transaction: parsedTransaction,
        confidence: confidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if message contains financial keywords
   */
  isFinancialMessage(messageBody) {
    return PATTERN_UTILS.containsFinancialKeywords(messageBody);
  }

  /**
   * Identify which bank pattern matches the sender and message content
   */
  identifyBankPattern(sender, messageBody) {
    // First, try to match by sender
    const bankName = PATTERN_UTILS.matchesBankSender(sender);
    if (bankName && BANK_PATTERNS[bankName]) {
      return BANK_PATTERNS[bankName];
    }

    // If no sender match, try to identify by message content keywords
    const lowerMessage = messageBody.toLowerCase();
    
    for (const [bankName, pattern] of Object.entries(BANK_PATTERNS)) {
      const hasKeywords = pattern.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      
      if (hasKeywords) {
        return pattern;
      }
    }

    // Return generic pattern if no specific bank identified
    return BANK_PATTERNS.GENERIC || null;
  }

  /**
   * Extract transaction data using regex patterns
   */
  extractTransactionData(messageBody, bankPattern) {
    const extractedData = {
      keywords: [],
      bankPattern: bankPattern?.name
    };

    // Extract keywords
    extractedData.keywords = this.extractKeywords(messageBody);

    // Extract amount
    extractedData.amountMatch = this.findPatternMatch(messageBody, AMOUNT_PATTERNS);

    // Extract merchant
    extractedData.merchantMatch = this.findPatternMatch(messageBody, MERCHANT_PATTERNS);

    // Extract account
    extractedData.accountMatch = this.findPatternMatch(messageBody, ACCOUNT_PATTERNS);

    // Extract balance
    extractedData.balanceMatch = this.findPatternMatch(messageBody, BALANCE_PATTERNS);

    // Use bank-specific patterns if available
    if (bankPattern) {
      // Try bank-specific amount patterns
      if (!extractedData.amountMatch) {
        extractedData.amountMatch = this.findPatternMatch(messageBody, bankPattern.amountPatterns);
      }

      // Try bank-specific merchant patterns
      if (!extractedData.merchantMatch) {
        extractedData.merchantMatch = this.findPatternMatch(messageBody, bankPattern.merchantPatterns);
      }

      // Try bank-specific account patterns
      if (!extractedData.accountMatch) {
        extractedData.accountMatch = this.findPatternMatch(messageBody, bankPattern.accountPatterns);
      }

      // Try bank-specific balance patterns
      if (!extractedData.balanceMatch) {
        extractedData.balanceMatch = this.findPatternMatch(messageBody, bankPattern.balancePatterns);
      }
    }

    return extractedData;
  }

  /**
   * Find the first matching pattern in the message
   */
  findPatternMatch(message, patterns) {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  /**
   * Extract financial keywords from message
   */
  extractKeywords(messageBody) {
    const keywords = [];
    const lowerMessage = messageBody.toLowerCase();

    // Check for debit keywords
    FINANCIAL_KEYWORDS.DEBIT.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });

    // Check for credit keywords
    FINANCIAL_KEYWORDS.CREDIT.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });

    // Check for balance keywords
    FINANCIAL_KEYWORDS.BALANCE.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });

    return keywords;
  }

  /**
   * Classify transaction type based on keywords and patterns
   */
  classifyTransactionType(messageBody, extractedData) {
    const lowerMessage = messageBody.toLowerCase();
    const keywords = extractedData.keywords.map(k => k.toLowerCase());

    // Check for balance inquiry keywords
    const hasBalanceKeywords = FINANCIAL_KEYWORDS.BALANCE.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (hasBalanceKeywords && extractedData.balanceMatch) {
      return "BALANCE_INQUIRY";
    }

    // Check for debit keywords
    const hasDebitKeywords = FINANCIAL_KEYWORDS.DEBIT.some(keyword => 
      keywords.includes(keyword.toLowerCase())
    );

    if (hasDebitKeywords) {
      return "DEBIT";
    }

    // Check for credit keywords
    const hasCreditKeywords = FINANCIAL_KEYWORDS.CREDIT.some(keyword => 
      keywords.includes(keyword.toLowerCase())
    );

    if (hasCreditKeywords) {
      return "CREDIT";
    }

    // Default to unknown if no clear classification
    return "UNKNOWN";
  }

  /**
   * Extract merchant name from message
   */
  extractMerchant(messageBody, extractedData) {
    if (extractedData.merchantMatch && extractedData.merchantMatch[1]) {
      const rawMerchant = extractedData.merchantMatch[1];
      return this.cleanMerchantName(rawMerchant);
    }

    // Try additional merchant extraction patterns
    const merchantPatterns = [
      /(?:at|to|from)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /(?:spent|paid)\s+at\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /merchant[:\s]+([A-Z][A-Z0-9\s&.-]{2,30})/gi
    ];

    for (const pattern of merchantPatterns) {
      const match = messageBody.match(pattern);
      if (match && match[1]) {
        return this.cleanMerchantName(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Clean and format merchant name
   */
  cleanMerchantName(merchant) {
    return PATTERN_UTILS.cleanMerchantName(merchant);
  }

  /**
   * Extract transaction amount
   */
  extractAmount(messageBody, extractedData) {
    if (extractedData.amountMatch && extractedData.amountMatch[1]) {
      const amountStr = extractedData.amountMatch[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      return !isNaN(amount) && amount > 0 ? amount : undefined;
    }

    // Fallback to utility function
    const amount = PATTERN_UTILS.extractAmount(messageBody);
    return amount !== null ? amount : undefined;
  }

  /**
   * Extract account information
   */
  extractAccount(messageBody, extractedData) {
    if (extractedData.accountMatch && extractedData.accountMatch[1]) {
      return extractedData.accountMatch[1];
    }

    return undefined;
  }

  /**
   * Extract balance information
   */
  extractBalance(messageBody, extractedData) {
    if (extractedData.balanceMatch && extractedData.balanceMatch[1]) {
      const balanceStr = extractedData.balanceMatch[1].replace(/,/g, '');
      const balance = parseFloat(balanceStr);
      return !isNaN(balance) && balance >= 0 ? balance : undefined;
    }

    return undefined;
  }

  /**
   * Calculate confidence score for the parsed transaction
   */
  calculateConfidenceScore(
    extractedData,
    amount,
    transactionType,
    merchant
  ) {
    let score = 0;
    let maxScore = 0;

    // Amount extraction (40% weight)
    maxScore += 40;
    if (amount && amount > 0) {
      score += 40;
    }

    // Transaction type classification (25% weight)
    maxScore += 25;
    if (transactionType !== "UNKNOWN") {
      score += 25;
    }

    // Merchant extraction (15% weight)
    maxScore += 15;
    if (merchant) {
      score += 15;
    }

    // Keywords found (10% weight)
    maxScore += 10;
    if (extractedData.keywords.length > 0) {
      score += Math.min(extractedData.keywords.length * 3, 10);
    }

    // Bank pattern match (5% weight)
    maxScore += 5;
    if (extractedData.bankPattern) {
      score += 5;
    }

    // Account information (3% weight)
    maxScore += 3;
    if (extractedData.accountMatch) {
      score += 3;
    }

    // Balance information (2% weight)
    maxScore += 2;
    if (extractedData.balanceMatch) {
      score += 2;
    }

    return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  }

  /**
   * Parse multiple messages in batch
   */
  async parseMessages(messages) {
    const results = [];

    for (const message of messages) {
      const result = await this.parseMessage(message);
      results.push(result);
    }

    return results;
  }

  /**
   * Get parsing statistics for a batch of results
   */
  getParsingStatistics(results) {
    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageConfidence: 0,
      averageProcessingTime: 0,
      transactionTypes: {}
    };

    if (results.length > 0) {
      // Calculate average confidence
      const confidenceSum = results.reduce((sum, r) => sum + r.confidence, 0);
      stats.averageConfidence = confidenceSum / results.length;

      // Calculate average processing time
      const timeSum = results.reduce((sum, r) => sum + r.processingTime, 0);
      stats.averageProcessingTime = timeSum / results.length;

      // Count transaction types
      results.forEach(result => {
        if (result.success && result.transaction) {
          const type = result.transaction.type;
          stats.transactionTypes[type] = (stats.transactionTypes[type] || 0) + 1;
        }
      });
    }

    return stats;
  }

  /**
   * Test message parsing with sample data
   */
  async testParsing(sampleMessages) {
    console.log('Testing Message Parser with sample data...\n');

    for (let i = 0; i < sampleMessages.length; i++) {
      const testMessage = {
        id: `test-${i}`,
        sender: 'TEST-BANK',
        body: sampleMessages[i],
        timestamp: new Date(),
        read: false
      };

      const result = await this.parseMessage(testMessage);
      
      console.log(`Test ${i + 1}:`);
      console.log(`Message: ${sampleMessages[i]}`);
      console.log(`Success: ${result.success}`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
      if (result.success && result.transaction) {
        console.log(`Type: ${result.transaction.type}`);
        console.log(`Amount: ${result.transaction.amount}`);
        console.log(`Merchant: ${result.transaction.merchant || 'N/A'}`);
      } else {
        console.log(`Error: ${result.error}`);
      }
      
      console.log(`Processing Time: ${result.processingTime}ms\n`);
    }
  }
}

// Export singleton instance
export const messageParser = MessageParser.getInstance();