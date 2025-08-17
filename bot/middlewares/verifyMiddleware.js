import { isUserVerified, getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, code } from '../utils/escapeMarkdownV2.js';

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
          activationRequired: `${escapeMarkdownV2('🔒 *مطلوب التفعيل*')}\n\n${escapeMarkdownV2('عذراً، يجب تفعيل حسابك أولاً لاستخدام هذه الميزة.')}\n\n${escapeMarkdownV2('استخدم الأمر:')} ${code('/verify كود_التفعيل')}\n\n${escapeMarkdownV2('للحصول على كود التفعيل، تواصل مع')}`,
          error: `${escapeMarkdownV2('❌ حدث خطأ، حاول مرة أخرى أو تواصل مع')}`
        },
        en: {
          activationRequired: `${escapeMarkdownV2('🔒 *Activation Required*')}\n\n${escapeMarkdownV2('Sorry, you need to activate your account first to use this feature.')}\n\n${escapeMarkdownV2('Use the command:')} ${code('/verify activation_code')}\n\n${escapeMarkdownV2('To get an activation code, contact')}`,
          error: `${escapeMarkdownV2('❌ An error occurred, try again or contact')}`
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
          `${currentMessages.activationRequired} ${escapeMarkdownV2(config.admin.supportChannel)}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }
      
      // User is verified, proceed to next middleware/handler
      await next();
    } catch (error) {
      console.error('ERROR VERIFY_MIDDLEWARE:', error);
      const userLanguage = await getUserLanguage(ctx.from?.id) || 'ar';
      const currentMessages = messages[userLanguage] || messages.ar;
      await ctx.reply(
        `${currentMessages.error} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  };
}

// Check if user is admin (for admin-only commands)
export async function requireAdmin(ctx, next) {
  try {
    const userId = ctx.from?.id;
    
    if (!userId || !config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *${escapeMarkdownV2('غير مسموح')}*\n\n` +
        `${escapeMarkdownV2('هذا الأمر مخصص للمدراء فقط.')}\n\n` +
        `${escapeMarkdownV2('للمساعدة، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    
    await next();
  } catch (error) {
    console.error('ERROR ADMIN_CHECK:', error);
    const userLanguage = await getUserLanguage(ctx.from?.id) || 'ar';
    const messages = {
      ar: { error: `${escapeMarkdownV2('❌ حدث خطأ، حاول مرة أخرى أو تواصل مع')}` },
      en: { error: `${escapeMarkdownV2('❌ An error occurred, try again or contact')}` }
    };
    const currentMessages = messages[userLanguage] || messages.ar;
    await ctx.reply(
      `${currentMessages.error} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}