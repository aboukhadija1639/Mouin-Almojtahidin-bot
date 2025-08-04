import { config } from '../../config.js';
import { logActivity, logError } from './logger.js';

// Store user request counts
const userRequests = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  for (const [userId, userData] of userRequests.entries()) {
    // Remove requests older than 1 hour
    userData.requests = userData.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Remove user if no recent requests
    if (userData.requests.length === 0) {
      userRequests.delete(userId);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiterMiddleware() {
  if (!config.rateLimiting.enabled) {
    return async (ctx, next) => await next();
  }

  return async (ctx, next) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) {
        return await next();
      }

      // Skip rate limiting for admins
      if (config.admin.userIds.includes(userId)) {
        return await next();
      }

      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;

      // Get or create user data
      if (!userRequests.has(userId)) {
        userRequests.set(userId, { requests: [] });
      }

      const userData = userRequests.get(userId);
      
      // Clean old requests
      userData.requests = userData.requests.filter(timestamp => timestamp > oneHourAgo);

      // Count recent requests
      const requestsLastMinute = userData.requests.filter(timestamp => timestamp > oneMinuteAgo).length;
      const requestsLastHour = userData.requests.length;

      // Check rate limits
      if (requestsLastMinute >= config.rateLimiting.maxRequestsPerMinute) {
        logActivity(`معدل الطلبات مرتفع للمستخدم ${userId}: ${requestsLastMinute} طلب في الدقيقة الأخيرة`);
        
        await ctx.reply(
          `⏳ *تم تجاوز الحد المسموح*\\n\\n` +
          `يرجى الانتظار قليلاً قبل إرسال طلب آخر\\.\\n` +
          `الحد الأقصى: ${config.rateLimiting.maxRequestsPerMinute} طلب في الدقيقة\\.\\n\\n` +
          `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      if (requestsLastHour >= config.rateLimiting.maxRequestsPerHour) {
        logActivity(`معدل الطلبات مرتفع للمستخدم ${userId}: ${requestsLastHour} طلب في الساعة الأخيرة`);
        
        await ctx.reply(
          `⏳ *تم تجاوز الحد المسموح*\\n\\n` +
          `لقد تجاوزت الحد الأقصى للطلبات في الساعة\\.\\n` +
          `الحد الأقصى: ${config.rateLimiting.maxRequestsPerHour} طلب في الساعة\\.\\n\\n` +
          `يرجى المحاولة مرة أخرى بعد ساعة\\.\\n\\n` +
          `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      // Record this request
      userData.requests.push(now);

      // Continue to next middleware
      await next();

    } catch (error) {
      logError(error, 'RATE_LIMITER');
      // Don't block on rate limiter errors
      await next();
    }
  };
}

// Get rate limit info for a user (for debugging)
export function getUserRateInfo(userId) {
  const userData = userRequests.get(userId);
  if (!userData) {
    return { requestsLastMinute: 0, requestsLastHour: 0 };
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  const requestsLastMinute = userData.requests.filter(timestamp => timestamp > oneMinuteAgo).length;
  const requestsLastHour = userData.requests.length;

  return { requestsLastMinute, requestsLastHour };
}

// Clear rate limit data for a user (admin function)
export function clearUserRateLimit(userId) {
  userRequests.delete(userId);
  logActivity(`تم مسح حدود المعدل للمستخدم ${userId}`);
}