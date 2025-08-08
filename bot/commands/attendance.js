import { addAttendance, getLesson } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';

export async function handleAttendance(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Extract lesson ID from command
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `📋 ${bold('كيفية تسجيل الحضور')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')} ${code('/attendance رقم_الدرس')}\n` +
        `${escapeMarkdownV2('مثال:')} ${code('/attendance 1')}\n\n` +
        `💡 ${escapeMarkdownV2('يمكنك الحصول على أرقام الدروس من المدرب أو من الإعلانات.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const lessonIdInput = args[1];
    const lessonId = parseInt(lessonIdInput);

    // Validate lesson ID
    if (isNaN(lessonId) || lessonId <= 0) {
      await ctx.reply(
        `❌ ${bold('رقم الدرس غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يرجى إدخال رقم صحيح للدرس.')}\n` +
        `${escapeMarkdownV2('مثال:')} ${code('/attendance 1')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if lesson exists
    const lesson = await getLesson(lessonId);
    if (!lesson) {
      await ctx.reply(
        `❌ ${bold('الدرس غير موجود')}\n\n` +
        `${escapeMarkdownV2(`لم يتم العثور على درس برقم ${lessonId}.`)}\n` +
        `${escapeMarkdownV2('تأكد من رقم الدرس أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
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
        `✅ ${bold('تم تسجيل حضورك بنجاح!')}\n\n` +
        `📚 ${bold('الدرس:')} ${escapedTitle}\n` +
        `📅 ${bold('التاريخ:')} ${escapedDate}\n` +
        `⏰ ${bold('الوقت:')} ${escapedTime}\n\n` +
        `${escapeMarkdownV2('🎉 شكراً لك على الحضور والمتابعة!')}\n` +
        `${escapeMarkdownV2('استخدم')} ${code('/profile')} ${escapeMarkdownV2('لعرض إجمالي حضورك.')}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('فشل في تسجيل الحضور')}\n\n` +
        `${escapeMarkdownV2('حدث خطأ تقني، حاول مرة أخرى.')}\n` +
        `${escapeMarkdownV2('إذا استمر الخطأ، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /attendance:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}