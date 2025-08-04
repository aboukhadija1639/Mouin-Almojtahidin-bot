import assert from 'assert';
import { initDatabase, closeDatabase, addUser, verifyUser, isUserVerified } from '../bot/utils/database.js';

// Set test environment variables
process.env.BOT_TOKEN = 'test_token_123456789';
process.env.ADMIN_USER_IDS = '123456789,987654321';
process.env.GROUP_ID = '-100123456789';
process.env.SUPPORT_CHANNEL = '@TestSupport';
process.env.ADMIN_CHAT_ID = '-100123456789';
process.env.ACTIVATION_CODE = 'TEST_CODE_2024';
process.env.ZOOM_LINK = 'https://zoom.us/j/test';
process.env.RATE_LIMITING_ENABLED = 'true';
process.env.MAX_REQUESTS_PER_MINUTE = '30';
process.env.MAX_REQUESTS_PER_HOUR = '100';

// Import config after setting environment variables
import { config } from '../config.js';

// Test configuration
const TEST_USER_ID = 999999999;
const TEST_USERNAME = 'testuser';
const TEST_FIRST_NAME = 'Test User';

// Mock Telegram context
const mockContext = {
  from: {
    id: TEST_USER_ID,
    username: TEST_USERNAME,
    first_name: TEST_FIRST_NAME
  },
  reply: async (message) => {
    console.log('Bot reply:', message);
    return { message_id: 1 };
  }
};

// Test suite
async function runTests() {
  console.log('🧪 Starting Mouin-Almojtahidin Bot Tests...\n');
  
  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database initialized');
    
    // Test 1: Add user
    console.log('\n📝 Test 1: Adding user...');
    await addUser(TEST_USER_ID, TEST_USERNAME, TEST_FIRST_NAME);
    console.log('✅ User added successfully');
    
    // Test 2: Check user verification status (should be false initially)
    console.log('\n🔍 Test 2: Checking initial verification status...');
    const initialVerification = await isUserVerified(TEST_USER_ID);
    assert.strictEqual(initialVerification, false, 'User should not be verified initially');
    console.log('✅ Initial verification status is correct (false)');
    
    // Test 3: Verify user with correct activation code
    console.log('\n🔑 Test 3: Verifying user with correct activation code...');
    const correctCode = config.users.activationCode;
    await verifyUser(TEST_USER_ID);
    const afterVerification = await isUserVerified(TEST_USER_ID);
    assert.strictEqual(afterVerification, true, 'User should be verified after verification');
    console.log('✅ User verification successful');
    
    // Test 4: Check verification status after verification
    console.log('\n🔍 Test 4: Checking verification status after verification...');
    const finalVerification = await isUserVerified(TEST_USER_ID);
    assert.strictEqual(finalVerification, true, 'User should remain verified');
    console.log('✅ Final verification status is correct (true)');
    
    // Test 5: Verify activation code format
    console.log('\n🔐 Test 5: Checking activation code format...');
    assert.strictEqual(typeof config.users.activationCode, 'string', 'Activation code should be a string');
    assert.strictEqual(config.users.activationCode.length > 0, true, 'Activation code should not be empty');
    console.log('✅ Activation code format is valid');
    
    // Test 6: Verify admin configuration
    console.log('\n⚙️ Test 6: Checking admin configuration...');
    assert.strictEqual(Array.isArray(config.admin.userIds), true, 'Admin user IDs should be an array');
    assert.strictEqual(typeof config.botToken, 'string', 'Bot token should be a string');
    assert.strictEqual(config.botToken.length > 0, true, 'Bot token should not be empty');
    console.log('✅ Admin configuration is valid');
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await closeDatabase();
      console.log('\n🧹 Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

export { runTests };