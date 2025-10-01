/**
 * Transaction Extractor Service Tests
 * 
 * Comprehensive unit tests for transaction extraction scenarios including
 * amount extraction, balance extraction, account parsing, date/time extraction,
 * and data validation.
 */

import { TransactionExtractor } from '../transactionExtractor';
// import { ExtractionResult, ExtractedTransactionData } from '../transactionExtractor';
// import { SMSMessage, TransactionType } from '../sms-types';

describe('TransactionExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = TransactionExtractor.getInstance();
  });

  describe('Amount Extraction', () => {
    test('should extract amount with INR currency symbol', () => {
      const result = extractor.extractAmount('Your account has been debited with ₹1,250.50 at AMAZON');
      
      expect(result.amount).toBe(1250.50);
      expect(result.currency).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.rawMatch).toContain('₹1,250.50');
    });

    test('should extract amount with Rs prefix', () => {
      const result = extractor.extractAmount('Amount Rs. 500.00 debited from your account');
      
      expect(result.amount).toBe(500.00);
      expect(result.currency).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract amount with KSH currency', () => {
      const result = extractor.extractAmount('You have sent KSH 1,000.00 to JOHN DOE');
      
      expect(result.amount).toBe(1000.00);
      expect(result.currency).toBe('KSH');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract amount without currency symbol', () => {
      const result = extractor.extractAmount('Transaction amount 2500 debited successfully');
      
      expect(result.amount).toBe(2500);
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should handle comma-separated amounts', () => {
      const result = extractor.extractAmount('Debited ₹12,34,567.89 from account');
      
      expect(result.amount).toBe(1234567.89);
      expect(result.currency).toBe('INR');
    });

    test('should return null for invalid amounts', () => {
      const result = extractor.extractAmount('Your OTP is 123456');
      
      expect(result.amount).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should handle M-Pesa transaction patterns', () => {
      const result = extractor.extractAmount('You have sent KSH 500.00 to JANE DOE on 15/01/24');
      
      expect(result.amount).toBe(500.00);
      expect(result.currency).toBe('KSH');
    });

    test('should extract amount from complex message', () => {
      const message = 'Dear Customer, your A/C XX1234 is debited for Rs.1,500.75 on 15-Jan-24 at GROCERY STORE. Available balance: Rs.25,000.00';
      const result = extractor.extractAmount(message);
      
      expect(result.amount).toBe(1500.75);
      expect(result.currency).toBe('INR');
    });
  });

  describe('Balance Extraction', () => {
    test('should extract balance with currency symbol', () => {
      const result = extractor.extractBalance('Available balance: ₹15,000.50');
      
      expect(result.balance).toBe(15000.50);
      expect(result.currency).toBe('INR');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract M-Pesa balance', () => {
      const result = extractor.extractBalance('New M-Pesa balance is KSH 2,500.00');
      
      expect(result.balance).toBe(2500.00);
      expect(result.currency).toBe('KSH');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract balance without currency', () => {
      const result = extractor.extractBalance('Current balance 10000');
      
      expect(result.balance).toBe(10000);
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    test('should handle abbreviated balance keywords', () => {
      const result = extractor.extractBalance('Avbl bal: Rs.5,000.00');
      
      expect(result.balance).toBe(5000.00);
      expect(result.currency).toBe('INR');
    });

    test('should return null when no balance found', () => {
      const result = extractor.extractBalance('Transaction completed successfully');
      
      expect(result.balance).toBeNull();
      expect(result.confidence).toBe(0);
    });

    test('should extract balance from end of message', () => {
      const result = extractor.extractBalance('Transaction successful. Rs.25,000.00 balance');
      
      expect(result.balance).toBe(25000.00);
      expect(result.currency).toBe('INR');
    });
  });

  describe('Account Information Extraction', () => {
    test('should extract account number', () => {
      const result = extractor.extractAccountInfo('Account No: 1234567890 debited');
      
      expect(result.accountNumber).toBe('1234567890');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract card last 4 digits (masked)', () => {
      const result = extractor.extractAccountInfo('Card ending XXXX1234 used for transaction');
      
      expect(result.cardLast4).toBe('1234');
      expect(result.accountNumber).toBeNull();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract UPI ID (VPA)', () => {
      const result = extractor.extractAccountInfo('Payment sent to user@bank.com');
      expect(result.accountNumber).toBe('user@bank.com');
      expect(result.accountType).toBe('upi');
      expect(result.confidence).toBeGreaterThan(0.4);
    });

    test('should extract mobile money/wallet number', () => {
      const result = extractor.extractAccountInfo('Received KSH 500 from mobile no 0712345678');
      expect(result.accountNumber).toBe('0712345678');
      expect(result.accountType).toBe('mpesa_business'); // Assuming generic mobile money treated as business for now
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should extract loan account number', () => {
      const result = extractor.extractAccountInfo('Your loan acc: 987654321 has been credited');
      expect(result.accountNumber).toBe('987654321');
      expect(result.accountType).toBe('loan');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should extract cheque number', () => {
      const result = extractor.extractAccountInfo('Cheque no 654321 cleared for payment');
      expect(result.accountNumber).toBe('654321');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should extract paybill number and type', () => {
      const result = extractor.extractAccountInfo('Paybill 123456 transaction confirmed');
      
      expect(result.accountNumber).toBe('123456');
      expect(result.accountType).toBe('mpesa_business');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    test('should extract account type', () => {
      const result = extractor.extractAccountInfo('Savings account debited with amount');
      
      expect(result.accountType).toBe('savings');
      expect(result.confidence).toBeGreaterThan(0.1);
    });

    test('should return null when no account info found', () => {
      const result = extractor.extractAccountInfo('Transaction completed');
      
      expect(result.accountNumber).toBeNull();
      expect(result.cardLast4).toBeNull();
      expect(result.accountType).toBeNull(); // Added check for accountType
      expect(result.confidence).toBe(0);
    });

    test('should prioritize specific account patterns over generic ones', () => {
      const result = extractor.extractAccountInfo('Acc No 1234567890. Card XXXX1234 used.');
      expect(result.accountNumber).toBe('1234567890'); // Should pick the full account number due to higher confidence in pattern
      expect(result.cardLast4).toBeNull();
      expect(result.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Date/Time Extraction', () => {
    test('should use message timestamp by default', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const message = {
        id: 'test-1',
        sender: 'BANK',
        body: 'Transaction completed',
        timestamp: testDate,
        read: false
      };

      const result = extractor.extractDateTime(message);
      
      expect(result.transactionDate).toEqual(testDate);
      expect(result.dateSource).toBe('message_timestamp');
      expect(result.confidence).toBe(0.8);
    });

    test('should extract date from message content', () => {
      const message = {
        id: 'test-2',
        sender: 'BANK',
        body: 'Transaction on 15/01/2024 completed successfully',
        timestamp: new Date(),
        read: false
      };

      const result = extractor.extractDateTime(message);
      
      expect(result.transactionDate?.getDate()).toBe(15);
      expect(result.transactionDate?.getMonth()).toBe(0); // January is 0
      expect(result.transactionDate?.getFullYear()).toBe(2024);
      expect(result.dateSource).toBe('message_content');
      expect(result.confidence).toBe(0.9);
    });

    test('should handle different date formats', () => {
      const testCases = [
        { text: 'Transaction on 15-01-2024', expected: { day: 15, month: 0, year: 2024 } },
        { text: 'Date: 15 Jan 2024', expected: { day: 15, month: 0, year: 2024 } },
        { text: 'On Jan 15, 2024', expected: { day: 15, month: 0, year: 2024 } },
        { text: 'Transaction on 15/01/24', expected: { day: 15, month: 0, year: 2024 } }
      ];

      testCases.forEach(testCase => {
        const message = {
          id: 'test',
          sender: 'BANK',
          body: testCase.text,
          timestamp: new Date(),
          read: false
        };

        const result = extractor.extractDateTime(message);
        
        expect(result.transactionDate?.getDate()).toBe(testCase.expected.day);
        expect(result.transactionDate?.getMonth()).toBe(testCase.expected.month);
        expect(result.transactionDate?.getFullYear()).toBe(testCase.expected.year);
      });
    });

    test('should fall back to current time when no date found', () => {
      const message = {
        id: 'test-3',
        sender: 'BANK',
        body: 'Transaction completed',
        timestamp: null as any,
        read: false
      };

      const result = extractor.extractDateTime(message);
      
      expect(result.transactionDate).toBeInstanceOf(Date);
      expect(result.dateSource).toBe('inferred');
      expect(result.confidence).toBe(0.3);
    });
  });

  describe('Complete Transaction Data Extraction', () => {
    test('should extract complete transaction data from SBI message', () => {
      const message = {
        id: 'sbi-test',
        sender: 'SBI',
        body: 'Dear Customer, your A/C XX1234 is debited for Rs.1,500.75 on 15-Jan-24 at GROCERY STORE. Available balance: Rs.25,000.00. Ref: TXN123456789',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(1500.75);
      expect(result.data?.currency).toBe('INR');
      expect(result.data?.balance).toBe(25000.00);
      expect(result.data?.account).toBe('1234');
      expect(result.data?.merchant).toBe('Grocery Store');
      expect(result.data?.reference).toBe('TXN123456789');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.errors).toHaveLength(0);
    });

    test('should extract M-Pesa transaction data', () => {
      const message = {
        id: 'mpesa-test',
        sender: 'MPESA',
        body: 'You have sent KSH 1,000.00 to JANE DOE on 15/01/24 at 10:30 AM. New M-Pesa balance is KSH 5,500.00. Transaction ID: ABC123DEF456',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(1000.00);
      expect(result.data?.currency).toBe('KSH');
      expect(result.data?.balance).toBe(5500.00);
      expect(result.data?.merchant).toBe('Jane Doe');
      expect(result.data?.reference).toBe('ABC123DEF456');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle incomplete transaction data', () => {
      const message = {
        id: 'incomplete-test',
        sender: 'BANK',
        body: 'Transaction completed successfully',
        timestamp: new Date(),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to extract transaction amount');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should provide warnings for missing optional data', () => {
      const message = {
        id: 'warning-test',
        sender: 'BANK',
        body: 'Amount Rs.500 debited from your account. Balance information not available.',
        timestamp: new Date(),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('No account information found');
      expect(result.data?.amount).toBe(500);
    });
  });

  describe('Data Validation', () => {
    test('should validate complete extracted data', () => {
      const data = {
        amount: 1000.50,
        currency: 'INR',
        balance: 5000.00,
        account: '1234567890',
        merchant: 'Test Merchant',
        transactionDate: new Date(),
        transactionId: 'TXN123',
        reference: 'REF456'
      };

      const result = extractor.validateExtractedData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const data = {
        amount: null,
        currency: 'INR',
        balance: null,
        account: null,
        merchant: null,
        transactionDate: null,
        transactionId: null,
        reference: null
      };

      const result = extractor.validateExtractedData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount is required but not found');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should detect invalid amounts', () => {
      const data = {
        amount: -100,
        currency: 'INR',
        balance: null,
        account: null,
        merchant: null,
        transactionDate: null,
        transactionId: null,
        reference: null
      };

      const result = extractor.validateExtractedData(data);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than zero');
    });

    test('should warn about future transaction dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const data = {
        amount: 100,
        currency: 'INR',
        balance: null,
        account: null,
        merchant: null,
        transactionDate: futureDate,
        transactionId: null,
        reference: null
      };

      const result = extractor.validateExtractedData(data);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Transaction date is in the future');
    });
  });

  describe('Data Formatting', () => {
    test('should format extracted data for display', () => {
      const data = {
        amount: 1250.50,
        currency: 'INR',
        balance: 15000.75,
        account: '1234567890',
        merchant: 'Test Merchant',
        transactionDate: new Date('2024-01-15T10:30:00Z'),
        transactionId: 'TXN123',
        reference: 'REF456'
      };

      const formatted = extractor.formatExtractedData(data);
      
      expect(formatted.amount).toContain('1250.50');
      expect(formatted.balance).toContain('15000.75');
      expect(formatted.account).toBe('1234567890');
      expect(formatted.merchant).toBe('Test Merchant');
      expect(formatted.reference).toBe('REF456');
      expect(formatted.date).toContain('2024');
    });

    test('should handle null values in formatting', () => {
      const data = {
        amount: null,
        currency: 'INR',
        balance: null,
        account: null,
        merchant: null,
        transactionDate: null,
        transactionId: null,
        reference: null
      };

      const formatted = extractor.formatExtractedData(data);
      
      expect(formatted.amount).toBe('N/A');
      expect(formatted.balance).toBe('N/A');
      expect(formatted.account).toBe('N/A');
      expect(formatted.merchant).toBe('N/A');
      expect(formatted.reference).toBe('N/A');
      expect(formatted.date).toBe('N/A');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed messages gracefully', () => {
      const message = {
        id: 'malformed-test',
        sender: '',
        body: '!@#$%^&*()_+{}|:"<>?[]\\;\',./',
        timestamp: new Date(),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
    });

    test('should handle very large amounts', () => {
      const result = extractor.extractAmount('Amount: Rs.99,99,99,999.99 debited');
      
      expect(result.amount).toBe(999999999.99);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle very small amounts', () => {
      const result = extractor.extractAmount('Amount: Rs.0.01 debited');
      
      expect(result.amount).toBe(0.01);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle multiple amounts in message', () => {
      const result = extractor.extractAmount('Debited Rs.100 and charged Rs.50 fee. Total Rs.150');
      
      // Should extract the first valid amount with highest confidence
      expect(result.amount).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle empty message body', () => {
      const message = {
        id: 'empty-test',
        sender: 'BANK',
        body: '',
        timestamp: new Date(),
        read: false
      };

      const result = extractor.extractTransactionData(message);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    test('should process multiple extractions efficiently', () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-${i}`,
        sender: 'BANK',
        body: `Transaction ${i}: Amount Rs.${100 + i}.00 debited from account`,
        timestamp: new Date(),
        read: false
      }));

      const startTime = Date.now();
      
      messages.forEach(message => {
        extractor.extractTransactionData(message);
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 100 messages in reasonable time (less than 1 second)
      expect(processingTime).toBeLessThan(1000);
    });

    test('should maintain consistent results for same input', () => {
      const message = {
        id: 'consistency-test',
        sender: 'BANK',
        body: 'Amount Rs.1,500.75 debited from account XX1234. Balance: Rs.10,000.00',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        read: false
      };

      const results = Array.from({ length: 10 }, () => 
        extractor.extractTransactionData(message)
      );

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.success).toBe(firstResult.success);
        expect(result.data?.amount).toBe(firstResult.data?.amount);
        expect(result.data?.balance).toBe(firstResult.data?.balance);
        expect(result.confidence).toBe(firstResult.confidence);
      });
    });
  });
});