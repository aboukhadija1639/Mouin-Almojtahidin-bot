// bot/commands/upcominglessons.js
import { getUpcomingLessons } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleUpcomingLessons(ctx) {
  try {
    // Get upcoming lessons for the next 7 days
    const lessons = await getUpcomingLessons(7);
    
    if (lessons.length === 0) {
      await ctx.reply(
        escapeMarkdownV2(
          `📅 *الدروس القادمة*\n\n` +
          `لا توجد دروس مجدولة خلال الأسبوع القادم.\n\n` +
          `💡 تابع الإعلانات للحصول على آخر التحديثات.\n` +
          `📞 للاستفسار: ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let message = escapeMarkdownV2(
      `📅 *الدروس القادمة*\n\n` +
      `إليك الدروس المجدولة خلال الأسبوع القادم:\n\n`
    );

    lessons.forEach((lesson, index) => {
      const lessonDate = new Date(lesson.date);
      const formattedDate = lessonDate.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = lesson.time;
      const courseName = lesson.course_name || 'غير محدد';
      
      message += escapeMarkdownV2(
        `${index + 1}. *${lesson.title}*\n` +
        `   📚 الكورس: ${courseName}\n` +
        `   📅 التاريخ: ${formattedDate}\n` +
        `   ⏰ الوقت: ${formattedTime}\n`
      );

      if (lesson.zoom_link) {
        message += escapeMarkdownV2(`   🔗 رابط الزوم: ${lesson.zoom_link}\n`);
      }
      
      message += '\n';
    });

    message += escapeMarkdownV2(
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📝 *ملاحظات مهمة:*\n` +
      `• تأكد من حضور الدروس في الوقت المحدد\n` +
      `• احتفظ بروابط الزوم في مكان آمن\n` +
      `• للتذكيرات، استخدم \`/reminders\`\n\n` +
      `📞 للمساعدة: ${config.admin.supportChannel}`
    );

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /upcominglessons:', error);
    await ctx.reply(
      escapeMarkdownV2(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`),
      { parse_mode: 'MarkdownV2' }
    );
  }
}