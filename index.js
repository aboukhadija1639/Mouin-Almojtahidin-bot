import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './bot/utils/database.js';
import { initReminders, cleanupReminders } from './bot/utils/reminders.js';
import { loggerMiddleware, logBotStartup, logBotShutdown, logError, logActivity } from './bot/middlewares/logger.js';
import { verifyMiddleware, requireAdmin } from './bot/middlewares/verifyMiddleware.js';
import { rateLimiterMiddleware } from './bot/middlewares/rateLimiter.js';

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
import { handleAddReminder } from './bot/commands/addreminder.js';
import { handleExport } from './bot/commands/export.js';
import { handleFeedback, handleViewFeedback } from './bot/commands/feedback.js';
import { handleSettings } from './bot/commands/settings.js';
import { handleListReminders } from './bot/commands/listreminders.js';
import { handleDeleteReminder } from './bot/commands/deletereminder.js';
import { handleUpcomingLessons } from './bot/commands/upcominglessons.js';
import { handleBroadcast } from './bot/commands/broadcast.js';
import { handleReportBug } from './bot/commands/reportbug.js';
import { escapeMarkdownV2 } from './bot/utils/escapeMarkdownV2.js';

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
  
  console.log('✅ Configuration validated successfully');
  logActivity('تم التحقق من متغيرات البيئة بنجاح');
}

// Clear webhook and updates with retry logic
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
        return false;
      }
    }
  }
}

// Manual polling fallback
async function manualPolling(bot, timeout = 10000) {
  try {
    console.log('Attempting manual polling...');
    const updates = await bot.telegram.getUpdates({ timeout: Math.floor(timeout / 1000) });
    console.log(`Manual polling retrieved ${updates.length} updates`);
    if (updates.length > 0) {
      logActivity(`Manual polling found ${updates.length} updates`);
      await bot.handleUpdate(updates[updates.length - 1]);
      console.log('Processed latest update');
    }
    return true;
  } catch (error) {
    console.error('❌ Manual polling failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response data',
    });
    logError(error, 'MANUAL_POLLING');
    return false;
  }
}

// Webhook server setup as fallback
async function setupWebhookServer(bot, port = 3000) {
  try {
    const express = await import('express');
    const app = express.default();
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Webhook endpoint
    app.post('/bot', (req, res) => {
      try {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error('Webhook error:', error);
        logError(error, 'WEBHOOK_HANDLER');
        res.sendStatus(500);
      }
    });
    
    const server = app.listen(port, () => {
      console.log(`✅ Webhook server running on port ${port}`);
      logActivity(`Webhook server started on port ${port}`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to setup webhook server:', error);
    logError(error, 'WEBHOOK_SETUP');
    return null;
  }
}

// Launch bot with retry logic and webhook fallback
async function launchBotWithRetry(bot, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to launch bot with polling (Attempt ${attempt}/${maxRetries})`);
      await Promise.race([
        bot.launch({ dropPendingUpdates: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Bot launch timed out after 60 seconds')), 60000))
      ]);
      console.log('✅ Bot launched successfully with polling');
      logActivity('Bot launched successfully with polling');
      return { success: true, mode: 'polling' };
    } catch (error) {
      console.error(`❌ Failed to launch bot with polling (Attempt ${attempt}):`, {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response data',
      });
      logError(error, `BOT_LAUNCH_ATTEMPT_${attempt}`);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        const delay = Math.pow(2, attempt) * 5000;
        console.log(`Retrying launch in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.log('❌ Max polling retries reached, attempting webhook fallback...');
        logActivity('Polling failed, attempting webhook fallback');
        
        // Try webhook mode as fallback
        try {
          const webhookServer = await setupWebhookServer(bot);
          if (webhookServer) {
            // For local development, you might want to use ngrok or similar
            // For production, use your actual domain
            const webhookUrl = process.env.WEBHOOK_URL || `http://localhost:3000/bot`;
            
            if (process.env.WEBHOOK_URL) {
              await bot.telegram.setWebhook(webhookUrl);
              console.log('✅ Bot launched successfully with webhook mode');
              logActivity(`Bot launched with webhook: ${webhookUrl}`);
              return { success: true, mode: 'webhook', server: webhookServer };
            } else {
              console.warn('⚠️ WEBHOOK_URL not set, webhook server running locally only');
              logActivity('Webhook server running locally, WEBHOOK_URL not configured');
              return { success: true, mode: 'webhook-local', server: webhookServer };
            }
          }
        } catch (webhookError) {
          console.error('❌ Webhook fallback failed:', webhookError);
          logError(webhookError, 'WEBHOOK_FALLBACK');
        }
        
        // Final fallback to manual polling
        console.log('Attempting manual polling as last resort...');
        const manualSuccess = await manualPolling(bot);
        return { 
          success: manualSuccess, 
          mode: manualSuccess ? 'manual-polling' : 'failed' 
        };
      }
    }
  }
}

