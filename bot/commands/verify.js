import { addUser, verifyUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleVerify(ctx) {
  try {
    const user = ctx.from;
    const userId = user.id;
    const username = user.username || '';
    const firstName = user.first_name || '';
    const messageText = ctx.message.text;

    // Extract verification code from command
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `🔑 *${escapeMarkdownV2('كيفية استخدام أمر التفعيل')}*\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')} ${escapeMarkdownV2('/verify كود_التفعيل')}\n\n` +
        `${escapeMarkdownV2('مثال:')} ${escapeMarkdownV2('/verify ABC123')}\n\n` +
        `💡 ${escapeMarkdownV2('للحصول على كود التفعيل، تواصل مع:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const providedCode = args[1];

    // Check if user is already verified
    const alreadyVerified = await isUserVerified(userId);
    if (alreadyVerified) {
      await ctx.reply(
        `✅ *${escapeMarkdownV2('حسابك مفعل بالفعل!')}*\n\n` +
        `${escapeMarkdownV2('يمكنك استخدام جميع ميزات البوت.')}\n\n` +
        `${escapeMarkdownV2('استخدم /profile لعرض ملفك الشخصي.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Verify the activation code
    if (providedCode !== config.users.activationCode) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('كود التفعيل غير صحيح')}*\n\n` +
        `${escapeMarkdownV2('تأكد من كتابة الكود بشكل صحيح.')}\n\n` +
        `💡 ${escapeMarkdownV2('للحصول على الكود الصحيح، تواصل مع:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add user to database if not exists
    await addUser(userId, username, firstName);

    // Verify the user
    const verificationSuccess = await verifyUser(userId);
    if (verificationSuccess) {
      await ctx.reply(
        `🎉 *${escapeMarkdownV2('تم تفعيل حسابك بنجاح!')}*\n\n` +
        `🤝 ${escapeMarkdownV2('مرحبًا بك في مجموعة معين المجتهدين.')}\n\n` +
        `✅ ${escapeMarkdownV2('يمكنك الآن:')}\n` +
        `• ${escapeMarkdownV2('تسجيل حضورك في الدروس')}\n` +
        `• ${escapeMarkdownV2('إرسال إجابات الواجبات')}\n` +
        `• ${escapeMarkdownV2('عرض ملفك الشخصي')}\n` +
        `• ${escapeMarkdownV2('الاطلاع على الأسئلة الشائعة')}\n\n` +
        `${escapeMarkdownV2('استخدم /profile لعرض معلوماتك.')}`,
        { parse_mode: 'MarkdownV2' }
      );

      // Notify admin about new verified user
      if (config.admin.chatId) {
        try {
          const adminMessage = `
            🆕 *${escapeMarkdownV2('مستخدم جديد تم تفعيله')}*\n\n
            ${escapeMarkdownV2('الاسم:')} ${escapeMarkdownV2(firstName)}\n
            ${escapeMarkdownV2('المعرف:')} @${escapeMarkdownV2(username || 'لا يوجد')}\n
            ID: \`${userId}\`\n
            ${escapeMarkdownV2('الوقت:')} ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}
          `.trim();
          await ctx.telegram.sendMessage(config.admin.chatId, adminMessage, { parse_mode: 'MarkdownV2' });
        } catch (notifyError) {
          const fs = await import('fs');
          fs.appendFileSync('./data/error.log', `[ADMIN_NOTIFY] ${new Date().toISOString()}\n${notifyError.stack || notifyError}\n`);
        }
      }
    } else {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('فشل في تفعيل الحساب')}*\n\n` +
        `${escapeMarkdownV2('حدث خطأ تقني، حاول مرة أخرى.')}\n\n` +
        `💡 ${escapeMarkdownV2('إذا استمر الخطأ، تواصل مع:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  } catch (error) {
    // Log error to file
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[VERIFY] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {
      console.error('Failed to log error:', e);
    }
    await ctx.reply(`❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}