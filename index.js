import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './bot/utils/database.js';
import { initReminders, cleanupReminders } from './bot/utils/reminders.js';
import { loggerMiddleware, logBotStartup, logBotShutdown, logError, logActivity } from './bot/middlewares/logger.js';
import { verifyMiddleware, requireAdmin } from './bot/middlewares/verifyMiddleware.js';
import { rateLimiterMiddleware } from './bot/middlewares/rateLimiter.js';
import { withMonitoring } from './bot/utils/monitoring.js';  // Enhanced: Import monitoring wrapper

// Import command handlers
import { handleStart } from './bot/commands/start.js';
import { handleVerify } from './bot/commands/verify.js';
import { handleFaq } from './bot/commands/faq.js';
import { handleProfile } from './bot/commands/profile.js';
import { handleAttendance } from './bot/commands/attendance.js';
import { handleStats } from './bot/commands/stats.js';
import { handlePublish } from './bot/commands/publish.js';
import { 
  handleAddAssignment, 
  handleUpdateAssignment, 
  handleDeleteAssignment, 
  handleSubmit 
} from './bot/commands/assignment.js';
import { handleCourses } from './bot/commands/courses.js';
import { handleAssignments } from './bot/commands/assignments.js';
import { handleReminders } from './bot/commands/reminders.js';
import { handleHelp } from './bot/commands/help.js';
import { handleDeleteCourse } from './bot/commands/deletecourse.js';
import { handleAddCourse } from './bot/commands/addcourse.js';
import { handleUpdateCourse } from './bot/commands/updatecourse.js';
import { handleAddReminder } from './bot/commands/addreminder.js';
import { handleExport } from './bot/commands/export.js';
import { handleFeedback, handleViewFeedback } from './bot/commands/feedback.js';
import { handleSettings, handleToggleReminders, handleChangeLanguage, handleChangeFrequency, handleSettingsHelp } from './bot/commands/settings.js';
import { handleHealth } from './bot/commands/health.js';
import { handleListreminders } from './bot/commands/listreminders.js';
import { handleDeleteReminder } from './bot/commands/deletereminder.js';
import { handleUpcominglessons } from './bot/commands/upcominglessons.js';
import { handleBroadcast } from './bot/commands/broadcast.js';
import { handleReportbug } from './bot/commands/reportbug.js';
import { escapeMarkdownV2 } from './bot/utils/escapeMarkdownV2.js';
import { wrapAsync } from './bot/middlewares/asyncWrapper.js';

// Validate environment variables
function validateConfig() {
  console.log('Validating configuration...');
  if (!config.botToken) {
    console.error('❌ BOT_TOKEN missing in environment variables');
    logError(new Error('BOT_TOKEN missing'), 'CONFIG_VALIDATION');
    process.exit(1);
  }
  
  if (config.admin.userIds.length === 0) {
    console.warn('⚠️ ADMIN_USER_IDS not specified, admin commands will be disabled');
    logActivity('ADMIN_USER_IDS not specified');
  }
  
  if (!config.admin.chatId) {
    console.warn('⚠️ ADMIN_CHAT_ID not specified, startup/shutdown notifications disabled');
    logActivity('ADMIN_CHAT_ID not specified');
  }
  
  // Enhanced: Check for webhook domain if fallback might be used
  if (!process.env.WEBHOOK_DOMAIN) {
    console.warn('⚠️ WEBHOOK_DOMAIN not set, webhook fallback will be disabled');
  }
  
  console.log('✅ Configuration validated successfully');
  logActivity('تم التحقق من متغيرات البيئة بنجاح');
}

