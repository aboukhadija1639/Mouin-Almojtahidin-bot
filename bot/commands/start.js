// bot/commands/start.js
import { addUser, isUserVerified } from '../utils/database.js';
import { userCacheUtil, warmCache } from '../utils/cache.js';
import { config } from '../../config.js';
import { templates, welcomeTemplates } from '../utils/messageTemplates.js';
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
    let isNewUser = false;

    if (userData) {
      verified = userData.verified || false;
      console.log('[START] User data from cache', { verified });
    } else {
      console.log('[START] User data not in cache, fetching from database');
      
      // Check if user exists before adding (to determine if new user)
      const existingUser = await isUserVerified(userId);
      isNewUser = !existingUser;
      
      // Add user to database (this will be quick if user exists)
      await addUser(userId, username, firstName);
      
      // Check verification status
      const userVerificationData = await isUserVerified(userId);
      verified = userVerificationData?.verified || false;
      
      // Cache the user data for future requests
      userData = { 
        id: userId, 
        username, 
        firstName, 
        verified,
        lastUpdated: Date.now()
      };
      userCacheUtil.set(userId, userData, 300); // Cache for 5 minutes
      
      console.log('[START] User data cached', { verified, isNewUser });
    }

    // Pre-warm cache with user courses and assignments if verified
    if (verified) {
      // Don't await these to avoid blocking the response
      warmCache.preloadUserData(userId, { isUserVerified }).catch(console.error);
    }

    // Build response message with professional formatting
    const responseMessage = buildStartMessage(firstName, verified, isNewUser);
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

    // Send professional error message to user
    await ctx.reply(
      templates.error(
        'حدث خطأ أثناء بدء التشغيل',
        'عذراً، حدث خطأ أثناء بدء تشغيل البوت',
        `يرجى المحاولة مرة أخرى أو التواصل مع ${config.admin?.supportChannel || '@support'}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Helper function to build the start message using professional templates
function buildStartMessage(firstName, verified, isNewUser = false) {
  if (isNewUser) {
    // Welcome new user with comprehensive onboarding
    let message = welcomeTemplates.newUser(firstName, 'بوت معين المجتهدين');
    
    if (!verified) {
      message += `\n\n🔑 ${bold('خطوة مهمة: تفعيل الحساب')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `لاستخدام جميع الميزات، فعل حسابك باستخدام:\n`;
      message += `${code('/verify كود_التفعيل')}\n\n`;
      message += `📞 ${bold('للحصول على الكود:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    }
    
    return message;
  } else {
    // Welcome returning user
    const lastSeen = new Date().toLocaleDateString('ar-SA');
    let message = welcomeTemplates.returningUser(firstName, lastSeen);
    
    if (verified) {
      message += `\n\n✅ ${bold('حسابك مفعل')} \\- جميع الميزات متاحة!\n`;
      message += `📊 ${italic('يمكنك الوصول إلى جميع الدورات والواجبات والتذكيرات')}`;
    } else {
      message += `\n\n🔑 ${bold('تفعيل الحساب مطلوب')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `للوصول إلى جميع الميزات:\n`;
      message += `${code('/verify كود_التفعيل')}\n\n`;
      message += `📞 ${bold('للحصول على الكود:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    }
    
    return message;
  }
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
      ],
      [
        Markup.button.callback('📊 الإحصائيات', 'stats'),
        Markup.button.callback('⚙️ الإعدادات', 'settings')
      ]
    );
  } else {
    buttons.push(
      [Markup.button.callback('🔑 تفعيل الحساب', 'verify_account')],
      [Markup.button.callback('📋 الملف الشخصي', 'profile')]
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