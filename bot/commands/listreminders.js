// bot/commands/listreminders.js
import { getUserReminders } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleListreminders(ctx) {
  try {
    const userId = ctx.from.id;
    
    // Get user's reminders
    const reminders = await getUserReminders(userId);
    
    if (reminders.length === 0) {
      await ctx.reply(
        `📅 ${bold('قائمة التذكيرات الخاصة بك')}\n\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `📭 ${italic('لا توجد تذكيرات نشطة حالياً')}\n\n` +
        `💡 ${bold('لإضافة تذكير جديد:')}\n` +
        `${code('/addreminder التاريخ_الوقت الرسالة')}\n\n` +
        `${escapeMarkdownV2('📞 للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let message = `📅 ${bold('قائمة التذكيرات الخاصة بك')}\n\n`;
    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
    message += `📊 ${bold(`لديك ${reminders.length} تذكير نشط:`)}\n\n`;

    reminders.forEach((reminder, index) => {
      const reminderDate = new Date(reminder.reminder_datetime);
      const formattedDate = reminderDate.toLocaleDateString('ar-SA');
      const formattedTime = reminderDate.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      message += `${index + 1}\\. ${bold(escapeMarkdownV2(formattedDate))} ${escapeMarkdownV2('في')} ${escapeMarkdownV2(formattedTime)}\n`;
      message += `   📝 ${escapeMarkdownV2(reminder.message)}\n`;
      message += `   🆔 ID: ${code(reminder.reminder_id.toString())}\n\n`;
    });

    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
    message += `💡 ${bold('كيفية حذف تذكير:')}\n`;
    message += `${escapeMarkdownV2('استخدم:')} ${code('/deletereminder رقم_ID')}\n`;
    message += `${escapeMarkdownV2('مثال:')} ${code(`/deletereminder ${reminders[0].reminder_id}`)}\n\n`;
    message += `${escapeMarkdownV2('📞 للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /listreminders:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}