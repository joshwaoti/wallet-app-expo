/**
 * Message Parser Unit Tests
 * 
 * Comprehensive tests for the MessageParser service including financial message detection,
 * transaction type classification, merchant extraction, and confidence scoring.
 */

import { MessageParser, messageParser } from '../messageParser';
import { SMSMessage, TransactionType } from '../sms-types';

describe('MessageParser', () => {
  let parser;

  beforeEach(() => {
    // Reset singleton instance for testing
    (MessageParser as any).instance = null;
    parser = MessageParser.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MessageParser.getInstance();
      const instance2 = MessageParser.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export the singleton instance', () => {
      expect(messageParser).toBeInstanceOf(MessageParser);
    });
  });

  describe('Financial Message Detection', () => {
    it('should detect debit transaction messages', async () => {
      const message: SMSMessage = {
        id: 'test-1',
        sender: 'SBI',
        body: 'Dear Customer, Rs.500.00 debited from your account ending 1234 at AMAZON on 01-Jan-23. Available balance: Rs.10000.00',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.type).toBe(TransactionType.DEBIT);
      expect(result.transaction?.amount).toBe(500);
      expect(result.transaction?.merchant).toContain('Amazon');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect credit transaction messages', async () => {
      const message: SMSMessage = {
        id: 'test-2',
        sender: 'HDFC',
        body: 'Rs.2000.00 credited to your account ending 5678 on 01-Jan-23. Available balance: Rs.15000.00',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.type).toBe(TransactionType.CREDIT);
      expect(result.transaction?.amount).toBe(2000);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect balance inquiry messages', async () => {
      const message: SMSMessage = {
        id: 'test-3',
        sender: 'ICICI',
        body: 'Your account balance for account ending 9876 is Rs.25000.00 as on 01-Jan-23',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.type).toBe(TransactionType.BALANCE_INQUIRY);
      expect(result.transaction?.balance).toBe(25000);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should reject non-financial messages', async () => {
      const message: SMSMessage = {
        id: 'test-4',
        sender: 'PROMO',
        body: 'Get 50% off on your next purchase! Visit our store today.',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('financial keywords');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Bank Pattern Recognition', () => {
    it('should recognize SBI message patterns', async () => {
      const message: SMSMessage = {
        id: 'test-5',
        sender: 'SBI',
        body: 'Dear Customer, Rs.1500.00 debited for transaction at FLIPKART on 01-Jan-23. A/C 1234. Avbl Bal: Rs.8500.00',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.extractedData.bankPattern).toBe('State Bank of India');
      expect(result.transaction?.amount).toBe(1500);
      expect(result.transaction?.merchant).toContain('Flipkart');
      expect(result.transaction?.account).toBe('1234');
      expect(result.transaction?.balance).toBe(8500);
    });

    it('should recognize HDFC message patterns', async () => {
      const message: SMSMessage = {
        id: 'test-6',
        sender: 'HDFCBK',
        body: 'Purchase of Rs.750.00 at SWIGGY using card ending 5678 on 01-Jan-23. Balance: Rs.12250.00',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.extractedData.bankPattern).toBe('HDFC Bank');
      expect(result.transaction?.amount).toBe(750);
      expect(result.transaction?.merchant).toContain('Swiggy');
      expect(result.transaction?.account).toBe('5678');
    });

    it('should use generic pattern for unknown banks', async () => {
      const message: SMSMessage = {
        id: 'test-7',
        sender: 'UNKNOWN',
        body: 'Amount Rs.300.00 debited from account for transaction at CAFE on 01-Jan-23',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      
      expect(result.success).toBe(true);
      expect(result.transaction?.amount).toBe(300);
      expect(result.transaction?.merchant).toContain('Cafe');
    });
  });

  describe('Amount Extraction', () => {
    it('should extract amounts with different formats', async () => {
      const testCases = [
        { body: 'Rs.1,500.00 debited from account', expected: 1500 },
        { body: 'Amount INR 2500 credited to account', expected: 2500 },
        { body: '₹750.50 spent at merchant', expected: 750.50 },
        { body: 'Amt: Rs 1000 debited', expected: 1000 }
      ];

      for (const testCase of testCases) {
        const message: SMSMessage = {
          id: 'test-amount',
          sender: 'BANK',
          body: testCase.body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.transaction?.amount).toBe(testCase.expected);
      }
    });

    it('should handle invalid amount formats', async () => {
      const message: SMSMessage = {
        id: 'test-invalid',
        sender: 'BANK',
        body: 'Transaction debited from account with invalid amount',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.transaction?.amount).toBe(0);
    });
  });

  describe('Merchant Extraction', () => {
    it('should extract merchant names with different patterns', async () => {
      const testCases = [
        { body: 'Rs.500 debited at AMAZON INDIA', expected: 'Amazon India' },
        { body: 'Payment to FLIPKART INTERNET', expected: 'Flipkart Internet' },
        { body: 'Transaction from PAYTM WALLET', expected: 'Paytm Wallet' },
        { body: 'Spent at DOMINOS PIZZA', expected: 'Dominos Pizza' }
      ];

      for (const testCase of testCases) {
        const message: SMSMessage = {
          id: 'test-merchant',
          sender: 'BANK',
          body: testCase.body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.transaction?.merchant).toBe(testCase.expected);
      }
    });

    it('should handle messages without merchant information', async () => {
      const message: SMSMessage = {
        id: 'test-no-merchant',
        sender: 'BANK',
        body: 'Rs.500 debited from your account on 01-Jan-23',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.transaction?.merchant).toBeUndefined();
    });
  });

  describe('Transaction Type Classification', () => {
    it('should classify debit transactions correctly', async () => {
      const debitMessages = [
        'Rs.500 debited from account',
        'Amount withdrawn: Rs.1000',
        'Purchase of Rs.750 at merchant',
        'Transaction charged: Rs.200'
      ];

      for (const body of debitMessages) {
        const message: SMSMessage = {
          id: 'test-debit',
          sender: 'BANK',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.transaction?.type).toBe(TransactionType.DEBIT);
      }
    });

    it('should classify credit transactions correctly', async () => {
      const creditMessages = [
        'Rs.2000 credited to account',
        'Amount received: Rs.1500',
        'Salary deposited: Rs.50000',
        'Refund of Rs.300 processed'
      ];

      for (const body of creditMessages) {
        const message: SMSMessage = {
          id: 'test-credit',
          sender: 'BANK',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.transaction?.type).toBe(TransactionType.CREDIT);
      }
    });

    it('should classify balance inquiries correctly', async () => {
      const balanceMessages = [
        'Your account balance is Rs.10000',
        'Available balance: Rs.5000',
        'Current bal: Rs.25000'
      ];

      for (const body of balanceMessages) {
        const message: SMSMessage = {
          id: 'test-balance',
          sender: 'BANK',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.transaction?.type).toBe(TransactionType.BALANCE_INQUIRY);
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence to complete transactions', async () => {
      const message: SMSMessage = {
        id: 'test-high-confidence',
        sender: 'SBI',
        body: 'Dear Customer, Rs.1000.00 debited from account ending 1234 at AMAZON INDIA on 01-Jan-23. Available balance: Rs.9000.00',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should assign medium confidence to partial transactions', async () => {
      const message: SMSMessage = {
        id: 'test-medium-confidence',
        sender: 'BANK',
        body: 'Rs.500 debited from account on 01-Jan-23',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.confidence).toBeGreaterThan(0.4);
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('should assign low confidence to incomplete transactions', async () => {
      const message: SMSMessage = {
        id: 'test-low-confidence',
        sender: 'UNKNOWN',
        body: 'Transaction processed successfully',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.confidence).toBeLessThan(0.4);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple messages correctly', async () => {
      const messages: SMSMessage[] = [
        {
          id: 'batch-1',
          sender: 'SBI',
          body: 'Rs.500 debited from account at AMAZON',
          timestamp: new Date(),
          read: false
        },
        {
          id: 'batch-2',
          sender: 'HDFC',
          body: 'Rs.1000 credited to account',
          timestamp: new Date(),
          read: false
        },
        {
          id: 'batch-3',
          sender: 'PROMO',
          body: 'Get 50% off today!',
          timestamp: new Date(),
          read: false
        }
      ];

      const results = await parser.parseMessages(messages);
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);
    });

    it('should generate parsing statistics correctly', async () => {
      const messages: SMSMessage[] = [
        {
          id: 'stat-1',
          sender: 'SBI',
          body: 'Rs.500 debited from account',
          timestamp: new Date(),
          read: false
        },
        {
          id: 'stat-2',
          sender: 'HDFC',
          body: 'Rs.1000 credited to account',
          timestamp: new Date(),
          read: false
        }
      ];

      const results = await parser.parseMessages(messages);
      const stats = parser.getParsingStatistics(results);
      
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.transactionTypes[TransactionType.DEBIT]).toBe(1);
      expect(stats.transactionTypes[TransactionType.CREDIT]).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', async () => {
      const message: SMSMessage = {
        id: 'error-test',
        sender: '',
        body: '',
        timestamp: new Date(),
        read: false
      };

      const result = await parser.parseMessage(message);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.confidence).toBe(0);
    });

    it('should handle null/undefined inputs', async () => {
      const message = null as any;
      
      try {
        const result = await parser.parseMessage(message);
        expect(result.success).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Real Bank Message Samples', () => {
    it('should parse real SBI messages', async () => {
      const sbiMessages = [
        'Dear Customer, Rs.2,500.00 debited from your A/c No.XXXXXXXX1234 on 15-Jan-23 at AMAZON INDIA. Avbl Bal: Rs.47,500.00',
        'Dear Customer, Rs.50,000.00 credited to your A/c No.XXXXXXXX1234 on 15-Jan-23. Avbl Bal: Rs.97,500.00',
        'Dear Customer, your A/c No.XXXXXXXX1234 balance is Rs.97,500.00 as on 15-Jan-23 15:30:45'
      ];

      for (const body of sbiMessages) {
        const message: SMSMessage = {
          id: 'sbi-real',
          sender: 'SBI',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.success).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should parse real HDFC messages', async () => {
      const hdfcMessages = [
        'Thank you for using HDFC Bank Card ending 5678 for Rs.1,200.00 at SWIGGY on 15-Jan-23. Available limit: Rs.48,800.00',
        'Rs.25,000.00 credited to your HDFC Bank A/c ending 5678 on 15-Jan-23. Balance: Rs.73,800.00',
        'Your HDFC Bank A/c ending 5678 balance is Rs.73,800.00 as on 15-Jan-23'
      ];

      for (const body of hdfcMessages) {
        const message: SMSMessage = {
          id: 'hdfc-real',
          sender: 'HDFCBK',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.success).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should parse real M-Pesa messages', async () => {
      const mpesaMessages = [
        'Confirmed. You have sent Ksh500.00 to JOHN DOE 254712345678 on 15/1/23 at 2:30 PM. New M-PESA balance is Ksh2,500.00. Transaction cost Ksh0.00. Reference: ABC123DEF',
        'Confirmed. You have received Ksh1,200.00 from JANE SMITH 254798765432 on 15/1/23 at 3:45 PM. New M-PESA balance is Ksh3,700.00. Reference: XYZ789GHI',
        'Confirmed. Ksh300.00 sent to SAFARICOM for account 254712345678 on 15/1/23 at 4:15 PM. New M-PESA balance is Ksh3,400.00. Transaction cost Ksh0.00. Reference: DEF456JKL',
        'Confirmed. You have paid Ksh850.00 to SUPERMARKET TILL 123456 on 15/1/23 at 5:20 PM. New M-PESA balance is Ksh2,550.00. Transaction cost Ksh0.00. Reference: GHI789MNO'
      ];

      for (const body of mpesaMessages) {
        const message: SMSMessage = {
          id: 'mpesa-real',
          sender: 'MPESA',
          body,
          timestamp: new Date(),
          read: false
        };

        const result = await parser.parseMessage(message);
        expect(result.success).toBe(true);
        expect(result.transaction?.currency).toBe('KSH');
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });
  });
});