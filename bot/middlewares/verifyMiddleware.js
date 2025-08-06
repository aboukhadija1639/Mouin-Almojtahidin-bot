import { isUserVerified, getUserLanguage } from '../utils/database.js';
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
      
      // Get user language
      const userLanguage = await getUserLanguage(userId) || 'ar';
      
      // Define messages based on language
      const messages = {
        ar: {
          activationRequired: '🔒 *مطلوب التفعيل*\n\nعذراً، يجب تفعيل حسابك أولاً لاستخدام هذه الميزة.\n\nاستخدم الأمر: `/verify كود_التفعيل`\n\nللحصول على كود التفعيل، تواصل مع',
          error: '❌ حدث خطأ، حاول مرة أخرى أو تواصل مع'
        },
        en: {
          activationRequired: '🔒 *Activation Required*\n\nSorry, you need to activate your account first to use this feature.\n\nUse the command: `/verify activation_code`\n\nTo get an activation code, contact',
          error: '❌ An error occurred, try again or contact'
        }
      };
      
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
        const currentMessages = messages[userLanguage] || messages.ar;
        await ctx.reply(
          `${currentMessages.activationRequired} ${config.admin.supportChannel}`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      // User is verified, proceed to next middleware/handler
      await next();
    } catch (error) {
      console.error('ERROR VERIFY_MIDDLEWARE:', error);
      const userLanguage = await getUserLanguage(ctx.from?.id) || 'ar';
      const messages = {
        ar: { error: '❌ حدث خطأ، حاول مرة أخرى أو تواصل مع' },
        en: { error: '❌ An error occurred, try again or contact' }
      };
      const currentMessages = messages[userLanguage] || messages.ar;
      await ctx.reply(`${currentMessages.error} ${config.admin.supportChannel}`);
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
    console.error('ERROR ADMIN_CHECK:', error);
    const messages = {
      ar: { error: '❌ حدث خطأ، حاول مرة أخرى أو تواصل مع' },
      en: { error: '❌ An error occurred, try again or contact' }
    };
    const userLanguage = await getUserLanguage(ctx.from?.id) || 'ar';
    const currentMessages = messages[userLanguage] || messages.ar;
    await ctx.reply(`${currentMessages.error} ${config.admin.supportChannel}`);
  }
}