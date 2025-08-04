import { toggleUserReminders, getUserInfo } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleReminders(ctx) {
  try {
    const userId = ctx.from.id;
    console.log(`Processing /reminders command for user: ${userId}`);

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
    if (!userInfo.is_verified) {
      console.log(`User ${userId} is not verified`);
      const response = 
        `🔒 *${escapeMarkdownV2('حسابك غير مفعل')}*\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\n${escapeMarkdownV2('استخدم /verify للتفعيل')}\\.\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
      console.log(`Sending unverified response for user: ${userId}: ${response}`);
      await ctx.reply(response, { parse_mode: 'MarkdownV2' });
      console.log(`Successfully sent unverified response for user: ${userId}`);
      return;
    }

    console.log(`Toggling reminders for user: ${userId}`);
    const result = await toggleUserReminders(userId);
    console.log(`Toggle result: ${JSON.stringify(result)}`);
    if (!result.success) {
      console.error(`Failed to toggle reminders for user: ${userId}, message: ${result.message}`);
      const response = 
        `❌ *${escapeMarkdownV2('فشل في تحديث التذكيرات')}*\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\n${escapeMarkdownV2(result.message)}\n💡 ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
      console.log(`Sending toggle failure response for user: ${userId}: ${response}`);
      await ctx.reply(response, { parse_mode: 'MarkdownV2' });
      console.log(`Successfully sent toggle failure response for user: ${userId}`);
      return;
    }

    const status = result.remindersEnabled ? '🔔 مفعلة' : '🔕 معطلة';
    console.log(`Sending response for user: ${userId}, remindersEnabled: ${result.remindersEnabled}`);
    const response = 
      `${result.remindersEnabled ? '🔔' : '🔕'} *${escapeMarkdownV2(`تم ${result.remindersEnabled ? 'تفعيل' : 'إيقاف'} التذكيرات`)}*\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\n📊 *${escapeMarkdownV2('الحالة الحالية:')}* ${escapeMarkdownV2(status)}\n${result.remindersEnabled ? `${escapeMarkdownV2('✅ ستتلقى: تذكيرات الدروس والواجبات')}` : `${escapeMarkdownV2('❌ لن تتلقى: تذكيرات')}`}\n🔄 ${escapeMarkdownV2('استخدم /reminders للتغيير مجددًا')}\\.\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    await ctx.reply(response, { parse_mode: 'MarkdownV2' });
    console.log(`Successfully sent response for user: ${userId}`);

  } catch (error) {
    console.error(`Error in /reminders command for user ${ctx.from.id}:`, {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response data',
    });
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[REMINDERS] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {
      console.error(`Failed to write error to log file: ${e.message}`);
    }
    const response = 
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    console.log(`Sending error response for user: ${ctx.from.id}: ${response}`);
    await ctx.reply(response, { parse_mode: 'MarkdownV2' });
    console.log(`Successfully sent error response for user: ${ctx.from.id}`);
  }
}