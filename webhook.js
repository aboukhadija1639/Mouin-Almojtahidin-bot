import { Telegraf } from 'telegraf';
import express from 'express';
import ngrok from 'ngrok';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './bot/utils/database.js';
import { initReminders, cleanupReminders } from './bot/utils/reminders.js';
import { loggerMiddleware, logBotStartup, logBotShutdown, logError, logActivity } from './bot/middlewares/logger.js';
import { verifyMiddleware, requireAdmin } from './bot/middlewares/verifyMiddleware.js';
import { rateLimiterMiddleware } from './bot/middlewares/rateLimiter.js';

// Import all command handlers (same as index.js)
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

const PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_PATH = '/webhook';

class WebhookBot {
  constructor() {
    this.bot = null;
    this.app = null;
    this.server = null;
    this.ngrokUrl = null;
  }

  async validateConfig() {
    console.log('🔍 Validating webhook configuration...');
    if (!config.botToken) {
      throw new Error('BOT_TOKEN missing in environment variables');
    }
    console.log('✅ Configuration validated');
  }

  async initializeDatabase() {
    console.log('🗄️ Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized');
  }

  async initializeReminders() {
    console.log('⏰ Initializing reminders...');
    await initReminders();
    console.log('✅ Reminders initialized');
  }

  createBot() {
    console.log('🤖 Creating Telegram bot instance...');
    this.bot = new Telegraf(config.botToken);
    
    // Register middlewares
    this.bot.use(loggerMiddleware());
    this.bot.use(verifyMiddleware());
    this.bot.use(rateLimiterMiddleware());
    
    console.log('✅ Bot instance created with middlewares');
  }

  registerCommands() {
    console.log('📝 Registering commands...');
    
    // Text command handlers
    this.bot.command('start', handleStart);
    this.bot.command('verify', handleVerify);
    this.bot.command('profile', handleProfile);
    this.bot.command('attendance', handleAttendance);
    this.bot.command('courses', handleCourses);
    this.bot.command('assignments', handleAssignments);
    this.bot.command('reminders', handleReminders);
    this.bot.command('faq', handleFaq);
    this.bot.command('help', handleHelp);
    this.bot.command('stats', requireAdmin(handleStats));
    this.bot.command('publish', requireAdmin(handlePublish));
    this.bot.command('addassignment', requireAdmin(handleAddAssignment));
    this.bot.command('updateassignment', requireAdmin(handleUpdateAssignment));
    this.bot.command('deleteassignment', requireAdmin(handleDeleteAssignment));
    this.bot.command('submit', handleSubmit);
    this.bot.command('deletecourse', requireAdmin(handleDeleteCourse));
    this.bot.command('addcourse', requireAdmin(handleAddCourse));
    this.bot.command('updatecourse', requireAdmin(handleUpdateCourse));
    this.bot.command('addreminder', requireAdmin(handleAddReminder));
    this.bot.command('export', requireAdmin(handleExport));
    this.bot.command('feedback', handleFeedback);
    this.bot.command('viewfeedback', requireAdmin(handleViewFeedback));
    this.bot.command('settings', handleSettings);
    this.bot.command('health', handleHealth);
    this.bot.command('listreminders', handleListreminders);
    this.bot.command('deletereminder', requireAdmin(handleDeleteReminder));
    this.bot.command('upcominglessons', handleUpcominglessons);
    this.bot.command('broadcast', requireAdmin(handleBroadcast));
    this.bot.command('reportbug', handleReportbug);

    // Callback query handlers
    this.bot.action('courses', async (ctx) => {
      await ctx.answerCbQuery();
      await handleCourses(ctx);
    });
    
    this.bot.action('assignments', async (ctx) => {
      await ctx.answerCbQuery();
      await handleAssignments(ctx);
    });
    
    this.bot.action('reminders', async (ctx) => {
      await ctx.answerCbQuery();
      await handleReminders(ctx);
    });
    
    this.bot.action('faq', async (ctx) => {
      await ctx.answerCbQuery();
      await handleFaq(ctx);
    });
    
    this.bot.action('help', async (ctx) => {
      await ctx.answerCbQuery();
      await handleHelp(ctx);
    });
    
    this.bot.action('verify_account', async (ctx) => {
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
    
    this.bot.action('support', async (ctx) => {
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

    // Settings callback handlers
    this.bot.action('toggle_reminders', handleToggleReminders);
    this.bot.action('change_language', handleChangeLanguage);
    this.bot.action('change_frequency', handleChangeFrequency);
    this.bot.action('settings_help', handleSettingsHelp);

    console.log('✅ All commands registered');
  }

  async setupExpress() {
    console.log('🌐 Setting up Express server...');
    this.app = express();
    
    // Middleware for JSON parsing
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mode: 'webhook'
      });
    });
    
    // Webhook endpoint
    this.app.post(WEBHOOK_PATH, (req, res) => {
      try {
        this.bot.handleUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error('❌ Webhook error:', error);
        logError(error, 'WEBHOOK_HANDLER');
        res.sendStatus(500);
      }
    });
    
    console.log('✅ Express server configured');
  }

