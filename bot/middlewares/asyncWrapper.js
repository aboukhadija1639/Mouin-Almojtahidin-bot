// bot/middlewares/asyncWrapper.js

import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { logError } from './logger.js';

/**
 * Wraps an async Telegraf handler and ensures that any uncaught error
 * is logged and a friendly error message is sent back to the user.
 *
 * Usage:
 *   import { wrapAsync } from '../middlewares/asyncWrapper.js';
 *   bot.command('start', wrapAsync(handleStart));
 *
 * @param {(ctx: import('telegraf').Context) => Promise<void>} handler The original command handler.
 * @returns {import('telegraf').MiddlewareFn} Wrapped handler with error catching.
 */
export function wrapAsync(handler) {
  return async (ctx, next) => {
    try {
      await handler(ctx, next);
    } catch (error) {
      // Log the error with details so we can monitor later
      console.error('❌ Uncaught error inside handler:', {
        message: error?.message,
        stack: error?.stack,
        command: ctx?.message?.text || ctx?.callbackQuery?.data,
        from: ctx?.from,
      });
      if (typeof logError === 'function') {
        logError(error, 'COMMAND_HANDLER');
      }

      // Gracefully notify the end-user without exposing technical details
      const fallbackMsg =
        '❌ حدث خطأ غير متوقع أثناء تنفيذ الأمر، يرجى المحاولة مجددًا لاحقًا.';
      try {
        await ctx.reply(escapeMarkdownV2(fallbackMsg), {
          parse_mode: 'MarkdownV2',
        });
      } catch (e) {
        // In case replying also fails, just swallow – we already logged.
      }
    }
  };
}