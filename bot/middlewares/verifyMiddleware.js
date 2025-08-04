import { isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';

// List of commands that don't require verification
const publicCommands = ['/start', '/verify'];

// Middleware to check user verification
export function verifyMiddleware() {
  return async (ctx, next) => {
    try {
      const userId = ctx.from?.id;
      const messageText = ctx.message?.text;
      
      if (!userId) {
        return;
      }
      
      // Check if command requires verification
      if (messageText) {
        const command = messageText.split(' ')[0].toLowerCase();
        
        // Allow public commands without verification
        if (publicCommands.includes(command)) {
          return await next();
        }
      }
      
      // Check if user is verified
      const verified = await isUserVerified(userId);
      
      if (!verified) {
        await ctx.reply(
          `🔒 *مطلوب التفعيل*\n\n` +
          `عذراً، يجب تفعيل حسابك أولاً لاستخدام هذه الميزة.\n\n` +
          `استخدم الأمر: \`/verify كود_التفعيل\`\n\n` +
          `للحصول على كود التفعيل، تواصل مع ${config.admin.supportChannel}`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // User is verified, proceed to next middleware/handler
      await next();
    } catch (error) {
      console.error('خطأ في middleware التحقق:', error);
      await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
    }
  };
}

// Check if user is admin (for admin-only commands)
export async function requireAdmin(ctx, next) {
  try {
    const userId = ctx.from?.id;
    
    if (!userId || !config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\n\n` +
        `هذا الأمر مخصص للمدراء فقط.\n\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    await next();
  } catch (error) {
    console.error('خطأ في التحقق من صلاحيات المدير:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}