// Initialize bot
async function initBot() {
  try {
    console.log('Starting bot initialization...');
    validateConfig();
    
    console.log('Creating Telegraf bot instance...');
    const bot = new Telegraf(config.botToken);
    
    console.log('Fetching bot info...');
    const botInfo = await bot.telegram.getMe();
    console.log('Bot info:', botInfo);
    
    console.log('Clearing webhooks and updates...');
    const updatesCleared = await clearUpdatesWithRetry(bot);
    if (!updatesCleared) {
      console.warn('⚠️ Failed to clear updates, proceeding in polling mode');
      logActivity('Failed to clear updates, proceeding in polling mode');
    }
    
    console.log('Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');
    
    console.log('Applying middlewares...');
    bot.use(loggerMiddleware());
    bot.use(rateLimiterMiddleware());
    bot.use(verifyMiddleware());
    console.log('✅ Middlewares applied');
    
    console.log('Registering commands...');
    registerCommands(bot);
    console.log('✅ Commands registered');
    
    console.log('Initializing reminders...');
    initReminders(bot);
    console.log('✅ Reminders initialized');
    
    console.log('Setting up shutdown handlers...');
    setupShutdownHandlers(bot);
    console.log('✅ Shutdown handlers set');
    
    console.log('Launching bot...');
    const launchResult = await launchBotWithRetry(bot);
    if (!launchResult.success) {
      console.warn('⚠️ Bot failed to launch, but initialization completed. Test commands manually.');
      logActivity('Bot failed to launch, initialization completed');
    } else {
      console.log('🚀 بوت معين المجتهدين يعمل بنجاح!');
      console.log(`📊 معرف البوت: @${botInfo.username}`);
      console.log(`👥 عدد المدراء: ${config.admin.userIds.length}`);
      console.log(`🔧 وضع التشغيل: ${launchResult.mode}`);
      logBotStartup();
      logActivity(`Bot launched in ${launchResult.mode} mode`);
    }
    
    return bot;
  } catch (error) {
    console.error('❌ فشل في تشغيل البوت:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response data',
    });
    logError(error, 'BOT_INIT');
    process.exit(1);
  }
}

