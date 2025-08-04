import { addUser, verifyUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';

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
        `🔑 *كيفية استخدام أمر التفعيل*\n\n` +
        `الصيغة الصحيحة: \`/verify كود_التفعيل\`\n\n` +
        `مثال: \`/verify ABC123\`\n\n` +
        `للحصول على كود التفعيل، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const providedCode = args[1];

    // Check if user is already verified
    const alreadyVerified = await isUserVerified(userId);
    if (alreadyVerified) {
      await ctx.reply(
        `✅ *حسابك مفعل بالفعل!*\n\n` +
        `يمكنك استخدام جميع ميزات البوت.\n\n` +
        `استخدم /profile لعرض ملفك الشخصي.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Verify the activation code
    if (providedCode !== config.users.activationCode) {
      await ctx.reply(
        `❌ *كود التفعيل غير صحيح*\n\n` +
        `تأكد من كتابة الكود بشكل صحيح.\n\n` +
        `للحصول على الكود الصحيح، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Add user to database if not exists
    await addUser(userId, username, firstName);

    // Verify the user
    const verificationSuccess = await verifyUser(userId);
    
    if (verificationSuccess) {
      await ctx.reply(
        `🎉 *تم تفعيل حسابك بنجاح!*\n\n` +
        `مرحباً بك في مجموعة معين المجتهدين.\n\n` +
        `✅ يمكنك الآن:\n` +
        `• تسجيل حضورك في الدروس\n` +
        `• إرسال إجابات الواجبات\n` +
        `• عرض ملفك الشخصي\n` +
        `• الاطلاع على الأسئلة الشائعة\n\n` +
        `استخدم /profile لعرض معلوماتك.`,
        { parse_mode: 'Markdown' }
      );

      // Notify admin about new verified user
      try {
        if (config.admin.chatId) {
          const adminMessage = `🆕 *مستخدم جديد تم تفعيله*\n\n` +
            `الاسم: ${firstName}\n` +
            `المعرف: @${username || 'لا يوجد'}\n` +
            `ID: \`${userId}\`\n` +
            `الوقت: ${new Date().toLocaleString('ar-SA')}`;
          
          await ctx.telegram.sendMessage(config.admin.chatId, adminMessage, { parse_mode: 'Markdown' });
        }
      } catch (notifyError) {
        console.error('خطأ في إرسال إشعار للمدير:', notifyError);
      }
    } else {
      await ctx.reply(
        `❌ *فشل في تفعيل الحساب*\n\n` +
        `حدث خطأ تقني، حاول مرة أخرى.\n\n` +
        `إذا استمر الخطأ، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /verify:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}