// bot/commands/upcominglessons.js
import { getUpcomingLessons } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleUpcominglessons(ctx) {
  try {
    const userId = ctx.from.id;
    
    // Get upcoming lessons (next 7 days)
    const lessons = await getUpcomingLessons(7);
    
    if (!lessons || lessons.length === 0) {
      await ctx.reply(
        `📅 ${bold('الدروس القادمة')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📭 ${italic('لا توجد دروس مجدولة في الأيام السبعة القادمة')}\n\n` +
        `💡 ${bold('للمزيد من المعلومات:')}\n` +
        `• استخدم ${code('/courses')} لعرض جميع الدورات\n` +
        `• تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}\n\n` +
        `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let message = `📅 ${bold('الدروس القادمة')}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 ${bold(`${lessons.length} درس مجدول في الأيام السبعة القادمة:`)}\n\n`;

    lessons.forEach((lesson, index) => {
      const lessonDate = new Date(`${lesson.date} ${lesson.time}`);
      const formattedDate = lessonDate.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = lessonDate.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate days until lesson
      const today = new Date();
      const timeDiff = lessonDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      let timeIndicator = '';
      if (daysDiff === 0) {
        timeIndicator = '🔴 اليوم';
      } else if (daysDiff === 1) {
        timeIndicator = '🟡 غداً';
      } else if (daysDiff <= 3) {
        timeIndicator = `🟠 خلال ${daysDiff} أيام`;
      } else {
        timeIndicator = `🟢 خلال ${daysDiff} أيام`;
      }

      message += `${index + 1}\\. ${bold(escapeMarkdownV2(lesson.title))}\n`;
      message += `   📅 ${formattedDate}\n`;
      message += `   ⏰ ${formattedTime}\n`;
      message += `   ⏳ ${timeIndicator}\n`;
      
      if (lesson.zoom_link) {
        message += `   🔗 ${code('رابط الحضور متوفر')}\n`;
      }
      
      message += `\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💡 ${bold('ملاحظات مهمة:')}\n`;
    message += `• 🔔 ستصلك تذكيرات قبل كل درس\n`;
    message += `• 📝 لا تنس تسجيل الحضور باستخدام ${code('/attendance')}\n`;
    message += `• 📚 راجع المواد قبل الدرس\n\n`;
    message += `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /upcominglessons:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء جلب الدروس القادمة')}\n\n` +
      `حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}