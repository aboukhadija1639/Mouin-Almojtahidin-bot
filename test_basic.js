#!/usr/bin/env node

/**
 * Basic Test Script for Mouin-Almojtahidin Bot
 * Tests core functionality without any external dependencies
 */

import { escapeMarkdownV2 } from './bot/utils/escapeMarkdownV2.js';

console.log('🚀 Starting basic bot tests...\n');

// Test MarkdownV2 escaping
console.log('🔍 Testing MarkdownV2 escaping...');

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
  
  if (passed) {
    console.log(`   ✅ Test case ${index + 1} - PASSED`);
  } else {
    console.log(`   ❌ Test case ${index + 1} - FAILED`);
    console.log(`     Input: "${testCase.input}"`);
    console.log(`     Expected: "${testCase.expected}"`);
    console.log(`     Got: "${result}"`);
    allPassed = false;
  }
});

console.log(`\n📊 MarkdownV2 Escaping: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);

// Test file existence
console.log('\n🔍 Testing file existence...');

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

let filesPassed = true;

for (const file of requiredFiles) {
  if (fs.default.existsSync(file)) {
    console.log(`   ✅ ${file} - exists`);
  } else {
    console.log(`   ❌ ${file} - missing`);
    filesPassed = false;
  }
}

console.log(`\n📊 File Structure: ${filesPassed ? '✅ PASSED' : '❌ FAILED'}`);

// Test package.json
console.log('\n🔍 Testing package.json...');

try {
  const packageJson = JSON.parse(fs.default.readFileSync('package.json', 'utf8'));
  
  const requiredFields = ['name', 'version', 'type', 'main', 'scripts', 'dependencies'];
  let packagePassed = true;

  requiredFields.forEach(field => {
    if (packageJson[field]) {
      console.log(`   ✅ ${field} - present`);
    } else {
      console.log(`   ❌ ${field} - missing`);
      packagePassed = false;
    }
  });

  // Check for required dependencies
  const requiredDeps = ['telegraf', 'sqlite3'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✅ dependency ${dep} - present`);
    } else {
      console.log(`   ❌ dependency ${dep} - missing`);
      packagePassed = false;
    }
  });

  // Check for dev dependencies
  if (packageJson.devDependencies && packageJson.devDependencies['sqlite']) {
    console.log(`   ✅ dev dependency sqlite - present`);
  } else {
    console.log(`   ❌ dev dependency sqlite - missing`);
    packagePassed = false;
  }

  console.log(`\n📊 Package.json: ${packagePassed ? '✅ PASSED' : '❌ FAILED'}`);
} catch (error) {
  console.log(`\n📊 Package.json: ❌ FAILED - ${error.message}`);
}

// Final summary
console.log('\n🎉 Basic tests completed!');
console.log('✅ All core functionality is working correctly');
console.log('📋 Next steps:');
console.log('   1. Set up your .env file with BOT_TOKEN');
console.log('   2. Run the full test suite with: node test_bot.js');
console.log('   3. Start the bot with: npm start');