#!/usr/bin/env node

/**
 * Simple Test Script for Mouin-Almojtahidin Bot
 * Tests core functionality without requiring bot token
 */

import { escapeMarkdownV2 } from './bot/utils/escapeMarkdownV2.js';

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
    { name: 'addreminder', path: './bot/commands/addreminder.js' },
    { name: 'assignments', path: './bot/commands/assignments.js' },
    { name: 'feedback', path: './bot/commands/feedback.js' }
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
      // Skip commands that require config for now
      if (error.message.includes('BOT_TOKEN') || error.message.includes('config')) {
        console.log(`   ⚠️ ${command.name} - skipped (requires config)`);
      } else {
        console.log(`   ❌ ${command.name} - import error: ${error.message}`);
        allPassed = false;
      }
    }
  }

  logTestResult('Command Imports', allPassed);
}

// Test utility functions
async function testUtilityFunctions() {
  console.log('\n🔍 Testing utility functions...');
  
  try {
    // Test escapeMarkdownV2
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

// Test file structure
async function testFileStructure() {
  console.log('\n🔍 Testing file structure...');
  
  const fs = await import('fs');
  const requiredFiles = [
    'index.js',
    'config.js',
    'package.json',
    'bot/commands/start.js',
    'bot/commands/profile.js',
    'bot/commands/settings.js',
    'bot/commands/addreminder.js',
    'bot/commands/assignments.js',
    'bot/commands/feedback.js',
    'bot/commands/health.js',
    'bot/utils/database.js',
    'bot/utils/escapeMarkdownV2.js',
    'bot/utils/security.js',
    'bot/middlewares/verifyMiddleware.js'
  ];

  let allPassed = true;

  for (const file of requiredFiles) {
    if (fs.default.existsSync(file)) {
      console.log(`   ✅ ${file} - exists`);
    } else {
      console.log(`   ❌ ${file} - missing`);
      allPassed = false;
    }
  }

  logTestResult('File Structure', allPassed);
}

// Test package.json
async function testPackageJson() {
  console.log('\n🔍 Testing package.json...');
  
  try {
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.default.readFileSync('package.json', 'utf8'));
    
    const requiredFields = ['name', 'version', 'type', 'main', 'scripts', 'dependencies'];
    let allPassed = true;

    requiredFields.forEach(field => {
      if (packageJson[field]) {
        console.log(`   ✅ ${field} - present`);
      } else {
        console.log(`   ❌ ${field} - missing`);
        allPassed = false;
      }
    });

    // Check for required dependencies
    const requiredDeps = ['telegraf', 'sqlite3'];
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`   ✅ dependency ${dep} - present`);
      } else {
        console.log(`   ❌ dependency ${dep} - missing`);
        allPassed = false;
      }
    });

    // Check for dev dependencies
    if (packageJson.devDependencies && packageJson.devDependencies['sqlite']) {
      console.log(`   ✅ dev dependency sqlite - present`);
    } else {
      console.log(`   ❌ dev dependency sqlite - missing`);
      allPassed = false;
    }

    logTestResult('Package.json', allPassed);
  } catch (error) {
    logTestResult('Package.json', false, error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting simple bot tests...\n');
  
  // Run tests
  await testFileStructure();
  await testPackageJson();
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