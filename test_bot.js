#!/usr/bin/env node

/**
 * Comprehensive Test Script for Mouin-Almojtahidin Bot
 * Tests all major functionality and commands
 */

import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './bot/utils/database.js';
import { escapeMarkdownV2 } from './bot/utils/escapeMarkdownV2.js';

// Test configuration
const TEST_USER_ID = config.admin.userIds[0] || 123456789;
const TEST_BOT_TOKEN = config.botToken;

if (!TEST_BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in environment variables');
  process.exit(1);
}

const bot = new Telegraf(TEST_BOT_TOKEN);

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log test results
function logTestResult(testName, passed, error = null) {
  if (passed) {
    console.log(`✅ ${testName} - PASSED`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName} - FAILED`);
    testResults.failed++;
    if (error) {
      testResults.errors.push({ test: testName, error: error.message });
      console.error(`   Error: ${error.message}`);
    }
  }
}

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    const db = await initDatabase();
    if (db) {
      logTestResult('Database Connection', true);
    } else {
      logTestResult('Database Connection', false, new Error('Database initialization failed'));
    }
  } catch (error) {
    logTestResult('Database Connection', false, error);
  }
}

// Test MarkdownV2 escaping
function testMarkdownV2Escaping() {
  console.log('\n🔍 Testing MarkdownV2 escaping...');
  
  const testCases = [
    { input: 'Hello World!', expected: 'Hello World\\!' },
    { input: 'Test (parentheses)', expected: 'Test \\(parentheses\\)' },
    { input: 'Test - dash', expected: 'Test \\- dash' },
    { input: 'Test . dot', expected: 'Test \\. dot' },
    { input: 'Test * bold *', expected: 'Test \\* bold \\*' },
    { input: 'Test _ italic _', expected: 'Test \\_ italic \\_' },
    { input: 'Test ` code `', expected: 'Test \\` code \\`' },
    { input: 'Test [ link ]', expected: 'Test \\[ link \\]' },
    { input: 'Test @ mention', expected: 'Test \\@ mention' }
  ];

  let allPassed = true;
  
  testCases.forEach((testCase, index) => {
    const result = escapeMarkdownV2(testCase.input);
    const passed = result === testCase.expected;
    
    if (!passed) {
      console.log(`   Test case ${index + 1} failed:`);
      console.log(`     Input: "${testCase.input}"`);
      console.log(`     Expected: "${testCase.expected}"`);
      console.log(`     Got: "${result}"`);
      allPassed = false;
    }
  });

  logTestResult('MarkdownV2 Escaping', allPassed);
}

// Test command imports
async function testCommandImports() {
  console.log('\n🔍 Testing command imports...');
  
  const commands = [
    { name: 'start', path: './bot/commands/start.js' },
    { name: 'profile', path: './bot/commands/profile.js' },
    { name: 'settings', path: './bot/commands/settings.js' },
    { name: 'addreminder', path: './bot/commands/addreminder.js' },
    { name: 'assignments', path: './bot/commands/assignments.js' },
    { name: 'feedback', path: './bot/commands/feedback.js' },
    { name: 'health', path: './bot/commands/health.js' }
  ];

  let allPassed = true;

  for (const command of commands) {
    try {
      const module = await import(command.path);
      if (module) {
        console.log(`   ✅ ${command.name} - imported successfully`);
      } else {
        console.log(`   ❌ ${command.name} - import failed`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${command.name} - import error: ${error.message}`);
      allPassed = false;
    }
  }

  logTestResult('Command Imports', allPassed);
}

// Test utility functions
async function testUtilityFunctions() {
  console.log('\n🔍 Testing utility functions...');
  
  try {
    // Test database functions
    const { addUser, getUserInfo, isUserVerified } = await import('./bot/utils/database.js');
    
    if (typeof addUser === 'function' && 
        typeof getUserInfo === 'function' && 
        typeof isUserVerified === 'function') {
      console.log('   ✅ Database utility functions - available');
    } else {
      throw new Error('Database utility functions not available');
    }

    // Test escapeMarkdownV2
    const { escapeMarkdownV2 } = await import('./bot/utils/escapeMarkdownV2.js');
    
    if (typeof escapeMarkdownV2 === 'function') {
      console.log('   ✅ escapeMarkdownV2 function - available');
    } else {
      throw new Error('escapeMarkdownV2 function not available');
    }

    // Test security functions
    const { validateDate, sanitizeInput } = await import('./bot/utils/security.js');
    
    if (typeof validateDate === 'function' && typeof sanitizeInput === 'function') {
      console.log('   ✅ Security utility functions - available');
    } else {
      throw new Error('Security utility functions not available');
    }

    logTestResult('Utility Functions', true);
  } catch (error) {
    logTestResult('Utility Functions', false, error);
  }
}

// Test configuration
function testConfiguration() {
  console.log('\n🔍 Testing configuration...');
  
  const requiredConfig = [
    'botToken',
    'admin.userIds',
    'admin.chatId',
    'admin.supportChannel'
  ];

  let allPassed = true;

  requiredConfig.forEach(configPath => {
    const value = configPath.split('.').reduce((obj, key) => obj?.[key], config);
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      console.log(`   ❌ Missing or empty config: ${configPath}`);
      allPassed = false;
    } else {
      console.log(`   ✅ Config ${configPath} - OK`);
    }
  });

  logTestResult('Configuration', allPassed);
}

// Test bot token validity
async function testBotToken() {
  console.log('\n🔍 Testing bot token...');
  
  try {
    const botInfo = await bot.telegram.getMe();
    if (botInfo && botInfo.username) {
      console.log(`   ✅ Bot token valid - @${botInfo.username}`);
      logTestResult('Bot Token', true);
    } else {
      logTestResult('Bot Token', false, new Error('Invalid bot token'));
    }
  } catch (error) {
    logTestResult('Bot Token', false, error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive bot tests...\n');
  
  // Run tests
  await testConfiguration();
  await testBotToken();
  await testDatabaseConnection();
  testMarkdownV2Escaping();
  await testCommandImports();
  await testUtilityFunctions();

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  // Cleanup
  try {
    await closeDatabase();
    console.log('\n🧹 Cleanup completed');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
  }

  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed!'}`);
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});