/**
 * Simple JavaScript test runner for Message Parser
 */

const { runTests } = require('./testMessageParser');

// Run the tests
runTests()
  .then(() => {
    console.log('\n✅ Test execution completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });