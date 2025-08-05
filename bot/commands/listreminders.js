// bot/commands/listreminders.js
import { getUserReminders } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleListReminders(ctx) {
  try {
    const userId = ctx.from.id;
    
    // Get user's reminders
    const reminders = await getUserReminders(userId);
    
    if (reminders.length === 0) {
      await ctx.reply(
        escapeMarkdownV2(
          `📅 *قائمة التذكيرات الخاصة بك*\n\n` +
          `لا توجد تذكيرات نشطة حالياً.\n\n` +
          `💡 لإضافة تذكير جديد، استخدم:\n` +
          `/addreminder التاريخ_الوقت الرسالة`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let message = escapeMarkdownV2(
      `📅 *قائمة التذكيرات الخاصة بك*\n\n` +
      `لديك ${reminders.length} تذكير نشط:\n\n`
    );

    reminders.forEach((reminder, index) => {
      const reminderDate = new Date(reminder.reminder_datetime);
      const formattedDate = reminderDate.toLocaleDateString('ar-SA');
      const formattedTime = reminderDate.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      message += escapeMarkdownV2(
        `${index + 1}. *${formattedDate}* في ${formattedTime}\n` +
        `   📝 ${reminder.message}\n` +
        `   🆔 ID: ${reminder.reminder_id}\n\n`
      );
    });

    message += escapeMarkdownV2(
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 *كيفية حذف تذكير:*\n` +
      `استخدم: \`/deletereminder رقم_ID\`\n` +
      `مثال: \`/deletereminder ${reminders[0].reminder_id}\`\n\n` +
      `📞 للمساعدة: ${config.admin.supportChannel}`
    );

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /listreminders:', error);
    await ctx.reply(
      escapeMarkdownV2(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`),
      { parse_mode: 'MarkdownV2' }
    );
  }
}