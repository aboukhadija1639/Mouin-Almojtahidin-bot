// bot/commands/start.js
import { addUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
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

    // Build response message with professional formatting
    let message = `🤝 ${bold('مرحبًا بك في بوت معين المجتهدين')}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (verified) {
      message += `✅ ${bold('حسابك مفعل بالفعل!')}\n\n`;
      message += `يمكنك الآن استخدام جميع ميزات البوت:\n\n`;
    } else {
      message += `🔒 ${bold('حسابك غير مفعل حاليًا')}\n\n`;
      message += `لتفعيل حسابك واستخدام جميع الميزات، استخدم:\n\n`;
      message += `${code('/verify كود_التفعيل')}\n\n`;
      message += `💡 للحصول على الكود، تواصل مع: ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    }

    message += `📚 ${bold('الميزات المتاحة:')}\n\n`;
    message += `• 📋 ${code('/profile')} \\- عرض ملفك الشخصي\n`;
    message += `• 📅 ${code('/attendance')} \\- تسجيل الحضور\n`;
    message += `• ❓ ${code('/faq')} \\- الأسئلة الشائعة\n`;
    message += `• 📝 ${code('/submit')} \\- إرسال إجابة واجب\n`;
    
    if (verified) {
      message += `• ⏰ ${code('/addreminder')} \\- إضافة تذكير شخصي\n`;
      message += `• 📋 ${code('/listreminders')} \\- عرض التذكيرات\n`;
      message += `• 🗑️ ${code('/deletereminder')} \\- حذف تذكير\n`;
    }
    
    message += `\n📞 للدعم والمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🤖 ${italic('بوت معين المجتهدين')}`;

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
        ],
        [
          Markup.button.callback('⚙️ الإعدادات', 'settings')
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

    console.log('[START] Sending response');
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
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
    console.log('[START] Error response sent to user');
  }
}