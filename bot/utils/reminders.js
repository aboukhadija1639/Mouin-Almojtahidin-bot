import schedule from 'node-schedule';
import { getLessons, getVerifiedUsersWithReminders } from './database.js';
import { config } from '../../config.js';
import { logActivity, logError } from '../middlewares/logger.js';
// Enhanced: Use hash for config lessons without ID
import crypto from 'crypto';

let bot = null;
let scheduledJobs = new Map();

// Initialize reminder system
export function initReminders(telegramBot) {
  bot = telegramBot;
  scheduleAllReminders();
  logActivity('تم تهيئة نظام التذكيرات');
}

function getLessonKey(lesson) {
  if (lesson.lesson_id) return lesson.lesson_id;
  // Hash title + date + time to avoid collisions
  const hash = crypto.createHash('md5').update(`${lesson.title}_${lesson.date}_${lesson.time}`).digest('hex').slice(0, 8);
  return `config_${hash}`;
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
  const key = getLessonKey(lesson);
  scheduledJobs.set(`${key}_24h`, job24h);
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
    const escapedTitle = lesson.title.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    const escapedDate = lesson.date.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    const escapedTime = lesson.time.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    const escapedTimeBefore = timeBefore.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    const escapedZoomLink = (lesson.zoom_link || config.zoom.fullLink).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    
    const reminderMessage = `⏰ *تذكير بالدرس*\\n\\n` +
      `📚 *عنوان الدرس:* ${escapedTitle}\\n` +
      `📅 *التاريخ:* ${escapedDate}\\n` +
      `⏰ *الوقت:* ${escapedTime}\\n` +
      `🔔 *يبدأ خلال:* ${escapedTimeBefore}\\n\\n` +
      `🔗 *رابط الدرس:* [انقر هنا](${lesson.zoom_link || config.zoom.fullLink})\\n\\n` +
      `📋 لا تنسَ تسجيل حضورك باستخدام /attendance بعد الدرس\\n\\n` +
      `━━━━━━━━━━━━━━━━━━━━\\n` +
      `🤖 بوت معين المجتهدين`;

    let successCount = 0;
    let failCount = 0;

    // Send to main group with mentions
    if (config.admin.groupId && verifiedUsers.length > 0) {
      try {
        const mentions = verifiedUsers.map(userId => `[‌](tg://user?id=${userId})`).join('');
        const groupMessage = `${reminderMessage}\n\n${mentions}`;
        
        await bot.telegram.sendMessage(config.admin.groupId, groupMessage, { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        });
        successCount++;
      } catch (groupError) {
        logError(groupError, 'GROUP_REMINDER');
        failCount++;
      }
    }

    // Send private messages to verified users
    for (const userId of verifiedUsers) {
      try {
        await bot.telegram.sendMessage(userId, reminderMessage, { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        });
        successCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (userError) {
        logError(userError, `USER_REMINDER_${userId}`);
        failCount++;
      }
    }

    logActivity(`تم إرسال تذكير الدرس ${lesson.title} (${timeBefore}): نجح ${successCount}، فشل ${failCount}`);

    // Notify admin about reminder sent
          if (config.admin.chatId) {
        try {
          const escapedLessonTitle = lesson.title.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
          const escapedTimeBefore = timeBefore.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
          
          const adminMessage = `📤 *تم إرسال تذكير الدرس*\\n\\n` +
            `📚 الدرس: ${escapedLessonTitle}\\n` +
            `⏰ التوقيت: ${escapedTimeBefore} قبل البداية\\n` +
            `✅ نجح: ${successCount}\\n` +
            `❌ فشل: ${failCount}`;
          
          await bot.telegram.sendMessage(config.admin.chatId, adminMessage, { parse_mode: 'MarkdownV2' });
        } catch (adminError) {
          logError(adminError, 'ADMIN_REMINDER_NOTIFICATION');
        }
      }
  } catch (error) {
    logError(error, 'SEND_REMINDER');
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