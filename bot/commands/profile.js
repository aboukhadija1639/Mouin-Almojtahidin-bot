import { getUserInfo } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleProfile(ctx) {
  try {
    const userId = ctx.from.id;
    console.log(`Processing /profile command for user: ${userId}`);

    console.log(`Fetching user info for user: ${userId}`);
    const userInfo = await getUserInfo(userId);
    if (!userInfo) {
      console.log(`No user info found for user: ${userId}`);
      const response = 
        `❌ *${escapeMarkdownV2('لم يتم العثور على حسابك')}*\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\n${escapeMarkdownV2('استخدم /start للتسجيل')}\\.\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
      console.log(`Sending no user response for user: ${userId}: ${response}`);
      await ctx.reply(response, { parse_mode: 'MarkdownV2' });
      console.log(`Successfully sent no user response for user: ${userId}`);
      return;
    }

    console.log(`User info: ${JSON.stringify(userInfo)}`);
    const response = 
      `👤 *${escapeMarkdownV2('ملفك الشخصي')}*\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\n` +
      `🆔 *${escapeMarkdownV2('معرف المستخدم:')}* ${userInfo.user_id}\n` +
      `📛 *${escapeMarkdownV2('الاسم:')}* ${escapeMarkdownV2(userInfo.first_name || 'غير متوفر')}\n` +
      `📧 *${escapeMarkdownV2('اسم المستخدم:')}* ${escapeMarkdownV2(userInfo.username || 'غير متوفر')}\n` +
      `✅ *${escapeMarkdownV2('الحالة:')}* ${userInfo.is_verified ? escapeMarkdownV2('مفعل') : escapeMarkdownV2('غير مفعل')}\n` +
      `🔔 *${escapeMarkdownV2('التذكيرات:')}* ${userInfo.reminders_enabled ? escapeMarkdownV2('مفعلة') : escapeMarkdownV2('معطلة')}\n` +
      `💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    
    console.log(`Sending profile response for user: ${userId}: ${response}`);
    await ctx.reply(response, { parse_mode: 'MarkdownV2' });
    console.log(`Successfully sent profile response for user: ${userId}`);

  } catch (error) {
    console.error(`Error in /profile command for user ${ctx.from.id}:`, {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response data',
    });
    const response = 
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    console.log(`Sending error response for user: ${ctx.from.id}: ${response}`);
    await ctx.reply(response, { parse_mode: 'MarkdownV2' });
    console.log(`Successfully sent error response for user: ${ctx.from.id}`);
  }
}