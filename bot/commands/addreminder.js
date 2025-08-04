import { addCustomReminder, getCustomReminders } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleAddReminder(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      // Show user's existing reminders
      const reminders = await getCustomReminders(userId);
      
      let message = `🔔 *إضافة تذكير مخصص*\\n\\n` +
        `📝 *الصيغة الصحيحة:*\\n` +
        `\`/addreminder التاريخ_الوقت الرسالة\`\\n\\n` +
        `📅 *تنسيق التاريخ والوقت:*\\n` +
        `\`YYYY-MM-DD HH:MM\` (مثال: 2024-01-15 19:00)\\n\\n`;

      if (reminders.length > 0) {
        message += `📋 *تذكيراتك الحالية:*\\n\\n`;
        
        reminders.forEach((reminder, index) => {
          const escapedDateTime = escapeMarkdownV2(reminder.reminder_datetime);
          const escapedMessage = escapeMarkdownV2(reminder.message);
          const status = reminder.is_sent ? '✅ تم الإرسال' : '⏰ في الانتظار';
          
          message += `${index + 1}\\. *${escapedDateTime}*\\n` +
            `   💬 ${escapedMessage}\\n` +
            `   ${status}\\n\\n`;
        });
      } else {
        message += `📋 لا توجد تذكيرات مخصصة حالياً\\.\\n\\n`;
      }

      message += `💡 *أمثلة:*\\n` +
        `• \`/addreminder 2024-01-15 19:00 مراجعة الدرس\`\\n` +
        `• \`/addreminder 2024-01-20 14:30 تسليم الواجب\`\\n` +
        `• \`/addreminder 2024-01-25 09:00 اجتماع مع المدرب\`\\n\\n` +
        `⚠️ *ملاحظة:* التذكيرات تُرسل قبل 5 دقائق من الوقت المحدد\\.`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    // Extract date/time and message
    const dateTimeStr = args[1] + ' ' + args[2];
    const message = args.slice(3).join(' ');

    // Validate date/time format
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (!dateTimeRegex.test(dateTimeStr)) {
      await ctx.reply(
        `❌ *تنسيق التاريخ والوقت غير صحيح*\\n\\n` +
        `📅 *التنسيق المطلوب:* \`YYYY-MM-DD HH:MM\`\\n\\n` +
        `💡 *أمثلة:*\\n` +
        `• \`2024-01-15 19:00\`\\n` +
        `• \`2024-12-25 14:30\`\\n\\n` +
        `استخدم \`/addreminder\` لعرض المساعدة\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse and validate date/time
    const reminderDateTime = new Date(dateTimeStr);
    const now = new Date();

    if (isNaN(reminderDateTime.getTime())) {
      await ctx.reply(
        `❌ *تاريخ أو وقت غير صحيح*\\n\\n` +
        `يرجى التأكد من صحة التاريخ والوقت\\.\\n\\n` +
        `💡 مثال: \`2024-01-15 19:00\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (reminderDateTime <= now) {
      await ctx.reply(
        `❌ *التاريخ في الماضي*\\n\\n` +
        `لا يمكن إضافة تذكير لوقت في الماضي\\.\\n\\n` +
        `يرجى اختيار تاريخ ووقت في المستقبل\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if message is not empty
    if (!message || message.trim().length === 0) {
      await ctx.reply(
        `❌ *الرسالة فارغة*\\n\\n` +
        `يرجى إضافة رسالة للتذكير\\.\\n\\n` +
        `💡 مثال: \`/addreminder 2024-01-15 19:00 مراجعة الدرس\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add reminder to database
    const reminderId = await addCustomReminder(userId, dateTimeStr, message);
    
    if (reminderId) {
      const escapedDateTime = escapeMarkdownV2(dateTimeStr);
      const escapedMessage = escapeMarkdownV2(message);
      const formattedDate = reminderDateTime.toLocaleDateString('ar-SA');
      const formattedTime = reminderDateTime.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      await ctx.reply(
        `✅ *تم إضافة التذكير بنجاح*\\n\\n` +
        `🆔 *رقم التذكير:* ${escapeMarkdownV2(reminderId.toString())}\\n` +
        `📅 *التاريخ:* ${escapeMarkdownV2(formattedDate)}\\n` +
        `⏰ *الوقت:* ${escapeMarkdownV2(formattedTime)}\\n` +
        `💬 *الرسالة:* ${escapedMessage}\\n\\n` +
        `🔔 سيتم إرسال التذكير قبل 5 دقائق من الوقت المحدد\\.\\n\\n` +
        `📋 استخدم \`/addreminder\` لعرض جميع تذكيراتك\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في إضافة التذكير*\\n\\n` +
        `حدث خطأ تقني أثناء إضافة التذكير\\.\\n` +
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addreminder:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}