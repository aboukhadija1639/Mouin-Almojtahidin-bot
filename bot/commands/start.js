import { addUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleStart(ctx) {
  try {
    const user = ctx.from;
    const userId = user.id;
    const username = user.username || '';
    const firstName = user.first_name || '';

    // Add user to database
    await addUser(userId, username, firstName);

    // Check if user is already verified
    const verified = await isUserVerified(userId);

    // Header
    let message = `🤝 *${escapeMarkdownV2('مرحبًا بك في بوت معين المجتهدين')}*\n\n`;
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';

    if (verified) {
      message += `✅ ${escapeMarkdownV2('حسابك مفعل بالفعل!')}\n\n`;
      message += `${escapeMarkdownV2('يمكنك الآن استخدام جميع ميزات البوت:')}\n\n`;
    } else {
      message += `🔒 ${escapeMarkdownV2('حسابك غير مفعل حاليًا')}\n\n`;
      message += `${escapeMarkdownV2('لتفعيل حسابك واستخدام جميع الميزات، استخدم:')}\n\n`;
      message += '`/verify كود_التفعيل`\n\n';
      message += `💡 ${escapeMarkdownV2('للحصول على الكود، تواصل مع:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    }

    message += `📚 *${escapeMarkdownV2('الميزات المتاحة:')}*\n\n`;
    message += `• 📋 /profile - ${escapeMarkdownV2('عرض ملفك الشخصي')}\n`;
    message += `• 📅 /attendance - ${escapeMarkdownV2('تسجيل الحضور')}\n`;
    message += `• ❓ /faq - ${escapeMarkdownV2('الأسئلة الشائعة')}\n`;
    message += `• 📝 /submit - ${escapeMarkdownV2('إرسال إجابة واجب')}\n\n`;
    message += `📞 ${escapeMarkdownV2('للدعم والمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';
    message += '🤖 بوت معين المجتهدين';

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    // Log error to file
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[START] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}