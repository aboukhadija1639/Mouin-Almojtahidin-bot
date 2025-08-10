// bot/commands/start.js
import { addUser, getUserLanguage } from '../utils/database.js';
import { userCacheUtil, warmCache } from '../utils/cache.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';
import { Markup } from 'telegraf';

export async function handleStart(ctx) {
  const startTime = Date.now();
  console.log('[START] Command invoked', { user: ctx.from, timestamp: new Date().toISOString() });

  try {
    const user = ctx.from;
    if (!user?.id) {
      console.error('[START] Error: ctx.from is undefined or missing id', { ctxFrom: ctx.from });
      throw new Error('User information unavailable');
    }

    const userId = user.id;
    const username = user.username ? `@${user.username}` : 'غير متوفر';
    const firstName = user.first_name || 'مستخدم';
    console.log('[START] User info', { userId, username, firstName });

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Check cache first for user verification status
    let userData = userCacheUtil.get(userId);
    let verified = false;

    if (userData) {
      verified = userData.is_verified || false;
      console.log('[START] User data from cache', { verified });
    } else {
      console.log('[START] User data not in cache, fetching from database');
      
      // Add user to database (this will be quick if user exists)
      const addResult = await addUser(userId, username, firstName);
      if (!addResult.success) {
        throw new Error('Failed to add user to database');
      }
      
      // Check verification status - will be handled by cached function
      const { getUserInfo } = await import('../utils/database.js');
      const userResult = await getUserInfo(userId);
      verified = userResult.success ? (userResult.data?.is_verified || false) : false;
      
      console.log('[START] User data cached', { verified });
    }

    // Pre-warm cache with user courses and assignments if verified
    if (verified) {
      // Don't await these to avoid blocking the response
      warmCache.preloadUserData(userId, { getUserInfo: (await import('../utils/database.js')).getUserInfo }).catch(console.error);
    }

    // Build response message with professional formatting
    const responseMessage = buildStartMessage(firstName, verified, userLanguage);
    const keyboard = createStartKeyboard(verified, userLanguage);

    // Send response
    await ctx.reply(responseMessage, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      reply_markup: keyboard.reply_markup
    });

    const duration = Date.now() - startTime;
    console.log(`[START] Command completed in ${duration}ms`, { userId, verified });

  } catch (err) {
    logError(err, 'COMMAND_START');
    
    // Get user language for error message
    const userLanguage = await getUserLanguage(ctx.from?.id).catch(() => 'ar') || 'ar';
    
    const messages = {
      ar: 'حدث خطأ أثناء بدء تشغيل البوت، يرجى المحاولة مرة أخرى أو التواصل مع الدعم',
      en: 'An error occurred while starting the bot, please try again or contact support'
    };

    await ctx.reply(
      error(messages[userLanguage] || messages.ar),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );
  }
}

