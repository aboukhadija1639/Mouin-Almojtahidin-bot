import schedule from 'node-schedule';
import { getLessons, getVerifiedUsersWithReminders } from './database.js';
import { config } from '../../config.js';
import { logActivity, logError } from '../middlewares/logger.js';

let bot = null;
let scheduledJobs = new Map();

// Initialize reminder system
export function initReminders(telegramBot) {
  bot = telegramBot;
  scheduleAllReminders();
  logActivity('تم تهيئة نظام التذكيرات');
}

// Schedule all lesson reminders
export async function scheduleAllReminders() {
  try {
    // Clear existing scheduled jobs
    clearAllScheduledJobs();

    // Get all lessons from database
    const lessonsResult = await getLessons();
    const lessons = lessonsResult.success ? lessonsResult.data : [];
    
    // Also get lessons from config as backup/initial data
    const configLessons = config.schedule.lessons;
    
    // Combine lessons (database takes priority)
    const allLessons = [...lessons];
    
    // Add config lessons if not already in database
    configLessons.forEach(configLesson => {
      const exists = lessons.some(dbLesson => 
        dbLesson.title === configLesson.title && 
        dbLesson.date === configLesson.date
      );
      if (!exists) {
        allLessons.push(configLesson);
      }
    });

    // Schedule reminders for each lesson
    allLessons.forEach(lesson => {
      scheduleReminderForLesson(lesson);
    });

    logActivity(`تم جدولة تذكيرات لـ ${allLessons.length} درس`);
  } catch (error) {
    logError(error, 'SCHEDULE_REMINDERS');
  }
}

// Schedule reminder for a single lesson
function scheduleReminderForLesson(lesson) {
  try {
    const lessonDate = new Date(`${lesson.date} ${lesson.time}`);
    const now = new Date();

    // Skip past lessons
    if (lessonDate <= now) {
      return;
    }

    // Schedule 24-hour reminder
    const reminder24h = new Date(lessonDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      const job24h = schedule.scheduleJob(reminder24h, () => {
        sendLessonReminder(lesson, '24 ساعة');
      });
      scheduledJobs.set(`${lesson.lesson_id || lesson.title}_24h`, job24h);
    }

    // Schedule 1-hour reminder
    const reminder1h = new Date(lessonDate.getTime() - 60 * 60 * 1000);
    if (reminder1h > now) {
      const job1h = schedule.scheduleJob(reminder1h, () => {
        sendLessonReminder(lesson, 'ساعة واحدة');
      });
      scheduledJobs.set(`${lesson.lesson_id || lesson.title}_1h`, job1h);
    }

    logActivity(`تم جدولة تذكيرات للدرس: ${lesson.title} في ${lesson.date} ${lesson.time}`);
  } catch (error) {
    logError(error, `SCHEDULE_LESSON_${lesson.title}`);
  }
}

// Send lesson reminder
async function sendLessonReminder(lesson, timeBefore) {
  try {
    if (!bot) {
      logError(new Error('البوت غير مهيأ للتذكيرات'), 'SEND_REMINDER');
      return;
    }

    // Get verified users with reminders enabled
    const verifiedUsers = await getVerifiedUsersWithReminders();
    
    // Create reminder message with proper MarkdownV2 escaping
    const { escapeMarkdownV2, bold } = await import('./escapeMarkdownV2.js');
    const escapedTitle = escapeMarkdownV2(lesson.title || 'درس');
    const escapedDate = escapeMarkdownV2(lesson.date || '');
    const escapedTime = escapeMarkdownV2(lesson.time || '');
    const escapedTimeBefore = escapeMarkdownV2(timeBefore);
    
    const reminderMessage = 
      `⏰ ${bold('تذكير بالدرس')}\n\n` +
      `📚 ${bold('الدرس:')} ${escapedTitle}\n` +
      `📅 ${bold('التاريخ:')} ${escapedDate}\n` +
      `🕐 ${bold('الوقت:')} ${escapedTime}\n` +
      `⌛ ${bold('يبدأ خلال:')} ${escapedTimeBefore}\n\n` +
      `${lesson.zoom_link ? `🔗 ${bold('رابط الزوم:')} ${escapeMarkdownV2(lesson.zoom_link)}\n\n` : ''}` +
      `📝 ${escapeMarkdownV2('لا تنسَ حضور الدرس وتسجيل حضورك!')}\n` +
      `📋 ${escapeMarkdownV2('استخدم')} /attendance ${lesson.lesson_id || lesson.id || ''} ${escapeMarkdownV2('لتسجيل الحضور')}`;

    // Send reminder to all eligible users
    let sentCount = 0;
    let errorCount = 0;
    
    for (const userId of verifiedUsers) {
      try {
        await bot.telegram.sendMessage(userId, reminderMessage, {
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        });
        sentCount++;
        
        // Add small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (userError) {
        errorCount++;
        logError(userError, `SEND_REMINDER_USER_${userId}`);
      }
    }

    logActivity(
      `تم إرسال تذكير الدرس "${lesson.title}" إلى ${sentCount} مستخدم. أخطاء: ${errorCount}`
    );
  } catch (error) {
    logError(error, 'SEND_LESSON_REMINDER');
  }
}

// Clear all scheduled jobs
function clearAllScheduledJobs() {
  scheduledJobs.forEach((job, key) => {
    if (job) {
      job.cancel();
    }
  });
  scheduledJobs.clear();
  logActivity('تم إلغاء جميع المهام المجدولة');
}

// Add new lesson reminder (called when admin adds a lesson)
export function addLessonReminder(lesson) {
  scheduleReminderForLesson(lesson);
}

// Remove lesson reminder (called when admin removes a lesson)
export function removeLessonReminder(lessonId) {
  const job24h = scheduledJobs.get(`${lessonId}_24h`);
  const job1h = scheduledJobs.get(`${lessonId}_1h`);
  
  if (job24h) {
    job24h.cancel();
    scheduledJobs.delete(`${lessonId}_24h`);
  }
  
  if (job1h) {
    job1h.cancel();
    scheduledJobs.delete(`${lessonId}_1h`);
  }
  
  logActivity(`تم إلغاء تذكيرات الدرس ${lessonId}`);
}

// Get scheduled jobs info (for debugging)
export function getScheduledJobsInfo() {
  const jobs = [];
  scheduledJobs.forEach((job, key) => {
    jobs.push({
      key,
      nextInvocation: job.nextInvocation()
    });
  });
  return jobs;
}

// Cleanup function
export function cleanupReminders() {
  clearAllScheduledJobs();
  logActivity('تم تنظيف نظام التذكيرات');
}