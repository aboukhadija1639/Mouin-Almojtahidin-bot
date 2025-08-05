// bot/commands/deletereminder.js
import { deleteReminder, getUserReminders } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleDeleteReminder(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    
    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        escapeMarkdownV2(
          `🗑️ *كيفية حذف تذكير*\n\n` +
          `الصيغة الصحيحة: \`/deletereminder رقم_ID\`\n` +
          `مثال: \`/deletereminder 123\`\n\n` +
          `💡 لمعرفة أرقام تذكيراتك، استخدم: \`/listreminders\``
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const reminderId = parseInt(args[1]);

    // Validate reminder ID
    if (isNaN(reminderId) || reminderId <= 0) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *رقم التذكير غير صحيح*\n\n` +
          `يرجى إدخال رقم صحيح للتذكير.\n` +
          `استخدم \`/listreminders\` لمعرفة أرقام تذكيراتك.`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if reminder exists and belongs to user
    const userReminders = await getUserReminders(userId);
    const reminderExists = userReminders.find(r => r.reminder_id === reminderId);
    
    if (!reminderExists) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *التذكير غير موجود*\n\n` +
          `لم يتم العثور على تذكير برقم ${reminderId} في قائمتك.\n` +
          `استخدم \`/listreminders\` لمعرفة تذكيراتك النشطة.`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Delete the reminder
    const deleteSuccess = await deleteReminder(userId, reminderId);
    
    if (deleteSuccess) {
      await ctx.reply(
        escapeMarkdownV2(
          `✅ *تم حذف التذكير بنجاح*\n\n` +
          `🆔 *رقم التذكير المحذوف:* ${reminderId}\n` +
          `📝 *الرسالة:* ${reminderExists.message}\n\n` +
          `💡 يمكنك إضافة تذكيرات جديدة باستخدام \`/addreminder\``
        ),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *فشل في حذف التذكير*\n\n` +
          `حدث خطأ تقني، حاول مرة أخرى.\n` +
          `إذا استمرت المشكلة، تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deletereminder:', error);
    await ctx.reply(
      escapeMarkdownV2(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`),
      { parse_mode: 'MarkdownV2' }
    );
  }
}