// Clear webhook and updates with retry logic (unchanged, but added more logging)
async function clearUpdatesWithRetry(bot, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to delete webhook (Attempt ${attempt}/${maxRetries})`);
      const webhookResponse = await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log('Webhook deletion response:', webhookResponse);
      logActivity('تم حذف الـ webhook');
      
      console.log('Checking for pending updates...');
      const updates = await bot.telegram.getUpdates({ timeout: 1 });
      console.log(`Found ${updates.length} pending updates`);
      if (updates.length > 0) {
        logActivity(`تم العثور على ${updates.length} تحديث معلق، سيتم تنظيفها`);
        await bot.telegram.getUpdates({ 
          offset: updates[updates.length - 1].update_id + 1,
          timeout: 1 
        });
        console.log('Pending updates cleared');
      }
      
      console.log('✅ Updates cleared successfully');
      logActivity('تم تنظيف التحديثات بنجاح');
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete webhook or clear updates (Attempt ${attempt}):`, {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response data',
      });
      logError(error, `CLEAR_UPDATES_ATTEMPT_${attempt}`);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Max retries reached for clearing updates');
        logError(new Error('Failed to clear updates after max retries'), 'CLEAR_UPDATES_FAILED');
        return false;  // Enhanced: Return false to allow fallback or skip
      }
    }
  }
}

// Fixed: No race/timeout, validate token first, launch without await
async function launchBot(bot) {
  try {
    // Enhanced: Validate token with getMe()
    const me = await bot.telegram.getMe();
    console.log(`✅ Bot validated: @${me.username}`);
    logActivity(`تم التحقق من البوت: @${me.username}`);

    // Launch polling (no await, as it runs indefinitely)
    bot.launch({ allowed_updates: ['message', 'callback_query'] }).catch((error) => {
      logError(error, 'BOT_LAUNCH_ERROR');
      process.exit(1);
    });

    console.log('✅ Bot started successfully in polling mode');
    logBotStartup();
  } catch (error) {
    logError(error, 'BOT_LAUNCH');
    throw error;
  }
}

// Fixed: Only fallback if WEBHOOK_DOMAIN set
async function fallbackToWebhook(bot) {
  if (!process.env.WEBHOOK_DOMAIN) {
    throw new Error('WEBHOOK_DOMAIN not set, cannot fallback to webhook');
  }

  try {
    const webhookUrl = `https://${process.env.WEBHOOK_DOMAIN}/bot${config.botToken}`;
    await bot.telegram.setWebhook(webhookUrl);
    logActivity(`Webhook set to ${webhookUrl}`);

    // Setup express server (assuming you have express setup here; if not, add it)
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use(bot.webhookCallback('/bot' + config.botToken));
    app.listen(3000, () => {
      console.log('Webhook server started on port 3000');
    });

    console.log('✅ Bot started in webhook mode');
    logBotStartup();
  } catch (error) {
    logError(error, 'WEBHOOK_FALLBACK');
    throw error;
  }
}

// Main init (Fixed: No retries for launch, try polling then optional webhook)
async function initBot() {
  validateConfig();
  await initDatabase();

  const bot = new Telegraf(config.botToken);

  // Middlewares
  bot.use(loggerMiddleware());
  bot.use(rateLimiterMiddleware);
  bot.use(verifyMiddleware);

  // Clear updates (if fails, proceed anyway for local dev)
  await clearUpdatesWithRetry(bot);

  setupCommandsAndCallbacks(bot);

  try {
    await launchBot(bot);
  } catch (pollingError) {
    logError(pollingError, 'POLLING_FAILED');
    if (process.env.WEBHOOK_DOMAIN) {
      await fallbackToWebhook(bot);
    } else {
      throw new Error('Polling failed and no webhook domain set');
    }
  }

  initReminders(bot);
  setupShutdownHandlers(bot);
}

