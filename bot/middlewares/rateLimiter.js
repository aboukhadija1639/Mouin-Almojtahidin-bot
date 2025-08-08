import { Composer } from 'telegraf';
import rateLimit from 'telegraf-ratelimit';
import { config } from '../../config.js';
import { logActivity, logError } from './logger.js';

// Enhanced rate limiting with telegraf-ratelimit
const rateLimitConfig = {
  // Default window duration in milliseconds
  window: 60000, // 1 minute
  // Maximum number of requests per window
  limit: config.rateLimiting?.maxRequestsPerMinute || 10,
  // Skip successful requests when false, skip all requests when true
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: true,
  // Function to generate a unique key for each user
  keyGenerator: (ctx) => {
    return ctx.from?.id?.toString() || 'anonymous';
  },
  // Function to handle rate limit exceeded
  onLimitReached: async (ctx) => {
    const userId = ctx.from?.id;
    const username = ctx.from?.username || 'مجهول';
    
    logActivity(`تم تجاوز حد المعدل - المستخدم: ${userId} (${username})`);
    
    const message = `⏳ **تم تجاوز الحد المسموح**\n\n` +
      `عذراً ${ctx.from?.first_name || 'عزيزي المستخدم'}، لقد تجاوزت الحد المسموح من الطلبات\\.\n\n` +
      `📊 **الحدود الحالية:**\n` +
      `• الحد الأقصى: ${config.rateLimiting?.maxRequestsPerMinute || 10} طلب في الدقيقة\n` +
      `• يرجى الانتظار قليلاً قبل المحاولة مرة أخرى\n\n` +
      `💡 **للمساعدة:** ${config.admin?.supportChannel?.replace(/@/g, '\\@') || '@support'}\n\n` +
      `🔄 **نصائح للاستخدام الأمثل:**\n` +
      `• استخدم القوائم بدلاً من كتابة الأوامر المتكررة\n` +
      `• انتظر انتهاء العملية السابقة قبل بدء جديدة\n` +
      `• استخدم /help لمعرفة الأوامر المتاحة`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      reply_to_message_id: ctx.message?.message_id 
    });
  },
  // Message to send when rate limit is exceeded (optional, overridden by onLimitReached)
  message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة مرة أخرى بعد قليل.'
};

