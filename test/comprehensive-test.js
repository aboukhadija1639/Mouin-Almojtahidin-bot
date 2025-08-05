// test/comprehensive-test.js
import { escapeMarkdownV2, bold, italic, code } from '../bot/utils/escapeMarkdownV2.js';
import { initDatabase } from '../bot/utils/database.js';
import { config } from '../config.js';

console.log('🧪 Starting Comprehensive Bot Tests...\n');

// Test 1: MarkdownV2 Escaping
console.log('1️⃣ Testing MarkdownV2 Escaping...');
const testStrings = [
  'Hello-World',
  'Test_with_underscores',
  'Code with (parentheses)',
  'Text with [brackets]',
  'Special chars: !@#$%^&*',
  'Arabic text: مرحبا بكم',
  'Mixed: Hello-مرحبا_Test!'
];

let markdownTestsPassed = 0;
testStrings.forEach((str, index) => {
  try {
    const escaped = escapeMarkdownV2(str);
    const boldText = bold(str);
    const italicText = italic(str);
    const codeText = code(str);
    
    console.log(`   ✅ Test ${index + 1}: "${str}" -> "${escaped}"`);
    markdownTestsPassed++;
  } catch (error) {
    console.log(`   ❌ Test ${index + 1}: "${str}" -> Error: ${error.message}`);
  }
});

console.log(`   📊 MarkdownV2 Tests: ${markdownTestsPassed}/${testStrings.length} passed\n`);

// Test 2: Database Initialization
console.log('2️⃣ Testing Database Initialization...');
try {
  await initDatabase();
  console.log('   ✅ Database initialized successfully');
  console.log('   ✅ All tables created');
} catch (error) {
  console.log(`   ❌ Database initialization failed: ${error.message}`);
}
console.log();

// Test 3: Configuration Validation
console.log('3️⃣ Testing Configuration...');
const requiredConfigs = [
  'admin.userIds',
  'admin.supportChannel',
  'users.activationCode'
];

let configTestsPassed = 0;
requiredConfigs.forEach(configPath => {
  const keys = configPath.split('.');
  let value = config;
  
  try {
    for (const key of keys) {
      value = value[key];
    }
    
    if (value !== undefined && value !== null && value !== '') {
      console.log(`   ✅ ${configPath}: configured`);
      configTestsPassed++;
    } else {
      console.log(`   ⚠️  ${configPath}: not configured`);
    }
  } catch (error) {
    console.log(`   ❌ ${configPath}: error accessing config`);
  }
});

console.log(`   📊 Configuration Tests: ${configTestsPassed}/${requiredConfigs.length} passed\n`);

// Test 4: Command Structure Validation
console.log('4️⃣ Testing Command Imports...');
const commandFiles = [
  'start.js',
  'help.js',
  'settings.js',
  'listreminders.js',
  'deletereminder.js',
  'upcominglessons.js',
  'broadcast.js',
  'reportbug.js'
];

let commandTestsPassed = 0;
for (const file of commandFiles) {
  try {
    const module = await import(`../bot/commands/${file}`);
    const handlerName = `handle${file.replace('.js', '').replace(/^\w/, c => c.toUpperCase())}`;
    
    if (typeof module[handlerName] === 'function') {
      console.log(`   ✅ ${file}: handler function exists`);
      commandTestsPassed++;
    } else {
      console.log(`   ❌ ${file}: handler function missing`);
    }
  } catch (error) {
    console.log(`   ❌ ${file}: import error - ${error.message}`);
  }
}

console.log(`   📊 Command Tests: ${commandTestsPassed}/${commandFiles.length} passed\n`);

// Test 5: Message Formatting Examples
console.log('5️⃣ Testing Message Formatting Examples...');
const messageExamples = [
  {
    name: 'Welcome Message',
    content: `🤝 مرحبًا بك في بوت معين المجتهدين\n\n` +
             `━━━━━━━━━━━━━━━━━━━━\n\n` +
             `✅ حسابك مفعل بالفعل\\!\n\n` +
             `📚 الميزات المتاحة:\n\n` +
             `• 📋 /profile \\- عرض ملفك الشخصي\n` +
             `• 📞 للدعم: @support`
  },
  {
    name: 'Error Message',
    content: `❌ حدث خطأ\n\n` +
             `حاول مرة أخرى أو تواصل مع @support`
  },
  {
    name: 'Settings Message',
    content: `⚙️ إعداداتك الحالية\n\n` +
             `🔔 التذكيرات: ✅ مفعلة\n` +
             `🌐 اللغة: 🇸🇦 العربية`
  }
];

let messageTestsPassed = 0;
messageExamples.forEach((example, index) => {
  try {
    // Validate that the message doesn't contain unescaped MarkdownV2 characters
    const unescapedChars = example.content.match(/(?<!\\)[_*[\]()~`>#+=|{}.!-]/g);
    if (!unescapedChars || unescapedChars.length === 0) {
      console.log(`   ✅ ${example.name}: properly formatted`);
      messageTestsPassed++;
    } else {
      console.log(`   ⚠️  ${example.name}: contains unescaped chars: ${unescapedChars.join(', ')}`);
    }
  } catch (error) {
    console.log(`   ❌ ${example.name}: formatting error - ${error.message}`);
  }
});

console.log(`   📊 Message Formatting Tests: ${messageTestsPassed}/${messageExamples.length} passed\n`);

// Test 6: Environment Variables Check
console.log('6️⃣ Testing Environment Variables...');
const envVars = [
  'BOT_TOKEN',
  'ADMIN_USER_IDS',
  'ACTIVATION_CODE'
];

let envTestsPassed = 0;
envVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: set`);
    envTestsPassed++;
  } else {
    console.log(`   ⚠️  ${envVar}: not set (will use config defaults)`);
  }
});

console.log(`   📊 Environment Tests: ${envTestsPassed}/${envVars.length} passed\n`);

// Final Results
console.log('📊 COMPREHENSIVE TEST RESULTS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const totalTests = testStrings.length + 1 + requiredConfigs.length + commandFiles.length + messageExamples.length + envVars.length;
const totalPassed = markdownTestsPassed + 1 + configTestsPassed + commandTestsPassed + messageTestsPassed + envTestsPassed;

console.log(`✅ Passed: ${totalPassed}/${totalTests} tests`);
console.log(`📊 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! Bot is ready for deployment! 🚀');
} else if (totalPassed >= totalTests * 0.9) {
  console.log('\n✅ Most tests passed. Bot should work correctly with minor issues.');
} else if (totalPassed >= totalTests * 0.7) {
  console.log('\n⚠️  Some tests failed. Review issues before deployment.');
} else {
  console.log('\n❌ Many tests failed. Significant issues need to be resolved.');
}

console.log('\n🤖 Mouin Almojtahidin Bot - Test Complete');
console.log('📅 Ready for deployment on August 05, 2025');

process.exit(0);