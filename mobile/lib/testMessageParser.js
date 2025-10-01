/**
 * Message Parser Test Runner
 * 
 * Simple test runner to validate message parser functionality with sample bank SMS messages.
 */

import { messageParser } from './messageParser';
import { SMSMessage } from './sms-types';

// Sample bank SMS messages for testing
const sampleMessages = [
  // SBI Messages
  'Dear Customer, Rs.2,500.00 debited from your A/c No.XXXXXXXX1234 on 15-Jan-23 at AMAZON INDIA. Avbl Bal: Rs.47,500.00',
  'Dear Customer, Rs.50,000.00 credited to your A/c No.XXXXXXXX1234 on 15-Jan-23. Avbl Bal: Rs.97,500.00',
  'Dear Customer, your A/c No.XXXXXXXX1234 balance is Rs.97,500.00 as on 15-Jan-23 15:30:45',
  
  // HDFC Messages
  'Thank you for using HDFC Bank Card ending 5678 for Rs.1,200.00 at SWIGGY on 15-Jan-23. Available limit: Rs.48,800.00',
  'Rs.25,000.00 credited to your HDFC Bank A/c ending 5678 on 15-Jan-23. Balance: Rs.73,800.00',
  'Your HDFC Bank A/c ending 5678 balance is Rs.73,800.00 as on 15-Jan-23',
  
  // ICICI Messages
  'Dear Customer, INR 750.50 debited from A/c ending 9876 for transaction at DOMINOS PIZZA on 15-Jan-23. Available balance: INR 12,249.50',
  'Dear Customer, INR 5,000.00 credited to your A/c ending 9876 on 15-Jan-23. Available balance: INR 17,249.50',
  
  // Axis Bank Messages
  'Dear Customer, Rs.300.00 spent using Axis Bank Card ending 4321 at CAFE COFFEE DAY on 15-Jan-23. Balance: Rs.16,949.50',
  'Dear Customer, Rs.10,000.00 credited to your Axis Bank A/c ending 4321 on 15-Jan-23. Balance: Rs.26,949.50',
  
  // M-Pesa Messages
  'Confirmed. You have sent Ksh500.00 to JOHN DOE 254712345678 on 15/1/23 at 2:30 PM. New M-PESA balance is Ksh2,500.00. Transaction cost Ksh0.00. Reference: ABC123DEF',
  'Confirmed. You have received Ksh1,200.00 from JANE SMITH 254798765432 on 15/1/23 at 3:45 PM. New M-PESA balance is Ksh3,700.00. Reference: XYZ789GHI',
  'Confirmed. Ksh300.00 sent to SAFARICOM for account 254712345678 on 15/1/23 at 4:15 PM. New M-PESA balance is Ksh3,400.00. Transaction cost Ksh0.00. Reference: DEF456JKL',
  'Confirmed. You have paid Ksh850.00 to SUPERMARKET TILL 123456 on 15/1/23 at 5:20 PM. New M-PESA balance is Ksh2,550.00. Transaction cost Ksh0.00. Reference: GHI789MNO',
  
  // Generic Messages
  'Amount Rs.150.00 debited from account for UPI transaction to PAYTM WALLET on 15-Jan-23',
  'Rs.2,000.00 received in account from SALARY CREDIT on 15-Jan-23',
  
  // Non-financial messages (should be rejected)
  'Your OTP for login is 123456. Do not share with anyone.',
  'Get 50% off on your next purchase! Visit our store today.',
  'Congratulations! You have won a lottery of Rs.1,00,000. Click here to claim.'
];

async function runTests() {
  console.log('🚀 Starting Message Parser Tests...\n');
  
  const results = [];
  
  for (let i = 0; i < sampleMessages.length; i++) {
    const testMessage = {
      id: `test-${i + 1}`,
      sender: i < 3 ? 'SBI' : i < 6 ? 'HDFCBK' : i < 8 ? 'ICICIB' : i < 10 ? 'AXISBK' : i < 14 ? 'MPESA' : 'GENERIC',
      body: sampleMessages[i],
      timestamp: new Date(),
      read: false
    };

    console.log(`📱 Test ${i + 1}:`);
    console.log(`Sender: ${testMessage.sender}`);
    console.log(`Message: ${sampleMessages[i]}`);
    console.log('---');

    const result = await messageParser.parseMessage(testMessage);
    results.push(result);
    
    if (result.success && result.transaction) {
      console.log(`✅ Success: ${result.success}`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`💰 Type: ${result.transaction.type}`);
      console.log(`💵 Amount: ₹${result.transaction.amount}`);
      console.log(`🏪 Merchant: ${result.transaction.merchant || 'N/A'}`);
      console.log(`🏦 Account: ${result.transaction.account || 'N/A'}`);
      console.log(`💳 Balance: ${result.transaction.balance ? `₹${result.transaction.balance}` : 'N/A'}`);
      console.log(`🏛️ Bank Pattern: ${result.transaction.extractedData.bankPattern || 'Generic'}`);
      console.log(`🔍 Keywords: ${result.transaction.extractedData.keywords.join(', ') || 'None'}`);
    } else {
      console.log(`❌ Success: ${result.success}`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`⚠️ Error: ${result.error}`);
    }
    
    console.log(`⏱️ Processing Time: ${result.processingTime}ms`);
    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Generate statistics
  const stats = messageParser.getParsingStatistics(results);
  
  console.log('📊 PARSING STATISTICS:');
  console.log('='.repeat(50));
  console.log(`📈 Total Messages: ${stats.total}`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`🎯 Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  console.log(`⏱️ Average Processing Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
  console.log('\n📋 Transaction Types:');
  
  Object.entries(stats.transactionTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  
  console.log('\n🎉 Message Parser Tests Completed!');
  
  // Summary
  const successRate = (stats.successful / stats.total) * 100;
  console.log(`\n📝 SUMMARY:`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`Expected: Financial messages should succeed, non-financial should fail`);
  
  if (successRate >= 75) {
    console.log('🟢 RESULT: Tests PASSED - Parser is working correctly!');
  } else {
    console.log('🔴 RESULT: Tests FAILED - Parser needs improvement');
  }
}

// Export the test function for manual execution

export { runTests };