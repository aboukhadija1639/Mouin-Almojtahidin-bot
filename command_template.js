// Template for updating all command handlers in bot/commands/
// Apply these patterns to ALL command files

import { getUserLanguage, /* other database functions */ } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleCommandName(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define bilingual messages
    const messages = {
      ar: {
        // Arabic messages
        title: 'عنوان باللغة العربية',
        message1: 'رسالة 1 باللغة العربية',
        message2: 'رسالة 2 باللغة العربية'
      },
      en: {
        // English messages
        title: 'Title in English',
        message1: 'Message 1 in English',
        message2: 'Message 2 in English'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Parse command arguments safely
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        info(
          `${bold(msg.title)}\n\n` +
          `${escapeMarkdownV2(msg.message1)}\n` +
          `${code('/command example')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Input validation with parseInt for IDs
    const someId = parseInt(args[1], 10);
    if (isNaN(someId) || someId <= 0) {
      await ctx.reply(
        error(
          `${bold('رقم غير صحيح')}\n` +
          `${escapeMarkdownV2('يرجى إدخال رقم صحيح.')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Database operations with proper error handling
    const result = await someDbFunction(someId);
    if (!result.success) {
      throw new Error('Database operation failed');
    }

    // Success response
    await ctx.reply(
      success(
        `${bold(msg.title)}\n\n` +
        `${escapeMarkdownV2(msg.message2)}`
      ),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );

  } catch (err) {
    logError(err, 'COMMAND_NAME');
    
    // Get user language for error message
    const userLanguage = await getUserLanguage(ctx.from?.id).catch(() => 'ar') || 'ar';
    
    const errorMessages = {
      ar: 'حدث خطأ، حاول مرة أخرى أو تواصل مع الدعم',
      en: 'An error occurred, try again or contact support'
    };

    await ctx.reply(
      error(errorMessages[userLanguage] || errorMessages.ar),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );
  }
}

/*
REQUIREMENTS FOR ALL COMMANDS:
1. Import getUserLanguage and relevant database functions
2. Import escapeMarkdownV2, bold, code from escapeMarkdownV2.js  
3. Import success, error, info from responseTemplates.js
4. Import logError from logger.js
5. Wrap core logic in try-catch
6. Use logError with context (e.g., 'COMMAND_STATS')
7. Get user language with getUserLanguage(userId)
8. Define bilingual messages as objects (ar/en)
9. Use escapeMarkdownV2 for ALL dynamic text
10. Use response templates (success/error/info)
11. Add input validation with parseInt for IDs
12. Use parse_mode: 'MarkdownV2' and disable_web_page_preview: true
13. Handle errors gracefully with user-friendly messages
14. For admin commands: ensure requireAdmin is applied in index.js
15. For reminder commands: integrate with reminders.js functions
*/