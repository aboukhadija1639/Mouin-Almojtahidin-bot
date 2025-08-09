// bot/commands/start.js
import { addUser, isUserVerified, getUserInfo } from '../utils/database.js';
import { userCacheUtil, warmCache } from '../utils/cache.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
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

    // Check cache first for user verification status
    let userData = userCacheUtil.get(userId);
    let verified = false;

    if (userData) {
      verified = userData.verified || false;
      console.log('[START] User data from cache', { verified });
    } else {
      console.log('[START] User data not in cache, fetching from database');
      
      // Add user to database (this will be quick if user exists)
      await addUser(userId, username, firstName);
      
      // Check verification status
      verified = await isUserVerified(userId);
      
      // Cache the user data for future requests
      userData = { 
        id: userId, 
        username, 
        firstName, 
        verified,
        lastUpdated: Date.now()
      };
      userCacheUtil.set(userId, userData, 300); // Cache for 5 minutes
      
      console.log('[START] User data cached', { verified });
    }

    // Pre-warm cache with user courses and assignments if verified
    if (verified) {
      // Don't await these to avoid blocking the response
      warmCache.preloadUserData(userId, { getUserInfo }).catch(console.error);
    }

    // Build response message with professional formatting
    const responseMessage = buildStartMessage(firstName, verified);
    const keyboard = createStartKeyboard(verified);

    // Send response
    await ctx.reply(responseMessage, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      reply_markup: keyboard.reply_markup
    });

    const duration = Date.now() - startTime;
    console.log(`[START] Command completed in ${duration}ms`, { userId, verified });

  } catch (error) {
    console.error('[START] Error handling start command:', {
      message: error.message,
      stack: error.stack,
      user: ctx.from
    });

    // Send error message to user
    await ctx.reply(
      `❌ **حدث خطأ**\n\n` +
      `عذراً، حدث خطأ أثناء بدء تشغيل البوت\\.\n` +
      `يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني\\.\n\n` +
      `💬 **الدعم:** ${escapeMarkdownV2(config.admin?.supportChannel || '@support')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Helper function to build the start message
function buildStartMessage(firstName, verified) {
  let message = `🤝 ${bold('مرحبًا بك في بوت معين المجتهدين')}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (verified) {
    message += `✅ ${bold('حسابك مفعل بالفعل!')}\n\n`;
    message += `مرحباً ${escapeMarkdownV2(firstName)}، يمكنك الآن استخدام جميع ميزات البوت:\n\n`;
  } else {
    message += `🔒 ${bold('حسابك غير مفعل حاليًا')}\n\n`;
    message += `أهلاً ${escapeMarkdownV2(firstName)}! لتفعيل حسابك واستخدام جميع الميزات، استخدم:\n\n`;
    message += `${code('/verify كود_التفعيل')}\n\n`;
    message += `💡 للحصول على الكود، تواصل مع: ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
  }

  message += `📚 ${bold('الميزات المتاحة:')}\n\n`;
  
  if (verified) {
    message += `• 📋 ${code('/profile')} \\- عرض ملفك الشخصي\n`;
    message += `• 📅 ${code('/attendance')} \\- تسجيل الحضور\n`;
    message += `• 📚 ${code('/courses')} \\- عرض الدروس\n`;
    message += `• 📝 ${code('/assignments')} \\- عرض الواجبات\n`;
    message += `• ⏰ ${code('/reminders')} \\- إدارة التذكيرات\n`;
    message += `• ⚙️ ${code('/settings')} \\- الإعدادات\n`;
  } else {
    message += `• 🔑 ${code('/verify')} \\- تفعيل الحساب\n`;
  }
  
  message += `• ❓ ${code('/faq')} \\- الأسئلة الشائعة\n`;
  message += `• 🆘 ${code('/help')} \\- المساعدة\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `💬 ${bold('للدعم:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n`;
  message += `🌐 ${bold('الموقع:')} ${escapeMarkdownV2(config.admin.website || 'قريباً')}`;

  return message;
}

// Helper function to create the start keyboard
function createStartKeyboard(verified) {
  const buttons = [];
  
  if (verified) {
    buttons.push(
      [
        Markup.button.callback('📚 الدروس', 'courses'),
        Markup.button.callback('📝 الواجبات', 'assignments')
      ],
      [
        Markup.button.callback('📋 الملف الشخصي', 'profile'),
        Markup.button.callback('⏰ التذكيرات', 'reminders')
      ]
    );
  } else {
    buttons.push(
      [Markup.button.callback('🔑 تفعيل الحساب', 'verify_account')]
    );
  }
  
  buttons.push(
    [
      Markup.button.callback('❓ أسئلة شائعة', 'faq'),
      Markup.button.callback('🆘 مساعدة', 'help')
    ],
    [Markup.button.callback('📞 الدعم', 'support')]
  );

  return Markup.inlineKeyboard(buttons);
}