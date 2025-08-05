// bot/commands/deletereminder.js
import { deleteReminder } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleDeletereminder(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const args = messageText.split(' ');

    if (args.length < 2) {
      await ctx.reply(
        `🗑️ ${bold('حذف تذكير')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${bold('الاستخدام الصحيح:')}\n` +
        `${code('/deletereminder رقم_ID')}\n\n` +
        `💡 ${bold('للحصول على رقم ID:')}\n` +
        `استخدم ${code('/listreminders')} لعرض جميع تذكيراتك مع أرقام ID\n\n` +
        `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const reminderId = parseInt(args[1]);
    
    if (isNaN(reminderId) || reminderId <= 0) {
      await ctx.reply(
        `❌ ${bold('رقم ID غير صحيح')}\n\n` +
        `يجب أن يكون رقم ID عدداً صحيحاً موجباً\\.\n\n` +
        `💡 استخدم ${code('/listreminders')} لعرض الأرقام الصحيحة\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Attempt to delete the reminder
    const result = await deleteReminder(userId, reminderId);

    if (result && result.changes > 0) {
      await ctx.reply(
        `✅ ${bold('تم حذف التذكير بنجاح')}\n\n` +
        `🗑️ تم حذف التذكير رقم ${code(reminderId.toString())}\n\n` +
        `📋 لعرض التذكيرات المتبقية، استخدم ${code('/listreminders')}\n\n` +
        `➕ لإضافة تذكير جديد، استخدم ${code('/addreminder')}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('لم يتم العثور على التذكير')}\n\n` +
        `لا يوجد تذكير برقم ${code(reminderId.toString())} أو أنه لا يخصك\\.\n\n` +
        `📋 للتحقق من تذكيراتك، استخدم ${code('/listreminders')}\n\n` +
        `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deletereminder:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء حذف التذكير')}\n\n` +
      `حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}