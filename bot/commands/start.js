// bot/commands/start.js
import { addUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { Markup } from 'telegraf';

export async function handleStart(ctx) {
  console.log('[START] Command invoked', { user: ctx.from, timestamp: new Date().toISOString() });

  try {
    const user = ctx.from;
    if (!user || !user.id) {
      console.error('[START] Error: ctx.from is undefined or missing id', { ctxFrom: ctx.from });
      throw new Error('User information unavailable');
    }

    const userId = user.id;
    const username = user.username ? `@${user.username}` : 'غير متوفر';
    const firstName = user.first_name || 'مستخدم';
    console.log('[START] User info', { userId, username, firstName });

    // Add user to database
    console.log('[START] Adding user to database');
    await addUser(userId, username, firstName);
    console.log('[START] User added successfully');

    // Check if user is already verified
    console.log('[START] Checking user verification');
    const userData = await isUserVerified(userId);
    const verified = userData?.verified || false;
    console.log('[START] Verification status', { verified });

    // Build response message
    let message = escapeMarkdownV2(
      `🤝 *مرحبًا بك في بوت معين المجتهدين*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n`
    );

    if (verified) {
      message += escapeMarkdownV2(
        `✅ حسابك مفعل بالفعل!\n\n` +
        `يمكنك الآن استخدام جميع ميزات البوت:\n\n`
      );
    } else {
      message += escapeMarkdownV2(
        `🔒 حسابك غير مفعل حاليًا\n\n` +
        `لتفعيل حسابك واستخدام جميع الميزات، استخدم:\n\n` +
        `\`/verify كود_التفعيل\`\n\n` +
        `💡 للحصول على الكود، تواصل مع: ${config.admin.supportChannel}\n\n`
      );
    }

    message += escapeMarkdownV2(
      `📚 *الميزات المتاحة:*\n\n` +
      `• 📋 /profile \\- عرض ملفك الشخصي\n` +
      `• 📅 /attendance \\- تسجيل الحضور\n` +
      `• ❓ /faq \\- الأسئلة الشائعة\n` +
      `• 📝 /submit \\- إرسال إجابة واجب\n\n` +
      `📞 للدعم والمساعدة: ${config.admin.supportChannel}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🤖 بوت معين المجتهدين`
    );

    // Create inline keyboard based on verification status
    let keyboard;
    if (verified) {
      keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📋 ملفي الشخصي', 'profile'),
          Markup.button.callback('📚 الدروس', 'courses')
        ],
        [
          Markup.button.callback('📝 الواجبات', 'assignments'),
          Markup.button.callback('⏰ التذكيرات', 'reminders')
        ],
        [
          Markup.button.callback('❓ الأسئلة الشائعة', 'faq'),
          Markup.button.callback('🆘 المساعدة', 'help')
        ]
      ]);
    } else {
      keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔑 تفعيل الحساب', 'verify_account'),
          Markup.button.callback('❓ الأسئلة الشائعة', 'faq')
        ],
        [
          Markup.button.callback('🆘 المساعدة', 'help'),
          Markup.button.callback('📞 الدعم', 'support')
        ]
      ]);
    }

    console.log('[START] Sending response', { message });
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      ...keyboard
    });
    console.log('[START] Response sent successfully');
  } catch (error) {
    console.error('[START] Error in handleStart:', {
      error: error.message,
      stack: error.stack,
      user: ctx.from,
      timestamp: new Date().toISOString(),
    });

    // Log error to file
    try {
      const fs = await import('fs');
      fs.appendFileSync(
        './data/error.log',
        `[START] ${new Date().toISOString()}\n${error.stack || error}\n`
      );
      console.log('[START] Error logged to file');
    } catch (fileError) {
      console.error('[START] Error logging to file:', {
        error: fileError.message,
        stack: fileError.stack,
      });
    }

    await ctx.reply(
      escapeMarkdownV2(
        `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
    console.log('[START] Error response sent to user');
  }
}