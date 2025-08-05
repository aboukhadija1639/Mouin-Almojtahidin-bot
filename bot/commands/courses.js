import { getLessons } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleCourses(ctx) {
  try {
    // Get all lessons from database and config
    const lessonsResult = await getLessons();
    const dbLessons = lessonsResult.success ? lessonsResult.data : [];
    const configLessons = config.schedule.lessons;
    
    // Combine lessons (database takes priority)
    const allLessons = [...dbLessons];
    
    // Add config lessons if not already in database
    configLessons.forEach(configLesson => {
      const exists = dbLessons.some(dbLesson => 
        dbLesson.title === configLesson.title && 
        dbLesson.date === configLesson.date
      );
      if (!exists) {
        allLessons.push({
          lesson_id: configLesson.course_id,
          title: configLesson.title,
          date: configLesson.date,
          time: configLesson.time,
          zoom_link: configLesson.zoom_link
        });
      }
    });

    if (allLessons.length === 0) {
      await ctx.reply(
        `📚 *${escapeMarkdownV2('قائمة الدروس')}*\n\n` +
        `${escapeMarkdownV2('لا توجد دروس مجدولة حالياً.')}\n` +
        `💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    // Sort lessons by date and time
    allLessons.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA - dateB;
    });

    // Build courses message
    let message = `📚 *${escapeMarkdownV2('قائمة الدروس المجدولة')}*\n\n`;
    
    let upcomingLessons = [];
    let pastLessons = [];
    const now = new Date();

    allLessons.forEach((lesson, index) => {
      const lessonDate = new Date(`${lesson.date} ${lesson.time}`);
      const formattedDate = new Date(lesson.date).toLocaleDateString('ar-SA');
      const formattedTime = lesson.time;
      
      const lessonInfo = `${index + 1}\\. *${escapeMarkdownV2(lesson.title)}*\n` +
        `   📅 ${escapeMarkdownV2('التاريخ:')} ${escapeMarkdownV2(formattedDate)}\n` +
        `   ⏰ ${escapeMarkdownV2('الوقت:')} ${escapeMarkdownV2(formattedTime)}\n`;
        
      if (lessonDate > now) {
        upcomingLessons.push(lessonInfo);
      } else {
        pastLessons.push(lessonInfo);
      }
    });

    // Add upcoming lessons
    if (upcomingLessons.length > 0) {
      message += `🔮 *${escapeMarkdownV2('الدروس القادمة:')}*\n\n`;
      message += upcomingLessons.join('\n');
      message += `\n`;
    }

    // Add past lessons
    if (pastLessons.length > 0) {
      message += `📋 *${escapeMarkdownV2('الدروس السابقة:')}*\n\n`;
      message += pastLessons.join('\n');
      message += `\n`;
    }

    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
    message += `📊 ${escapeMarkdownV2('إجمالي الدروس:')} ${allLessons.length}\n`;
    message += `🔔 ${escapeMarkdownV2('استخدم /attendance لتسجيل حضورك بعد الدرس')}\n\n`;
    message += `💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /courses:', error);
    await ctx.reply(
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}