  async startNgrok() {
    console.log('🌐 Starting ngrok tunnel...');
    try {
      this.ngrokUrl = await ngrok.connect({
        port: PORT,
        subdomain: process.env.NGROK_SUBDOMAIN || undefined,
        authtoken: process.env.NGROK_AUTH_TOKEN || undefined
      });
      console.log(`✅ Ngrok tunnel established: ${this.ngrokUrl}`);
      return this.ngrokUrl;
    } catch (error) {
      console.error('❌ Failed to start ngrok:', error);
      throw error;
    }
  }

  async setWebhook(url) {
    console.log(`🔗 Setting webhook to: ${url}${WEBHOOK_PATH}`);
    try {
      await this.bot.telegram.setWebhook(`${url}${WEBHOOK_PATH}`);
      console.log('✅ Webhook set successfully');
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
      throw error;
    }
  }

  async startServer() {
    console.log(`🚀 Starting Express server on port ${PORT}...`);
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(PORT, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`✅ Express server running on port ${PORT}`);
          resolve();
        }
      });
    });
  }

  setupShutdownHandlers() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}, shutting down webhook bot...`);
      
      try {
        console.log('🔄 Removing webhook...');
        await this.bot.telegram.deleteWebhook();
        
        console.log('🌐 Stopping ngrok...');
        await ngrok.disconnect();
        await ngrok.kill();
        
        console.log('🛑 Stopping Express server...');
        if (this.server) {
          this.server.close();
        }
        
        console.log('⏰ Cleaning up reminders...');
        cleanupReminders();
        
        console.log('🗄️ Closing database...');
        await closeDatabase();
        
        console.log('✅ Webhook bot shutdown completed');
        logBotShutdown();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        logError(error, 'GRACEFUL_SHUTDOWN');
        process.exit(1);
      }
    };

    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      logError(error, 'UNCAUGHT_EXCEPTION');
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'Reason:', reason);
      logError(new Error(`Unhandled Rejection: ${reason}`), 'UNHANDLED_REJECTION');
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  async start() {
    try {
      console.log('🚀 Starting Telegram Bot with Webhooks (Local Development)');
      console.log('=' .repeat(60));
      
      await this.validateConfig();
      await this.initializeDatabase();
      await this.initializeReminders();
      
      this.createBot();
      this.registerCommands();
      await this.setupExpress();
      
      await this.startServer();
      const ngrokUrl = await this.startNgrok();
      await this.setWebhook(ngrokUrl);
      
      this.setupShutdownHandlers();
      
      console.log('🎉 Webhook bot started successfully!');
      console.log(`📍 Public URL: ${ngrokUrl}`);
      console.log(`🔗 Webhook URL: ${ngrokUrl}${WEBHOOK_PATH}`);
      console.log(`💚 Health check: ${ngrokUrl}/health`);
      console.log('=' .repeat(60));
      
      logBotStartup();
      logActivity('Bot started successfully with webhooks');
      
    } catch (error) {
      console.error('❌ Failed to start webhook bot:', error);
      logError(error, 'WEBHOOK_STARTUP');
      process.exit(1);
    }
  }
}

// Create and start the webhook bot
const webhookBot = new WebhookBot();
webhookBot.start().catch(console.error);