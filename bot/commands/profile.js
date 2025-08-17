import { getUserInfo, getUserLanguage } from '../utils/database.js';
import { userCacheUtil } from '../utils/cache.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { Markup } from 'telegraf';

export async function handleProfile(ctx) {
  try {
    const userId = ctx.from.id;
    console.log(`Processing /profile command for user: ${userId}`);

    // Check cache first
    let userInfo = userCacheUtil.get(userId)?.userInfo;
    if (!userInfo) {
      console.log(`Fetching user info for user: ${userId} from database`);
      userInfo = await getUserInfo(userId);
      if (userInfo) {
        userCacheUtil.set(userId, { userInfo, lastUpdated: Date.now() }, 300); // Cache for 5 minutes
        console.log(`Cached user info for user: ${userId}`);
      }
    } else {
      console.log(`User info retrieved from cache for user: ${userId}`);
    }

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define messages based on language
    const messages = {
      ar: {
        notFound: 'لم يتم العثور على حسابك',
        registerPrompt: 'استخدم /start للتسجيل.',
        profileHeader: 'ملفك الشخصي',
        userId: 'معرف المستخدم:',
        name: 'الاسم:',
        username: 'اسم المستخدم:',
        status: 'الحالة:',
        reminders: 'التذكيرات:',
        registrationDate: 'تاريخ التسجيل:',
        lastActivity: 'آخر نشاط:',
        help: 'للمساعدة:',
        notAvailable: 'غير متوفر',
        verified: 'مفعل',
        notVerified: 'غير مفعل',
        enabled: 'مفعلة',
        disabled: 'معطلة',
        error: 'حدث خطأ، حاول مرة أخرى أو تواصل مع'
      },
      en: {
        notFound: 'Your account was not found',
        registerPrompt: 'Use /start to register.',
        profileHeader: 'Your Profile',
        userId: 'User ID:',
        name: 'Name:',
        username: 'Username:',
        status: 'Status:',
        reminders: 'Reminders:',
        registrationDate: 'Registration Date:',
        lastActivity: 'Last Activity:',
        help: 'For help:',
        notAvailable: 'Not available',
        verified: 'Verified',
        notVerified: 'Not verified',
        enabled: 'Enabled',
        disabled: 'Disabled',
        error: 'An error occurred, try again or contact'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    if (!userInfo) {
      console.log(`No user info found for user: ${userId}`);
      const response = 
        `❌ *${escapeMarkdownV2(msg.notFound)}*\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n` +
        `${escapeMarkdownV2(msg.registerPrompt)}\n` +
        `💡 ${escapeMarkdownV2(msg.help)} ${escapeMarkdownV2(config.admin.supportChannel)}`;
      console.log(`Sending no user response for user: ${userId}: ${response}`);
      await ctx.reply(response, {
        parse_mode: 'MarkdownV2',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(userLanguage === 'ar' ? 'تسجيل' : 'Register', 'start')],
          [Markup.button.callback(userLanguage === 'ar' ? 'الدعم' : 'Support', 'support')]
        ]).reply_markup
      });
      console.log(`Successfully sent no user response for user: ${userId}`);
      return;
    }

    console.log(`User info: ${JSON.stringify(userInfo)}`);
    const response = 
      `👤 *${escapeMarkdownV2(msg.profileHeader)}*\n` +
      `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n` +
      `🆔 *${escapeMarkdownV2(msg.userId)}* ${userInfo.user_id}\n` +
      `📛 *${escapeMarkdownV2(msg.name)}* ${escapeMarkdownV2(userInfo.first_name || msg.notAvailable)}\n` +
      `📧 *${escapeMarkdownV2(msg.username)}* ${escapeMarkdownV2(userInfo.username || msg.notAvailable)}\n` +
      `✅ *${escapeMarkdownV2(msg.status)}* ${userInfo.is_verified ? escapeMarkdownV2(msg.verified) : escapeMarkdownV2(msg.notVerified)}\n` +
      `🔔 *${escapeMarkdownV2(msg.reminders)}* ${userInfo.reminders_enabled ? escapeMarkdownV2(msg.enabled) : escapeMarkdownV2(msg.disabled)}\n` +
      (userInfo.registration_date ? `📅 *${escapeMarkdownV2(msg.registrationDate)}* ${escapeMarkdownV2(new Date(userInfo.registration_date).toLocaleDateString(userLanguage === 'ar' ? 'ar-SA' : 'en-US'))}\n` : '') +
      (userInfo.last_activity ? `⏰ *${escapeMarkdownV2(msg.lastActivity)}* ${escapeMarkdownV2(new Date(userInfo.last_activity).toLocaleString(userLanguage === 'ar' ? 'ar-SA' : 'en-US'))}\n` : '') +
      `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n` +
      `💡 ${escapeMarkdownV2(msg.help)} ${escapeMarkdownV2(config.admin.supportChannel)}`;

    const keyboard = userInfo.is_verified
      ? [
          [
            Markup.button.callback(userLanguage === 'ar' ? 'الدروس' : 'Courses', 'courses'),
            Markup.button.callback(userLanguage === 'ar' ? 'الإعدادات' : 'Settings', 'settings')
          ],
          [Markup.button.callback(userLanguage === 'ar' ? 'الدعم' : 'Support', 'support')]
        ]
      : [
          [Markup.button.callback(userLanguage === 'ar' ? 'تفعيل الحساب' : 'Verify Account', 'verify_account')],
          [Markup.button.callback(userLanguage === 'ar' ? 'الدعم' : 'Support', 'support')]
        ];

    console.log(`Sending profile response for user: ${userId}: ${response}`);
    await ctx.reply(response, {
      parse_mode: 'MarkdownV2',
      reply_markup: Markup.inlineKeyboard(keyboard).reply_markup
    });
    console.log(`Successfully sent profile response for user: ${userId}`);

  } catch (error) {
    console.error(`Error in /profile command for user ${ctx.from.id}:`, {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response data',
      userId: ctx.from.id,
      telegramContext: {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        languageCode: ctx.from.language_code
      }
    });
    const userLanguage = await getUserLanguage(ctx.from?.id) || 'ar';
    const msg = messages[userLanguage] || messages.ar;
    const response = 
      `❌ ${escapeMarkdownV2(msg.error)} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    console.log(`Sending error response for user: ${ctx.from.id}: ${response}`);
    await ctx.reply(response, {
      parse_mode: 'MarkdownV2',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(userLanguage === 'ar' ? 'الدعم' : 'Support', 'support')]
      ]).reply_markup
    });
    console.log(`Successfully sent error response for user: ${ctx.from.id}`);
  }
}