// Enhanced: Wrap all with withMonitoring and wrapAsync
function setupCommandsAndCallbacks(bot) {
  console.log('Registering bot commands...');

  // Commands
  bot.command('start', withMonitoring(wrapAsync(handleStart), 'start'));
  bot.command('verify', withMonitoring(wrapAsync(handleVerify), 'verify'));
  bot.command('faq', withMonitoring(wrapAsync(handleFaq), 'faq'));
  bot.command('profile', withMonitoring(wrapAsync(handleProfile), 'profile'));
  bot.command('attendance', withMonitoring(wrapAsync(handleAttendance), 'attendance'));
  bot.command('stats', withMonitoring(wrapAsync(handleStats), 'stats'));
  bot.command('publish', withMonitoring(wrapAsync(handlePublish), 'publish'));
  bot.command('addassignment', withMonitoring(wrapAsync(handleAddAssignment), 'addassignment'));
  bot.command('updateassignment', withMonitoring(wrapAsync(handleUpdateAssignment), 'updateassignment'));
  bot.command('deleteassignment', withMonitoring(wrapAsync(handleDeleteAssignment), 'deleteassignment'));
  bot.command('submit', withMonitoring(wrapAsync(handleSubmit), 'submit'));
  bot.command('courses', withMonitoring(wrapAsync(handleCourses), 'courses'));
  bot.command('assignments', withMonitoring(wrapAsync(handleAssignments), 'assignments'));
  bot.command('reminders', withMonitoring(wrapAsync(handleReminders), 'reminders'));
  bot.command('help', withMonitoring(wrapAsync(handleHelp), 'help'));
  bot.command('deletecourse', withMonitoring(wrapAsync(handleDeleteCourse), 'deletecourse'));
  bot.command('addcourse', withMonitoring(wrapAsync(handleAddCourse), 'addcourse'));
  bot.command('updatecourse', withMonitoring(wrapAsync(handleUpdateCourse), 'updatecourse'));
  bot.command('addreminder', withMonitoring(wrapAsync(handleAddReminder), 'addreminder'));
  bot.command('export', withMonitoring(wrapAsync(handleExport), 'export'));
  bot.command('feedback', withMonitoring(wrapAsync(handleFeedback), 'feedback'));
  bot.command('viewfeedback', withMonitoring(wrapAsync(handleViewFeedback), 'viewfeedback'));
  bot.command('settings', withMonitoring(wrapAsync(handleSettings), 'settings'));
  bot.command('health', withMonitoring(wrapAsync(handleHealth), 'health'));
  bot.command('listreminders', withMonitoring(wrapAsync(handleListreminders), 'listreminders'));
  bot.command('deletereminder', withMonitoring(wrapAsync(handleDeleteReminder), 'deletereminder'));
  bot.command('upcominglessons', withMonitoring(wrapAsync(handleUpcominglessons), 'upcominglessons'));
  bot.command('broadcast', withMonitoring(wrapAsync(handleBroadcast), 'broadcast'));
  bot.command('reportbug', withMonitoring(wrapAsync(handleReportbug), 'reportbug'));

  // Unknown commands handler
  bot.on('message', withMonitoring(wrapAsync(async (ctx) => {
    if (!ctx.message.text?.startsWith('/')) return;
    const command = ctx.message.text.split(' ')[0].slice(1).toLowerCase();
    
    await ctx.reply(
      escapeMarkdownV2(
        `❓ *أمر غير معروف: /${command}*\n\n` +
        `📋 *الأوامر المتاحة:*\n\n` +
        `• \`/start\` \\- بدء استخدام البوت\n` +
        `• \`/verify\` \\- تفعيل الحساب\n` +
        `• \`/help\` \\- دليل الاستخدام\n` +
        `• \`/faq\` \\- الأسئلة الشائعة\n` +
        `• \`/profile\` \\- عرض الملف الشخصي\n` +
        `• \`/courses\` \\- قائمة الدروس\n` +
        `• \`/assignments\` \\- قائمة الواجبات\n` +
        `• \`/attendance\` \\- تسجيل الحضور\n` +
        `• \`/reminders\` \\- تبديل التذكيرات\n` +
        `• \`/addreminder\` \\- إضافة تذكير مخصص\n` +
        `• \`/submit\` \\- إرسال إجابة واجب\n` +
        `• \`/feedback\` \\- إرسال تغذية راجعة\n` +
        `• \`/settings\` \\- إعدادات المستخدم\n` +
        `• \`/health\` \\- حالة النظام\n\n` +
        `⚙️ *أوامر المدير:*\n` +
        `• \`/stats\` \\- عرض الإحصائيات\n` +
        `• \`/publish\` \\- نشر إعلان\n` +
        `• \`/export\` \\- تصدير البيانات\n` +
        `• \`/viewfeedback\` \\- عرض التغذية الراجعة\n` +
        `• إدارة الواجبات \\(add/update/delete\\)\n` +
        `• \`/deletecourse\` \\- حذف الكورس\n\n` +
        `💡 استخدم \`/help\` للحصول على دليل مفصل\n\n` +
        `للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }), 'unknown_command'));

  // Register callback query handlers for inline buttons
  console.log('Registering callback query handlers...');
  
  bot.action('profile', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleProfile(ctx);
  }), 'profile'));
  
  bot.action('courses', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleCourses(ctx);
  }), 'courses'));
  
  bot.action('assignments', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleAssignments(ctx);
  }), 'assignments'));
  
  bot.action('reminders', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleReminders(ctx);
  }), 'reminders'));
  
  bot.action('faq', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleFaq(ctx);
  }), 'faq'));
  
  bot.action('help', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await handleHelp(ctx);
  }), 'help'));
  
  bot.action('verify_account', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      escapeMarkdownV2(
        `🔑 *تفعيل الحساب*\n\n` +
        `للحصول على كود التفعيل، تواصل مع: ${config.admin.supportChannel}\n\n` +
        `بعد الحصول على الكود، استخدم:\n` +
        `\`/verify كود_التفعيل\``
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }), 'verify_account'));
  
  bot.action('support', withMonitoring(wrapAsync(async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      escapeMarkdownV2(
        `📞 *الدعم والمساعدة*\n\n` +
        `للحصول على المساعدة، تواصل مع:\n` +
        `${config.admin.supportChannel}\n\n` +
        `أو استخدم:\n` +
        `• \`/feedback\` لإرسال تغذية راجعة\n` +
        `• \`/reportbug\` للإبلاغ عن مشكلة تقنية`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }), 'support'));

  // Settings callback handlers
  bot.action('toggle_reminders', withMonitoring(wrapAsync(handleToggleReminders), 'toggle_reminders'));
  bot.action('change_language', withMonitoring(wrapAsync(handleChangeLanguage), 'change_language'));
  bot.action('change_frequency', withMonitoring(wrapAsync(handleChangeFrequency), 'change_frequency'));
  bot.action('settings_help', withMonitoring(wrapAsync(handleSettingsHelp), 'settings_help'));

  console.log('✅ All bot commands and callbacks registered');
  logActivity('تم تسجيل جميع أوامر البوت والاستدعاءات');
}

// Setup graceful shutdown handlers
function setupShutdownHandlers(bot) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n📴 Received ${signal}, shutting down bot...`);
    
    try {
      console.log('Stopping bot...');
      await bot.stop(signal);
      logActivity(`تم إيقاف البوت بسبب ${signal}`);
      
      console.log('Cleaning up reminders...');
      cleanupReminders();
      
      console.log('Closing database...');
      await closeDatabase();
      
      console.log('✅ Bot shutdown completed');
      logBotShutdown();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during bot shutdown:', {
        message: error.message,
        stack: error.stack,
      });
      logError(error, 'GRACEFUL_SHUTDOWN');
      process.exit(1);
    }
  };
  
  console.log('Setting up process event listeners...');
  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
    });
    logError(error, 'UNCAUGHT_EXCEPTION');
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'Reason:', reason);
    logError(new Error(`Unhandled Rejection: ${reason}`), 'UNHANDLED_REJECTION');
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

// Start the bot
console.log('Starting bot...');
initBot().catch((error) => {
  console.error('❌ Failed to start bot:', {
    message: error.message,
    stack: error.stack,
    response: error.response ? {
      status: error.response.status,
      data: error.response.data,
    } : 'No response data',
  });
  logError(error, 'MAIN');
  process.exit(1);
});