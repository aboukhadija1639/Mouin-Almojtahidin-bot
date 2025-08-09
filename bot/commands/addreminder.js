import { addReminder, getCustomReminders } from '../utils/database.js';
import { config } from '../../config.js';
import { templates, reminderTemplates } from '../utils/messageTemplates.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handleAddReminder(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      // Show user's existing reminders
      const reminders = await getCustomReminders(userId);
      
      let message = templates.info(
        'إضافة تذكير مخصص',
        `الصيغة الصحيحة: ${code('/addreminder التاريخ_الوقت الرسالة')}\n\nتنسيق التاريخ والوقت: ${code('YYYY-MM-DD HH:MM')}\nمثال: ${code('2024-01-15 19:00')}`
      );

      if (reminders.length > 0) {
        message += `\n\n📋 ${bold('تذكيراتك الحالية:')}\n`;
        
        reminders.forEach((reminder, index) => {
          const status = reminder.is_sent ? '✅ تم الإرسال' : '⏰ في الانتظار';
          
          message += `${index + 1}\\. ${bold(escapeMarkdownV2(reminder.reminder_datetime))}\n`;
          message += `   💬 ${escapeMarkdownV2(reminder.message)}\n`;
          message += `   ${status}\n\n`;
        });
      } else {
        message += `\n\n📋 ${italic('لا توجد تذكيرات مخصصة حالياً')}\n\n`;
      }

      message += `💡 ${bold('أمثلة:')}\n`;
      message += `• ${code('/addreminder 2024-01-15 19:00 مراجعة الدرس')}\n`;
      message += `• ${code('/addreminder 2024-01-20 14:30 تسليم الواجب')}\n`;
      message += `• ${code('/addreminder 2024-01-25 09:00 اجتماع مع المدرب')}\n\n`;
      message += `⚠️ ${bold('ملاحظة:')} التذكيرات تُرسل قبل 5 دقائق من الوقت المحدد`;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    // Extract date/time and message
    const dateTimeStr = args[1] + ' ' + args[2];
    const reminderMessage = args.slice(3).join(' ');

    // Validate date/time format
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (!dateTimeRegex.test(dateTimeStr)) {
      await ctx.reply(
        templates.error(
          'تنسيق التاريخ والوقت غير صحيح',
          `التنسيق المطلوب: ${code('YYYY-MM-DD HH:MM')}`,
          `أمثلة: ${code('2024-01-15 19:00')} أو ${code('2024-12-25 14:30')}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse and validate date/time
    const reminderDateTime = new Date(dateTimeStr);
    const now = new Date();

    if (isNaN(reminderDateTime.getTime())) {
      await ctx.reply(
        templates.error(
          'تاريخ أو وقت غير صحيح',
          'يرجى التأكد من صحة التاريخ والوقت',
          `مثال صحيح: ${code('2024-01-15 19:00')}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (reminderDateTime <= now) {
      await ctx.reply(
        templates.error(
          'التاريخ في الماضي',
          'لا يمكن إضافة تذكير لوقت في الماضي',
          'يرجى اختيار تاريخ ووقت في المستقبل'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if message is not empty
    if (!reminderMessage || reminderMessage.trim().length === 0) {
      await ctx.reply(
        templates.error(
          'الرسالة فارغة',
          'يرجى إضافة رسالة للتذكير',
          `مثال: ${code('/addreminder 2024-01-15 19:00 مراجعة الدرس')}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate message length
    if (reminderMessage.length > 200) {
      await ctx.reply(
        templates.error(
          'رسالة التذكير طويلة جداً',
          `يجب أن تكون رسالة التذكير أقل من 200 حرف. الرسالة الحالية: ${reminderMessage.length} حرف`,
          'اجعل رسالة التذكير مختصرة وواضحة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add reminder to database
    const reminderId = await addReminder(userId, dateTimeStr, reminderMessage);
    
    if (reminderId) {
      await ctx.reply(
        reminderTemplates.created({
          datetime: dateTimeStr,
          message: reminderMessage,
          id: reminderId
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في إضافة التذكير',
          'حدث خطأ تقني أثناء إضافة التذكير',
          `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addreminder:', error);
    await ctx.reply(
      templates.error(
        'حدث خطأ غير متوقع',
        'تعذر معالجة طلبك في الوقت الحالي',
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}