// Register all bot commands
function registerCommands(bot) {
  console.log('Registering public commands...');
  bot.command('start', handleStart);
  bot.command('verify', handleVerify);
  bot.command('help', handleHelp);
  
  console.log('Registering user commands...');
  bot.command('faq', handleFaq);
  bot.command('profile', handleProfile);
  bot.command('courses', handleCourses);
  bot.command('assignments', handleAssignments);
  bot.command('attendance', handleAttendance);
  bot.command('reminders', handleReminders);
  bot.command('submit', handleSubmit);
  bot.command('addreminder', handleAddReminder);
  bot.command('listreminders', handleListReminders);
  bot.command('deletereminder', handleDeleteReminder);
  bot.command('upcominglessons', handleUpcomingLessons);
  bot.command('feedback', handleFeedback);
  bot.command('reportbug', handleReportBug);
  bot.command('settings', handleSettings);
  
  console.log('Registering admin commands...');
  bot.command('stats', requireAdmin, handleStats);
  bot.command('publish', requireAdmin, handlePublish);
  bot.command('addassignment', requireAdmin, handleAddAssignment);
  bot.command('updateassignment', requireAdmin, handleUpdateAssignment);
  bot.command('deleteassignment', requireAdmin, handleDeleteAssignment);
  bot.command('deletecourse', requireAdmin, handleDeleteCourse);
  bot.command('export', requireAdmin, handleExport);
  bot.command('viewfeedback', requireAdmin, handleViewFeedback);
  bot.command('broadcast', requireAdmin, handleBroadcast);
  
  console.log('Registering unknown command handler...');
  bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    
    if (!messageText.startsWith('/')) {
      return;
    }
    
    const command = messageText.split(' ')[0].toLowerCase();
    console.log(`Received command: ${command}`);
    const knownCommands = [
      '/start', '/verify', '/help', '/faq', '/profile', '/courses', 
      '/assignments', '/attendance', '/reminders', '/submit', '/addreminder',
      '/listreminders', '/deletereminder', '/upcominglessons', '/feedback', 
      '/reportbug', '/settings', '/stats', '/publish', '/addassignment', 
      '/updateassignment', '/deleteassignment', '/deletecourse', '/export', 
      '/viewfeedback', '/broadcast'
    ];
    
    if (!knownCommands.includes(command)) {
      console.log(`Unknown command received: ${command}`);
      await ctx.reply(
        `❓ *أمر غير معروف*\\n\\n` +
        `الأوامر المتاحة:\\n\\n` +
        `🌐 *الأوامر العامة:*\\n` +
        `• \`/start\` \\- بدء استخدام البوت\\n` +
        `• \`/verify\` \\- تفعيل الحساب\\n` +
        `• \`/help\` \\- دليل المساعدة الشامل\\n` +
        `• \`/faq\` \\- الأسئلة الشائعة\\n\\n` +
        `👤 *أوامر المستخدم:*\\n` +
        `• \`/profile\` \\- عرض الملف الشخصي\\n` +
        `• \`/courses\` \\- قائمة الدروس\\n` +
        `• \`/assignments\` \\- قائمة الواجبات\\n` +
        `• \`/attendance\` \\- تسجيل الحضور\\n` +
        `• \`/reminders\` \\- تبديل التذكيرات\\n` +
        `• \`/addreminder\` \\- إضافة تذكير مخصص\\n` +
        `• \`/submit\` \\- إرسال إجابة واجب\\n` +
        `• \`/feedback\` \\- إرسال تغذية راجعة\\n` +
        `• \`/settings\` \\- إعدادات المستخدم\\n\\n` +
        `⚙️ *أوامر المدير:*\\n` +
        `• \`/stats\` \\- عرض الإحصائيات\\n` +
        `• \`/publish\` \\- نشر إعلان\\n` +
        `• \`/export\` \\- تصدير البيانات\\n` +
        `• \`/viewfeedback\` \\- عرض التغذية الراجعة\\n` +
        `• إدارة الواجبات \\(add/update/delete\\)\\n` +
        `• \`/deletecourse\` \\- حذف الكورس\\n\\n` +
        `💡 استخدم \`/help\` للحصول على دليل مفصل\\n\\n` +
        `للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  });
  
  // Register callback query handlers for inline buttons
  console.log('Registering callback query handlers...');
  
  bot.action('profile', async (ctx) => {
    await ctx.answerCbQuery();
    await handleProfile(ctx);
  });
  
  bot.action('courses', async (ctx) => {
    await ctx.answerCbQuery();
    await handleCourses(ctx);
  });
  
  bot.action('assignments', async (ctx) => {
    await ctx.answerCbQuery();
    await handleAssignments(ctx);
  });
  
  bot.action('reminders', async (ctx) => {
    await ctx.answerCbQuery();
    await handleReminders(ctx);
  });
  
  bot.action('faq', async (ctx) => {
    await ctx.answerCbQuery();
    await handleFaq(ctx);
  });
  
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await handleHelp(ctx);
  });
  
  bot.action('verify_account', async (ctx) => {
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
  });
  
  bot.action('support', async (ctx) => {
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
  });

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