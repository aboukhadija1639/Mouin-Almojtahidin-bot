import { addUser, verifyUser, getUserInfo, getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleVerify(ctx) {
  try {
    const user = ctx.from;
    const userId = user.id;
    const username = user.username || '';
    const firstName = user.first_name || '';
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define bilingual messages
    const messages = {
      ar: {
        usageTitle: 'كيفية استخدام أمر التفعيل',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        getCodeInfo: 'للحصول على كود التفعيل، تواصل مع:',
        alreadyVerified: 'حسابك مفعل بالفعل!',
        canUseFeatures: 'يمكنك استخدام جميع ميزات البوت.',
        viewProfile: 'استخدم /profile لعرض ملفك الشخصي.',
        incorrectCode: 'كود التفعيل غير صحيح',
        checkCode: 'تأكد من كتابة الكود بشكل صحيح.',
        getCorrectCode: 'للحصول على الكود الصحيح، تواصل مع:',
        successTitle: 'تم تفعيل حسابك بنجاح!',
        welcomeMessage: 'مرحبًا بك في مجموعة معين المجتهدين.',
        nowYouCan: 'يمكنك الآن:',
        markAttendance: 'تسجيل حضورك في الدروس',
        submitAssignments: 'إرسال إجابات الواجبات',
        viewProfile2: 'عرض ملفك الشخصي',
        viewFaq: 'الاطلاع على الأسئلة الشائعة',
        useProfile: 'استخدم /profile لعرض معلوماتك.',
        activationFailed: 'فشل في تفعيل الحساب',
        technicalError: 'حدث خطأ تقني، حاول مرة أخرى.',
        persistentError: 'إذا استمر الخطأ، تواصل مع:',
        newUserVerified: 'مستخدم جديد تم تفعيله',
        name: 'الاسم:',
        username: 'المعرف:',
        time: 'الوقت:',
        noUsername: 'لا يوجد'
      },
      en: {
        usageTitle: 'How to Use Verification Command',
        correctFormat: 'Correct format:',
        example: 'Example:',
        getCodeInfo: 'To get verification code, contact:',
        alreadyVerified: 'Your account is already verified!',
        canUseFeatures: 'You can use all bot features.',
        viewProfile: 'Use /profile to view your profile.',
        incorrectCode: 'Verification code is incorrect',
        checkCode: 'Make sure to write the code correctly.',
        getCorrectCode: 'To get the correct code, contact:',
        successTitle: 'Your account has been successfully activated!',
        welcomeMessage: 'Welcome to Mouin Almojtahidin group.',
        nowYouCan: 'You can now:',
        markAttendance: 'Mark your attendance in lessons',
        submitAssignments: 'Submit assignment answers',
        viewProfile2: 'View your profile',
        viewFaq: 'Check frequently asked questions',
        useProfile: 'Use /profile to view your information.',
        activationFailed: 'Account activation failed',
        technicalError: 'A technical error occurred, try again.',
        persistentError: 'If the error persists, contact:',
        newUserVerified: 'New user verified',
        name: 'Name:',
        username: 'Username:',
        time: 'Time:',
        noUsername: 'None'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Extract verification code from command
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        info(
          `🔑 ${escapeMarkdownV2(msg.usageTitle)}\n\n` +
          `${escapeMarkdownV2(msg.correctFormat)} /verify كود_التفعيل\n\n` +
          `${escapeMarkdownV2(msg.example)} /verify ABC123\n\n` +
          `💡 ${escapeMarkdownV2(msg.getCodeInfo)} ${escapeMarkdownV2(config.admin.supportChannel)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const providedCode = args[1];

    // Check if user is already verified
    const userResult = await getUserInfo(userId);
    if (userResult.success && userResult.data?.is_verified) {
      await ctx.reply(
        success(
          `${escapeMarkdownV2(msg.alreadyVerified)}\n\n` +
          `${escapeMarkdownV2(msg.canUseFeatures)}\n\n` +
          `${escapeMarkdownV2(msg.viewProfile)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Verify the activation code
    if (providedCode !== config.users.activationCode) {
      await ctx.reply(
        error(
          `${escapeMarkdownV2(msg.incorrectCode)}\n\n` +
          `${escapeMarkdownV2(msg.checkCode)}\n\n` +
          `💡 ${escapeMarkdownV2(msg.getCorrectCode)} ${escapeMarkdownV2(config.admin.supportChannel)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Add user to database if not exists
    const addResult = await addUser(userId, username, firstName);
    if (!addResult.success) {
      throw new Error('Failed to add user to database');
    }

    // Verify the user
    const verificationSuccess = await verifyUser(userId);
    if (verificationSuccess) {
      await ctx.reply(
        success(
          `🎉 ${escapeMarkdownV2(msg.successTitle)}\n\n` +
          `🤝 ${escapeMarkdownV2(msg.welcomeMessage)}\n\n` +
          `✅ ${escapeMarkdownV2(msg.nowYouCan)}\n` +
          `• ${escapeMarkdownV2(msg.markAttendance)}\n` +
          `• ${escapeMarkdownV2(msg.submitAssignments)}\n` +
          `• ${escapeMarkdownV2(msg.viewProfile2)}\n` +
          `• ${escapeMarkdownV2(msg.viewFaq)}\n\n` +
          `${escapeMarkdownV2(msg.useProfile)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );

      // Notify admin about new verified user
      if (config.admin.chatId) {
        try {
          const adminMessage = 
            `🆕 ${escapeMarkdownV2(msg.newUserVerified)}\n\n` +
            `${escapeMarkdownV2(msg.name)} ${escapeMarkdownV2(firstName)}\n` +
            `${escapeMarkdownV2(msg.username)} ${escapeMarkdownV2(username ? `@${username}` : msg.noUsername)}\n` +
            `ID: \`${userId}\`\n` +
            `${escapeMarkdownV2(msg.time)} ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}`;
            
          await ctx.telegram.sendMessage(config.admin.chatId, adminMessage, { 
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true
          });
        } catch (notifyError) {
          logError(notifyError, 'ADMIN_NOTIFICATION');
        }
      }
    } else {
      await ctx.reply(
        error(
          `${escapeMarkdownV2(msg.activationFailed)}\n\n` +
          `${escapeMarkdownV2(msg.technicalError)}\n\n` +
          `💡 ${escapeMarkdownV2(msg.persistentError)} ${escapeMarkdownV2(config.admin.supportChannel)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }
  } catch (err) {
    logError(err, 'COMMAND_VERIFY');
    
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