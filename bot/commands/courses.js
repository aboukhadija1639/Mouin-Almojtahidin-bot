import { getLessons } from '../utils/database.js';
import { courseCacheUtil } from '../utils/cache.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handleCourses(ctx) {
  const startTime = Date.now();
  console.log('[COURSES] Command invoked', { user: ctx.from?.id, timestamp: new Date().toISOString() });

  try {
    // Check cache first
    let allLessons = courseCacheUtil.getAll();
    
    if (!allLessons) {
      console.log('[COURSES] Lessons not in cache, fetching from database');
      
      // Get all lessons from database and config
      const lessonsResult = await getLessons();
      const dbLessons = lessonsResult.success ? lessonsResult.data : [];
      const configLessons = config.schedule?.lessons || [];
      
      // Combine lessons (database takes priority)
      allLessons = [...dbLessons];
      
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

      // Cache the combined lessons for 10 minutes
      courseCacheUtil.setAll(allLessons, 600);
      console.log(`[COURSES] Cached ${allLessons.length} lessons`);
    } else {
      console.log(`[COURSES] Using cached lessons: ${allLessons.length} items`);
    }

    if (allLessons.length === 0) {
      await ctx.reply(
        `📚 ${bold('قائمة الدروس')}\n\n` +
        `${escapeMarkdownV2('لا توجد دروس مجدولة حالياً.')}\n\n` +
        `💡 ${bold('للمساعدة:')} ${escapeMarkdownV2(config.admin?.supportChannel || '@support')}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    // Sort lessons by date and time (more efficient sorting)
    allLessons.sort((a, b) => {
      // Create comparable date strings
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    // Build the response message
    const responseMessage = buildCoursesMessage(allLessons);

    await ctx.reply(responseMessage, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });

    const duration = Date.now() - startTime;
    console.log(`[COURSES] Command completed in ${duration}ms`);

  } catch (error) {
    console.error('[COURSES] Error handling courses command:', {
      message: error.message,
      stack: error.stack,
      user: ctx.from?.id
    });

    // Send error message to user
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('عذراً، حدث خطأ أثناء عرض قائمة الدروس.')}\n` +
      `${escapeMarkdownV2('يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.')}\n\n` +
      `💬 ${bold('الدعم:')} ${escapeMarkdownV2(config.admin?.supportChannel || '@support')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Helper function to build the courses message
function buildCoursesMessage(lessons) {
  let message = `📚 ${bold('قائمة الدروس المجدولة')}\n\n`;
  message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let upcomingLessons = [];
  let pastLessons = [];

  // Categorize lessons
  lessons.forEach(lesson => {
    const lessonDate = new Date(`${lesson.date} ${lesson.time || '00:00'}`);
    if (lessonDate >= now || lesson.date === today) {
      upcomingLessons.push(lesson);
    } else {
      pastLessons.push(lesson);
    }
  });

  // Show upcoming lessons first
  if (upcomingLessons.length > 0) {
    message += `🟢 ${bold('الدروس القادمة:')}\n\n`;
    
    upcomingLessons.slice(0, 5).forEach((lesson, index) => { // Limit to 5 upcoming lessons
      message += formatLessonEntry(lesson, index + 1, true);
    });

    if (upcomingLessons.length > 5) {
      message += `\n${italic(`... و ${upcomingLessons.length - 5} دروس أخرى`)}\n`;
    }
  }

  // Show recent past lessons
  if (pastLessons.length > 0) {
    message += `\n🔘 ${bold('الدروس السابقة:')}\n\n`;
    
    // Show last 3 past lessons
    pastLessons.slice(-3).forEach((lesson, index) => {
      message += formatLessonEntry(lesson, index + 1, false);
    });

    if (pastLessons.length > 3) {
      message += `\n${italic(`... و ${pastLessons.length - 3} دروس أخرى`)}\n`;
    }
  }

  message += `\n${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
  message += `📊 ${bold('الإحصائيات:')}\n`;
  message += `${escapeMarkdownV2('• المجموع:')} ${lessons.length} ${escapeMarkdownV2('درس')}\n`;
  message += `${escapeMarkdownV2('• القادمة:')} ${upcomingLessons.length} ${escapeMarkdownV2('درس')}\n`;
  message += `${escapeMarkdownV2('• المكتملة:')} ${pastLessons.length} ${escapeMarkdownV2('درس')}\n\n`;
  
  message += `💡 ${italic('لعرض تفاصيل أكثر، استخدم')} ${code('/upcominglessons')}`;

  return message;
}

// Helper function to format individual lesson entries
function formatLessonEntry(lesson, index, isUpcoming) {
  const statusIcon = isUpcoming ? '🟢' : '🔘';
  const title = escapeMarkdownV2(lesson.title || 'درس بدون عنوان');
  const date = escapeMarkdownV2(lesson.date || 'تاريخ غير محدد');
  const time = escapeMarkdownV2(lesson.time || 'وقت غير محدد');
  
  let entry = `${statusIcon} ${bold(title)}\n`;
  entry += `   📅 ${date} | ⏰ ${time}\n`;
  
  if (lesson.zoom_link && isUpcoming) {
    entry += `   🔗 ${escapeMarkdownV2('رابط الدرس متوفر')}\n`;
  }
  
  entry += `\n`;
  
  return entry;
}