import { addAttendance, getLesson, getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleAttendance(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define bilingual messages
    const messages = {
      ar: {
        howToMarkAttendance: 'كيفية تسجيل الحضور',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        getLessonNumbers: 'يمكنك الحصول على أرقام الدروس من المدرب أو من الإعلانات.',
        incorrectLessonNumber: 'رقم الدرس غير صحيح',
        enterValidNumber: 'يرجى إدخال رقم صحيح للدرس.',
        lessonNotFound: 'الدرس غير موجود',
        lessonNotFoundMessage: 'لم يتم العثور على درس برقم',
        checkNumberOrContact: 'تأكد من رقم الدرس أو تواصل مع',
        attendanceMarked: 'تم تسجيل حضورك بنجاح!',
        lesson: 'الدرس:',
        date: 'التاريخ:',
        time: 'الوقت:',
        thankYou: '🎉 شكراً لك على الحضور والمتابعة!',
        useProfile: 'استخدم',
        viewTotalAttendance: 'لعرض إجمالي حضورك.',
        attendanceFailedTitle: 'فشل في تسجيل الحضور',
        technicalError: 'حدث خطأ تقني، حاول مرة أخرى.',
        persistentError: 'إذا استمر الخطأ، تواصل مع',
        errorOccurred: 'حدث خطأ',
        tryAgainOrContact: 'حاول مرة أخرى أو تواصل مع'
      },
      en: {
        howToMarkAttendance: 'How to Mark Attendance',
        correctFormat: 'Correct format:',
        example: 'Example:',
        getLessonNumbers: 'You can get lesson numbers from instructor or announcements.',
        incorrectLessonNumber: 'Incorrect lesson number',
        enterValidNumber: 'Please enter a valid lesson number.',
        lessonNotFound: 'Lesson not found',
        lessonNotFoundMessage: 'No lesson found with number',
        checkNumberOrContact: 'Check lesson number or contact',
        attendanceMarked: 'Your attendance has been marked successfully!',
        lesson: 'Lesson:',
        date: 'Date:',
        time: 'Time:',
        thankYou: '🎉 Thank you for attending and following up!',
        useProfile: 'Use',
        viewTotalAttendance: 'to view your total attendance.',
        attendanceFailedTitle: 'Failed to mark attendance',
        technicalError: 'A technical error occurred, try again.',
        persistentError: 'If the error persists, contact',
        errorOccurred: 'An error occurred',
        tryAgainOrContact: 'Try again or contact'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Extract lesson ID from command
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        info(
          `📋 ${bold(msg.howToMarkAttendance)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${escapeMarkdownV2(msg.correctFormat)} ${code('/attendance رقم_الدرس')}\n` +
          `${escapeMarkdownV2(msg.example)} ${code('/attendance 1')}\n\n` +
          `💡 ${escapeMarkdownV2(msg.getLessonNumbers)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const lessonIdInput = args[1];
    const lessonId = parseInt(lessonIdInput, 10);

    // Validate lesson ID
    if (isNaN(lessonId) || lessonId <= 0) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectLessonNumber)}\n\n` +
          `${escapeMarkdownV2(msg.enterValidNumber)}\n` +
          `${escapeMarkdownV2(msg.example)} ${code('/attendance 1')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Check if lesson exists
    const lesson = await getLesson(lessonId);
    if (!lesson) {
      await ctx.reply(
        error(
          `${bold(msg.lessonNotFound)}\n\n` +
          `${escapeMarkdownV2(`${msg.lessonNotFoundMessage} ${lessonId}.`)}\n` +
          `${escapeMarkdownV2(msg.checkNumberOrContact)} ${escapeMarkdownV2(config.admin.supportChannel)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Mark attendance
    const attendanceSuccess = await addAttendance(userId, lessonId);
    
    if (attendanceSuccess) {
      const escapedTitle = escapeMarkdownV2(lesson.title || '');
      const escapedDate = escapeMarkdownV2(lesson.date || '');
      const escapedTime = escapeMarkdownV2(lesson.time || '');
      
      await ctx.reply(
        success(
          `${bold(msg.attendanceMarked)}\n\n` +
          `📚 ${bold(msg.lesson)} ${escapedTitle}\n` +
          `📅 ${bold(msg.date)} ${escapedDate}\n` +
          `⏰ ${bold(msg.time)} ${escapedTime}\n\n` +
          `${escapeMarkdownV2(msg.thankYou)}\n` +
          `${escapeMarkdownV2(msg.useProfile)} ${code('/profile')} ${escapeMarkdownV2(msg.viewTotalAttendance)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    } else {
      await ctx.reply(
        error(
          `${bold(msg.attendanceFailedTitle)}\n\n` +
          `${escapeMarkdownV2(msg.technicalError)}\n` +
          `${escapeMarkdownV2(msg.persistentError)} ${escapeMarkdownV2(config.admin.supportChannel)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }

  } catch (err) {
    logError(err, 'COMMAND_ATTENDANCE');
    
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