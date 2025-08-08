import * as fs from 'fs';
import { config } from '../../config.js';

// Ensure log files exist
function ensureLogFiles() {
  const logDir = './data';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const combinedLogFile = './data/combined.log';
  const errorLogFile = './data/error.log';
  
  if (!fs.existsSync(combinedLogFile)) {
    fs.writeFileSync(combinedLogFile, '');
  }
  
  if (!fs.existsSync(errorLogFile)) {
    fs.writeFileSync(errorLogFile, '');
  }
}

// Format timestamp for logs
function getTimestamp() {
  return new Date().toISOString();
}

// Log to file
function logToFile(filename, message) {
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(filename, logEntry);
  } catch (error) {
    console.error('خطأ في كتابة السجل:', error);
  }
}

// Log activity
export function logActivity(message) {
  logToFile('./data/combined.log', message);
  console.log(`📝 ${message}`);
}

// Log error
export function logError(error, context = '') {
  const errorMessage = `ERROR ${context}: ${error.message || error}`;
  logToFile('./data/error.log', errorMessage);
  logToFile('./data/combined.log', errorMessage);
  console.error(`❌ ${errorMessage}`);
}

// Middleware for logging bot activities
export function loggerMiddleware() {
  ensureLogFiles();
  
  return async (ctx, next) => {
    try {
      const user = ctx.from;
      const message = ctx.message;
      const callbackQuery = ctx.callbackQuery;
      
      let logMessage = '';
      
      if (message) {
        const userId = user.id;
        const username = user.username || 'No username';
        const firstName = user.first_name || 'No name';
        const messageText = message.text || 'Non-text message';
        
        logMessage = `USER: ${userId} (@${username} - ${firstName}) MESSAGE: ${messageText}`;
      } else if (callbackQuery) {
        const userId = user.id;
        const username = user.username || 'No username';
        const data = callbackQuery.data;
        
        logMessage = `USER: ${userId} (@${username}) CALLBACK: ${data}`;
      }
      
      if (logMessage) {
        logActivity(logMessage);
      }
      
      await next();
    } catch (error) {
      logError(error, 'MIDDLEWARE');
      
      // Send error message to user
      try {
        await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
          { parse_mode: 'MarkdownV2' });
      } catch (replyError) {
        logError(replyError, 'ERROR_REPLY');
      }
      
      // Notify admin if possible
      try {
        if (config.admin.chatId && ctx.telegram) {
          const errorDetails = `❌ خطأ في البوت:\n\nالمستخدم: ${ctx.from?.id} (@${ctx.from?.username})\nالخطأ: ${error.message || error}\nالوقت: ${getTimestamp()}`;
          await ctx.telegram.sendMessage(config.admin.chatId, errorDetails);
        }
      } catch (notifyError) {
        logError(notifyError, 'ADMIN_NOTIFICATION');
      }
    }
  };
}

// Log bot startup
export function logBotStartup() {
  logActivity('🚀 BOT STARTED');
}

// Log bot shutdown
export function logBotShutdown() {
  logActivity('🛑 BOT SHUTDOWN');
}

// Export individual logging functions
export { ensureLogFiles, getTimestamp, logToFile };