// Advanced rate limiting with different limits for different command types
const createAdvancedRateLimit = () => {
  const composer = new Composer();
  
  // General commands (most restrictive)
  const generalLimit = rateLimit({
    ...rateLimitConfig,
    window: 60000, // 1 minute
    limit: config.rateLimiting?.maxRequestsPerMinute || 8,
  });
  
  // Admin commands (less restrictive for admins)
  const adminLimit = rateLimit({
    ...rateLimitConfig,
    window: 60000,
    limit: config.rateLimiting?.adminMaxRequestsPerMinute || 20,
    keyGenerator: (ctx) => {
      const userId = ctx.from?.id;
      // Only apply to non-admin users
      if (config.admin?.userIds?.includes(userId)) {
        return null; // Skip rate limiting for admins
      }
      return userId?.toString() || 'anonymous';
    }
  });
  
  // Query/read-only commands (more permissive)
  const queryLimit = rateLimit({
    ...rateLimitConfig,
    window: 60000,
    limit: config.rateLimiting?.queryMaxRequestsPerMinute || 15,
  });
  
  // Heavy operations (most restrictive)
  const heavyLimit = rateLimit({
    ...rateLimitConfig,
    window: 300000, // 5 minutes
    limit: config.rateLimiting?.heavyMaxRequestsPer5Min || 3,
    onLimitReached: async (ctx) => {
      await ctx.reply(
        `⚠️ **عملية مكثفة - تم تجاوز الحد**\n\n` +
        `هذه العملية تتطلب موارد أكثر\\. الحد الأقصى: ${config.rateLimiting?.heavyMaxRequestsPer5Min || 3} عمليات كل 5 دقائق\n\n` +
        `يرجى الانتظار قبل المحاولة مرة أخرى\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  });
  
  return { generalLimit, adminLimit, queryLimit, heavyLimit };
};

// Create rate limit middleware instances
const { generalLimit, adminLimit, queryLimit, heavyLimit } = createAdvancedRateLimit();

// Enhanced rate limiter middleware with command-specific limits
export function rateLimiterMiddleware() {
  if (!config.rateLimiting?.enabled) {
    return async (ctx, next) => await next();
  }

  return async (ctx, next) => {
    try {
      const userId = ctx.from?.id;
      
      // Skip rate limiting for admins in general
      if (config.admin?.userIds?.includes(userId)) {
        return await next();
      }
      
      // Determine which rate limit to apply based on command type
      const message = ctx.message?.text || ctx.callbackQuery?.data || '';
      const command = message.toLowerCase().split(' ')[0].replace('/', '');
      
      // Define command categories
      const heavyCommands = ['export', 'stats', 'broadcast', 'addcourse', 'deletecourse'];
      const queryCommands = ['courses', 'assignments', 'help', 'faq', 'profile', 'health'];
      const adminCommands = ['addassignment', 'deleteassignment', 'updateassignment', 'publish', 'viewfeedback'];
      
      let selectedLimit;
      if (heavyCommands.includes(command)) {
        selectedLimit = heavyLimit;
      } else if (queryCommands.includes(command)) {
        selectedLimit = queryLimit;
      } else if (adminCommands.includes(command)) {
        selectedLimit = adminLimit;
      } else {
        selectedLimit = generalLimit;
      }
      
      // Apply the selected rate limit
      return await selectedLimit(ctx, next);
      
    } catch (error) {
      logError(error, 'ENHANCED_RATE_LIMITER');
      // Don't block on rate limiter errors
      await next();
    }
  };
}

// Legacy compatibility export
export const rateLimiter = rateLimiterMiddleware;

// Store for tracking user activity patterns
const userActivityTracker = new Map();

// Activity pattern analysis middleware
export function activityTrackerMiddleware() {
  return async (ctx, next) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return await next();
      
      const now = Date.now();
      const command = ctx.message?.text?.split(' ')[0]?.replace('/', '') || 'callback';
      
      // Get or create user activity data
      if (!userActivityTracker.has(userId)) {
        userActivityTracker.set(userId, {
          commands: new Map(),
          lastActivity: now,
          sessionStart: now,
          totalCommands: 0
        });
      }
      
      const userActivity = userActivityTracker.get(userId);
      
      // Update activity
      userActivity.lastActivity = now;
      userActivity.totalCommands++;
      
      // Track command frequency
      const commandCount = userActivity.commands.get(command) || 0;
      userActivity.commands.set(command, commandCount + 1);
      
      // Detect suspicious activity patterns
      const timeSinceSession = now - userActivity.sessionStart;
      const commandsPerMinute = (userActivity.totalCommands / timeSinceSession) * 60000;
      
      if (commandsPerMinute > 30) { // More than 30 commands per minute
        logActivity(`نشاط مشبوه مكتشف - المستخدم ${userId}: ${commandsPerMinute.toFixed(1)} أمر/دقيقة`);
      }
      
      await next();
      
    } catch (error) {
      logError(error, 'ACTIVITY_TRACKER');
      await next();
    }
  };
}

// Get user activity info (for debugging/monitoring)
export function getUserActivityInfo(userId) {
  const activity = userActivityTracker.get(userId);
  if (!activity) {
    return { found: false };
  }
  
  const now = Date.now();
  const sessionDuration = now - activity.sessionStart;
  const timeSinceLastActivity = now - activity.lastActivity;
  
  return {
    found: true,
    totalCommands: activity.totalCommands,
    sessionDurationMinutes: Math.round(sessionDuration / 60000),
    minutesSinceLastActivity: Math.round(timeSinceLastActivity / 60000),
    commandFrequency: Object.fromEntries(activity.commands),
    avgCommandsPerMinute: sessionDuration > 0 ? (activity.totalCommands / sessionDuration) * 60000 : 0
  };
}

// Cleanup old activity data (call periodically)
export function cleanupActivityTracker() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  for (const [userId, activity] of userActivityTracker.entries()) {
    if (activity.lastActivity < oneHourAgo) {
      userActivityTracker.delete(userId);
    }
  }
  
  logActivity(`تم تنظيف بيانات النشاط - المستخدمين النشطين: ${userActivityTracker.size}`);
}

// Start cleanup interval
setInterval(cleanupActivityTracker, 10 * 60 * 1000); // Every 10 minutes

// Export for monitoring
export { userActivityTracker };