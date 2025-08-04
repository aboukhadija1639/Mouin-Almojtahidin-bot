import { addAttendance, getLesson } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleAttendance(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Extract lesson ID from command
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `📋 *كيفية تسجيل الحضور*\n\n` +
        `الصيغة الصحيحة: \`/attendance رقم_الدرس\`\n\n` +
        `مثال: \`/attendance 1\`\n\n` +
        `💡 يمكنك الحصول على أرقام الدروس من المدرب أو من الإعلانات.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const lessonIdInput = args[1];
    const lessonId = parseInt(lessonIdInput);

    // Validate lesson ID
    if (isNaN(lessonId) || lessonId <= 0) {
      await ctx.reply(
        `❌ *رقم الدرس غير صحيح*\n\n` +
        `يرجى إدخال رقم صحيح للدرس.\n\n` +
        `مثال: \`/attendance 1\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Check if lesson exists
    const lesson = await getLesson(lessonId);
    if (!lesson) {
      await ctx.reply(
        `❌ *الدرس غير موجود*\n\n` +
        `لم يتم العثور على درس برقم ${lessonId}.\n\n` +
        `تأكد من رقم الدرس أو تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Mark attendance
    const attendanceSuccess = await addAttendance(userId, lessonId);
    
    if (attendanceSuccess) {
      await ctx.reply(
        `✅ *تم تسجيل حضورك بنجاح!*\n\n` +
        `📚 *الدرس:* ${lesson.title}\n` +
        `📅 *التاريخ:* ${lesson.date}\n` +
        `⏰ *الوقت:* ${lesson.time}\n\n` +
        `🎉 شكراً لك على الحضور والمتابعة!\n\n` +
        `استخدم /profile لعرض إجمالي حضورك.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في تسجيل الحضور*\n\n` +
        `حدث خطأ تقني، حاول مرة أخرى.\n\n` +
        `إذا استمر الخطأ، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /attendance:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}