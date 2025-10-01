/**
 * Banking Pattern Constants and Regex Definitions
 * 
 * This file contains regex patterns and constants for detecting and parsing
 * financial transactions from SMS messages from various banks and financial institutions.
 */



// Common Financial Keywords
export const FINANCIAL_KEYWORDS = {
  DEBIT: ['debited', 'debit', 'withdrawn', 'spent', 'paid', 'purchase', 'transaction', 'charged', 'sent'],
  CREDIT: ['credited', 'credit', 'received', 'deposited', 'refund', 'cashback', 'salary', 'got'],
  BALANCE: ['balance', 'bal', 'available', 'current balance', 'account balance', 'new balance'],
  AMOUNT: ['rs', 'inr', 'usd', 'amount', 'amt', 'ksh'],
  ACCOUNT: ['account', 'acc', 'a/c', 'card ending', 'card no', 'paybill', 'till', 'reference'],
  MERCHANT: ['at', 'to', 'from', 'merchant', 'store', 'shop', 'paybill', 'till']
};

// Common Amount Patterns
export const AMOUNT_PATTERNS = [
  /(?:rs\.?\s*|inr\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|inr|₹)/gi,
  /(?:ksh\.?\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ksh\.?)/gi,
  /amount[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /amt[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  // Generic currency symbols and more flexible amount placements
  /(?:usd\s*|\$\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // USD or $ prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:usd|\$)/gi,     // USD or $ suffix
  /(?:e.?g.?\s*|eur\s*|€\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // EUR or € prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:e.?g.?|eur|€)/gi,     // EUR or € suffix
  /(?:gbp\s*|£\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // GBP or £ prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:gbp|£)/gi,     // GBP or £ suffix
  /(?:cad\s*|c\$\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // CAD or C$ prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:cad|c\$)/gi,     // CAD or C$ suffix
  /(?:aud\s*|a\$\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // AUD or A$ prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:aud|a\$)/gi,     // AUD or A$ suffix
  /(?:chf\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // CHF prefix
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:chf)/gi,     // CHF suffix
  /total\s*(?:amount)?:\s*(?:[A-Z]{2,4}\s*|\W{1})?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // 'Total amount: $100.00'
  /deducted\s+(?:of)?\s*(?:[A-Z]{2,4}\s*|\W{1})?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // 'deducted of $100'
  /charged\s+(?:for)?\s*(?:[A-Z]{2,4}\s*|\W{1})?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // 'charged for $100'
  /value[:\s]*(?:[A-Z]{2,4}\s*|\W{1})?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // 'Value: $100.00'
];

// Common Merchant Patterns
export const MERCHANT_PATTERNS = [
  /(?:at|to|from)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
  /merchant[:\s]+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
  /(?:spent|paid)\s+at\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
  /(?:sent\s+to|received\s+from)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
  /pay\s+bill\s+for\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
  // More flexible merchant patterns
  /(?:for|via|ref)\s+([A-Z][A-Z0-9\s&.-]{2,30})\s*(?:txn|transaction)/gi, // e.g., 'for AMAZON txn'
  /(?:purchase|payment)\s+(?:from|to|at)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi, // e.g., 'payment from Spotify'
  /(?:transaction\s+with|on)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi, // e.g., 'transaction with Uber'
  /billed\s+by\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi, // e.g., 'billed by Netflix'
  /recharge\s+of\s+\S+\s+at\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi, // e.g., 'recharge of 100 at Vodafone'
];

// Common Account Patterns
export const ACCOUNT_PATTERNS = [
  /(?:account|acc|a\/c)[:\s]*(?:no\.?\s*)?(\d{4,16})/gi,
  /card\s+ending\s+(\d{4})/gi,
  /card\s+no\.?\s*(\d{4})/gi,
  /(?:paybill|till)\s+(\d+)/gi,
  /reference[:\s]*(\w+)/gi,
  // More flexible account patterns
  /wallet\s*(?:id|no)?[:\s]*(\w+)/gi, // e.g., 'wallet id W12345'
  /(?:upi|vpa)[:\s]*([\w.-]+@[\w.-]+)/gi, // e.g., 'UPI: user@bank'
  /from\s+(?:account|a\/c)[:\s]*(?:X+|\*+)?(\d{4})/gi, // e.g., 'from account XXXX1234'
  /to\s+(?:account|a\/c)[:\s]*(?:X+|\*+)?(\d{4})/gi, // e.g., 'to account XXXX5678'
];

// Balance Patterns
export const BALANCE_PATTERNS = [
  /(?:balance|bal)[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(?:available|avbl)[:\s]*(?:rs\.?\s*|inr\s*|₹\s*|ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /new\s+(?:m-pesa\s+)?balance\s+is\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:balance|bal)/gi
];

// Common Date/Time Patterns
export const DATETIME_PATTERNS = [
  /on\s+(\d{2}-\d{2}-\d{4})\s+at\s+(\d{2}:\d{2})/gi, // DD-MM-YYYY at HH:MM
  /on\s+(\d{2}\/\d{2}\/\d{4})\s+at\s+(\d{2}:\d{2})/gi, // DD/MM/YYYY at HH:MM
  /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})/gi, // DD.MM.YYYY HH:MM
  /(\d{2}\/[A-Za-z]{3}\/\d{4})\s+(\d{2}:\d{2})/gi, // DD/MON/YYYY HH:MM
  /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi, // 1 Jan 2024 10:30 AM
  /date[:\s]*(\d{2}-\d{2}-\d{4})\s+time[:\s]*(\d{2}:\d{2})/gi, // Date: DD-MM-YYYY Time: HH:MM
  /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/gi, // ISO 8601 like 2024-01-01T10:30:00Z
  /(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})/gi, // 1 Jan 24 or 1 Jan 2024
  /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/gi, // 10:30, 10:30:00, 10:30 AM
];

// Generic Banking Pattern
export const GENERIC_BANK_PATTERN = {
  name: 'Generic Bank',
  senderPatterns: [
    /^[A-Z]{2,6}-\d{6}$/,  // Format: BANK-123456
    /^[A-Z]{2,10}$/,       // Format: BANKNAME
    /^\d{5,6}$/            // Format: 123456
  ],
  debitPatterns: [
    /(?:debited|debit|withdrawn|spent|paid|purchase|transaction|charged)/gi
  ],
  creditPatterns: [
    /(?:credited|credit|received|deposited|refund|cashback|salary)/gi
  ],
  balancePatterns: BALANCE_PATTERNS,
  amountPatterns: AMOUNT_PATTERNS,
  merchantPatterns: MERCHANT_PATTERNS,
  accountPatterns: ACCOUNT_PATTERNS,
  keywords: [
    'bank', 'transaction', 'payment', 'transfer', 'account', 'card',
    'debit', 'credit', 'balance', 'amount', 'merchant'
  ],
  excludeKeywords: [
    'otp', 'verification', 'code', 'login', 'password', 'pin',
    'offer', 'advertisement', 'promo', 'marketing'
  ]
};

// Specific Bank Patterns
export const BANK_PATTERNS = {
  SBI: {
    name: 'State Bank of India',
    senderPatterns: [/^SBI$/i, /^SBIPSG$/i, /^SBI-\d{6}$/i],
    debitPatterns: [
      /debited\s+for\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /spent\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    creditPatterns: [
      /credited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /received\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    balancePatterns: [
      /avbl\s+bal\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    amountPatterns: AMOUNT_PATTERNS,
    merchantPatterns: [
      /at\s+([A-Z][A-Z0-9\s&.-]{2,30})\s+on/gi
    ],
    accountPatterns: [
      /a\/c\s+(\d{4})/gi
    ],
    keywords: ['sbi', 'state bank', 'debited', 'credited', 'avbl bal'],
    excludeKeywords: ['otp', 'alert']
  },

  HDFC: {
    name: 'HDFC Bank',
    senderPatterns: [/^HDFC$/i, /^HDFCBK$/i, /^HDFC-\d{6}$/i],
    debitPatterns: [
      /debited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /purchase\s+of\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    creditPatterns: [
      /credited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    balancePatterns: [
      /balance\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    amountPatterns: AMOUNT_PATTERNS,
    merchantPatterns: [
      /at\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi
    ],
    accountPatterns: [
      /card\s+ending\s+(\d{4})/gi
    ],
    keywords: ['hdfc', 'debited', 'credited', 'purchase', 'balance'],
    excludeKeywords: ['otp', 'verification']
  },

  ICICI: {
    name: 'ICICI Bank',
    senderPatterns: [/^ICICI$/i, /^ICICIB$/i, /^ICICI-\d{6}$/i],
    debitPatterns: [
      /debited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /transaction\s+of\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    creditPatterns: [
      /credited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    balancePatterns: [
      /available\s+balance\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    amountPatterns: AMOUNT_PATTERNS,
    merchantPatterns: MERCHANT_PATTERNS,
    accountPatterns: ACCOUNT_PATTERNS,
    keywords: ['icici', 'debited', 'credited', 'transaction', 'available balance'],
    excludeKeywords: ['otp', 'code']
  },

  AXIS: {
    name: 'Axis Bank',
    senderPatterns: [/^AXIS$/i, /^AXISBK$/i, /^AXIS-\d{6}$/i],
    debitPatterns: [
      /debited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /spent\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    creditPatterns: [
      /credited\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    balancePatterns: [
      /balance\s+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    amountPatterns: AMOUNT_PATTERNS,
    merchantPatterns: MERCHANT_PATTERNS,
    accountPatterns: ACCOUNT_PATTERNS,
    keywords: ['axis', 'debited', 'credited', 'spent', 'balance'],
    excludeKeywords: ['otp', 'alert']
  },

  MPESA: {
    name: 'M-Pesa',
    senderPatterns: [/^MPESA$/i, /^M-PESA$/i, /^SAFARICOM$/i],
    debitPatterns: [
      /(?:sent|paid)\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /you\s+have\s+sent\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+sent\s+to/gi,
      /pay\s+bill.*?(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    creditPatterns: [
      /(?:received|got)\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /you\s+have\s+received\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+received\s+from/gi,
      /deposit.*?(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    balancePatterns: [
      /(?:balance|bal).*?(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:balance|bal)/gi,
      /new\s+(?:m-pesa\s+)?balance\s+is\s+(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ],
    amountPatterns: [
      /(?:ksh\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ksh\.?)/gi
    ],
    merchantPatterns: [
      /(?:to|from)\s+([A-Z][A-Z0-9\s&.-]{2,30})\s+on/gi,
      /(?:sent\s+to|received\s+from)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /pay\s+bill\s+for\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi,
      /(?:paybill|till)\s+(\d+)\s+([A-Z][A-Z0-9\s&.-]{2,30})/gi
    ],
    accountPatterns: [
      /(?:paybill|till)\s+(\d+)/gi,
      /account\s+(\w+)/gi,
      /reference\s+(\w+)/gi
    ],
    keywords: [
      'mpesa', 'm-pesa', 'safaricom', 'sent', 'received', 'paid', 'deposit',
      'paybill', 'till', 'balance', 'ksh', 'transaction', 'confirmed'
    ],
    excludeKeywords: ['pin', 'code', 'verification', 'registration']
  }
};

// Pattern Matching Utilities
export const PATTERN_UTILS = {
  // Check if sender matches any bank pattern
  matchesBankSender: (sender) => {
    for (const [bankName, pattern] of Object.entries(BANK_PATTERNS)) {
      if (pattern.senderPatterns.some(regex => regex.test(sender))) {
        return bankName;
      }
    }
    return null;
  },

  // Check if message contains financial keywords
  containsFinancialKeywords: (message) => {
    const allKeywords = [
      ...FINANCIAL_KEYWORDS.DEBIT,
      ...FINANCIAL_KEYWORDS.CREDIT,
      ...FINANCIAL_KEYWORDS.BALANCE,
      ...FINANCIAL_KEYWORDS.AMOUNT
    ];
    
    const lowerMessage = message.toLowerCase();
    return allKeywords.some(keyword => lowerMessage.includes(keyword));
  },

  // Extract amount from message
  extractAmount: (message) => {
    for (const pattern of AMOUNT_PATTERNS) {
      const match = pattern.exec(message);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
    return null;
  },

  // Detect currency from message
  detectCurrency: (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('ksh') || lowerMessage.includes('safaricom') || lowerMessage.includes('mpesa') || lowerMessage.includes('m-pesa')) {
      return 'KSH';
    }
    if (lowerMessage.includes('₹') || lowerMessage.includes('rs') || lowerMessage.includes('inr')) {
      return 'INR';
    }
    if (lowerMessage.includes('usd') || lowerMessage.includes('$')) {
      return 'USD';
    }
    return 'INR'; // Default to INR
  },

  // Clean and format merchant name
  cleanMerchantName: (merchant) => {
    return merchant
      .trim()
      .replace(/[^\w\s&.-]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Extract date and time from message
  extractDateTime: (message) => {
    const now = new Date();
    const lowerMessage = message.toLowerCase();

    for (const pattern of DATETIME_PATTERNS) {
      const match = pattern.exec(message);
      if (match) {
        // Handle different date/time formats
        let year = now.getFullYear();
        let month = now.getMonth();
        let day = now.getDate();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = 0;

        if (match[1] && match[2]) { // Date and Time captured (e.g., DD-MM-YYYY at HH:MM)
          const [datePart, timePart] = [match[1], match[2]];
          let dateSegments;
          if (datePart.includes('-')) dateSegments = datePart.split('-');
          else if (datePart.includes('/')) dateSegments = datePart.split('/');
          else if (datePart.includes('.')) dateSegments = datePart.split('.');
          else {
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const parts = datePart.split(' ');
            day = parseInt(parts[0]);
            month = monthNames.indexOf(parts[1].toLowerCase());
            year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]); // Handle YY and YYYY
          }

          if (dateSegments) {
            day = parseInt(dateSegments[0]);
            month = parseInt(dateSegments[1]) - 1; // Month is 0-indexed
            year = parseInt(dateSegments[2]);
          }

          const timeSegments = timePart.split(':');
          hours = parseInt(timeSegments[0]);
          minutes = parseInt(timeSegments[1]);
          if (timePart.toLowerCase().includes('pm') && hours < 12) hours += 12;
          if (timePart.toLowerCase().includes('am') && hours === 12) hours = 0;

        } else if (match[1] && !match[2]) { // Only Date or Only Time (e.g., ISO 8601 or 1 Jan 2024)
          if (match[1].includes('T') && match[1].includes(':')) { // ISO 8601
            return new Date(match[1]);
          } else if (match[1].includes(':')) { // Only Time (HH:MM or HH:MM:SS AM/PM)
            const timePart = match[1];
            const timeSegments = timePart.split(':');
            hours = parseInt(timeSegments[0]);
            minutes = parseInt(timeSegments[1]);
            if (timeSegments[2]) seconds = parseInt(timeSegments[2].replace(/(am|pm)/i, ''));
            if (timePart.toLowerCase().includes('pm') && hours < 12) hours += 12;
            if (timePart.toLowerCase().includes('am') && hours === 12) hours = 0;

            // Use current date with extracted time
            return new Date(year, month, day, hours, minutes, seconds);
          } else { // Only Date (e.g., 1 Jan 2024)
            const datePart = match[1];
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const parts = datePart.split(' ');
            day = parseInt(parts[0]);
            month = monthNames.indexOf(parts[1].toLowerCase());
            year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]); // Handle YY and YYYY

            // Use current time with extracted date
            return new Date(year, month, day, hours, minutes, seconds);
          }
        }

        const extractedDate = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(extractedDate.getTime())) {
          return extractedDate;
        }
      }
    }
    return null;
  },
};

// Export all patterns for easy access
export const ALL_PATTERNS = {
  FINANCIAL_KEYWORDS,
  AMOUNT_PATTERNS,
  MERCHANT_PATTERNS,
  ACCOUNT_PATTERNS,
  BALANCE_PATTERNS,
  DATETIME_PATTERNS, // Add new export
  GENERIC_BANK_PATTERN,
  BANK_PATTERNS,
  PATTERN_UTILS
};