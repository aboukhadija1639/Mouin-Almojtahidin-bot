import { toggleUserReminders, getUserInfo } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleReminders(ctx) {
  try {
    const userId = ctx.from.id;
    const userInfo = await getUserInfo(userId);
    if (!userInfo) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('لم يتم العثور على حسابك')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('استخدم /start للتسجيل.')}\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    if (!userInfo.is_verified) {
      await ctx.reply(
        `🔒 *${escapeMarkdownV2('حسابك غير مفعل')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('استخدم /verify للتفعيل.')}\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const result = await toggleUserReminders(userId);
    if (!result.success) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('فشل في تحديث التذكيرات')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2(result.message)}\n💡 ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const status = result.remindersEnabled ? '🔔 مفعلة' : '🔕 معطلة';
    await ctx.reply(
      `${result.remindersEnabled ? '🔔' : '🔕'} *${escapeMarkdownV2(`تم ${result.remindersEnabled ? 'تفعيل' : 'إيقاف'} التذكيرات`)}*\n━━━━━━━━━━━━━━━━━━━━\n📊 *${escapeMarkdownV2('الحالة الحالية:')}* ${escapeMarkdownV2(status)}\n${result.remindersEnabled ? '✅ *ستتلقى:* تذكيرات الدروس والواجبات' : '❌ *لن تتلقى:* تذكيرات'}\n🔄 ${escapeMarkdownV2('استخدم /reminders للتغيير مجددًا')}\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[REMINDERS] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}