// Helper function to build the start message
function buildStartMessage(firstName, verified, language = 'ar') {
  const messages = {
    ar: {
      welcome: 'مرحبًا بك في بوت معين المجتهدين',
      accountVerified: 'حسابك مفعل بالفعل!',
      accountNotVerified: 'حسابك غير مفعل حاليًا',
      greeting: `مرحباً ${escapeMarkdownV2(firstName)}، يمكنك الآن استخدام جميع ميزات البوت:`,
      activationInstructions: `أهلاً ${escapeMarkdownV2(firstName)}! لتفعيل حسابك واستخدام جميع الميزات، استخدم:`,
      getCodeInstruction: 'للحصول على الكود، تواصل مع:',
      featuresAvailable: 'الميزات المتاحة:',
      support: 'للدعم:',
      website: 'الموقع:'
    },
    en: {
      welcome: 'Welcome to Mouin Almojtahidin Bot',
      accountVerified: 'Your account is already activated!',
      accountNotVerified: 'Your account is not activated yet',
      greeting: `Hello ${escapeMarkdownV2(firstName)}, you can now use all bot features:`,
      activationInstructions: `Hello ${escapeMarkdownV2(firstName)}! To activate your account and use all features, use:`,
      getCodeInstruction: 'To get the code, contact:',
      featuresAvailable: 'Available features:',
      support: 'Support:',
      website: 'Website:'
    }
  };

  const msg = messages[language] || messages.ar;
  
  let message = `🤝 ${bold(msg.welcome)}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (verified) {
    message += `✅ ${bold(msg.accountVerified)}\n\n`;
    message += `${msg.greeting}\n\n`;
  } else {
    message += `🔒 ${bold(msg.accountNotVerified)}\n\n`;
    message += `${msg.activationInstructions}\n\n`;
    message += `${code('/verify كود_التفعيل')}\n\n`;
    message += `💡 ${msg.getCodeInstruction} ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
  }

  message += `📚 ${bold(msg.featuresAvailable)}\n\n`;
  
  if (verified) {
    message += `• 📋 ${code('/profile')} \\- ${language === 'ar' ? 'عرض ملفك الشخصي' : 'View your profile'}\n`;
    message += `• 📅 ${code('/attendance')} \\- ${language === 'ar' ? 'تسجيل الحضور' : 'Mark attendance'}\n`;
    message += `• 📚 ${code('/courses')} \\- ${language === 'ar' ? 'عرض الدروس' : 'View courses'}\n`;
    message += `• 📝 ${code('/assignments')} \\- ${language === 'ar' ? 'عرض الواجبات' : 'View assignments'}\n`;
    message += `• ⏰ ${code('/reminders')} \\- ${language === 'ar' ? 'إدارة التذكيرات' : 'Manage reminders'}\n`;
    message += `• ⚙️ ${code('/settings')} \\- ${language === 'ar' ? 'الإعدادات' : 'Settings'}\n`;
  } else {
    message += `• 🔑 ${code('/verify')} \\- ${language === 'ar' ? 'تفعيل الحساب' : 'Activate account'}\n`;
  }
  
  message += `• ❓ ${code('/faq')} \\- ${language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}\n`;
  message += `• 🆘 ${code('/help')} \\- ${language === 'ar' ? 'المساعدة' : 'Help'}\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `💬 ${bold(msg.support)} ${escapeMarkdownV2(config.admin.supportChannel)}\n`;
  message += `🌐 ${bold(msg.website)} ${escapeMarkdownV2(config.admin.website || 'قريباً')}`;

  return message;
}

// Helper function to create the start keyboard
function createStartKeyboard(verified, language = 'ar') {
  const labels = {
    ar: {
      courses: '📚 الدروس',
      assignments: '📝 الواجبات',
      profile: '📋 الملف الشخصي',
      reminders: '⏰ التذكيرات',
      verify: '🔑 تفعيل الحساب',
      faq: '❓ أسئلة شائعة',
      help: '🆘 مساعدة',
      support: '📞 الدعم'
    },
    en: {
      courses: '📚 Courses',
      assignments: '📝 Assignments',
      profile: '📋 Profile',
      reminders: '⏰ Reminders',
      verify: '🔑 Verify Account',
      faq: '❓ FAQ',
      help: '🆘 Help',
      support: '📞 Support'
    }
  };

  const btn = labels[language] || labels.ar;
  const buttons = [];
  
  if (verified) {
    buttons.push(
      [
        Markup.button.callback(btn.courses, 'courses'),
        Markup.button.callback(btn.assignments, 'assignments')
      ],
      [
        Markup.button.callback(btn.profile, 'profile'),
        Markup.button.callback(btn.reminders, 'reminders')
      ]
    );
  } else {
    buttons.push(
      [Markup.button.callback(btn.verify, 'verify_account')]
    );
  }
  
  buttons.push(
    [
      Markup.button.callback(btn.faq, 'faq'),
      Markup.button.callback(btn.help, 'help')
    ],
    [Markup.button.callback(btn.support, 'support')]
  );

  return Markup.inlineKeyboard(buttons);
}