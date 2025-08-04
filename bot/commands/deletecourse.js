import { deleteCourse, getCourses } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleDeleteCourse(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\\n\\n` +
        `هذا الأمر مخصص للمدراء فقط\\.\\n\\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      // Show available courses
      const courses = await getCourses();
      
      if (courses.length === 0) {
        await ctx.reply(
          `📚 *إدارة الكورسات*\\n\\n` +
          `لا توجد كورسات متاحة للحذف\\.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      let message = `🗑️ *حذف الكورس*\\n\\n` +
        `📝 *الصيغة الصحيحة:*\\n` +
        `\`/deletecourse رقم_الكورس\`\\n\\n` +
        `📚 *الكورسات المتاحة:*\\n\\n`;

      courses.forEach((course, index) => {
        const escapedCourseId = escapeMarkdownV2(course.course_id.toString());
        const escapedLessonCount = escapeMarkdownV2(course.lesson_count.toString());
        const escapedAssignmentCount = escapeMarkdownV2(course.assignment_count.toString());
        
        message += `${index + 1}\\. *الكورس ${escapedCourseId}*\\n` +
          `   📅 عدد الدروس: ${escapedLessonCount}\\n` +
          `   📝 عدد الواجبات: ${escapedAssignmentCount}\\n\\n`;
      });

      message += `⚠️ *تحذير:* حذف الكورس سيؤدي إلى حذف جميع الدروس والواجبات المرتبطة به نهائياً\\.\\n\\n` +
        `💡 مثال: \`/deletecourse 1\``;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    const courseId = parseInt(args[1]);

    // Validate course ID
    if (isNaN(courseId) || courseId <= 0) {
      await ctx.reply(
        `❌ *رقم الكورس غير صحيح*\\n\\n` +
        `يرجى إدخال رقم صحيح للكورس\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if course exists
    const courses = await getCourses();
    const courseExists = courses.some(course => course.course_id === courseId);
    
    if (!courseExists) {
      await ctx.reply(
        `❌ *الكورس غير موجود*\\n\\n` +
        `لا يوجد كورس برقم ${escapeMarkdownV2(courseId.toString())}\\.\\n\\n` +
        `استخدم \`/deletecourse\` لعرض الكورسات المتاحة\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Delete course
    const success = await deleteCourse(courseId);
    
    if (success) {
      const escapedCourseId = escapeMarkdownV2(courseId.toString());
      await ctx.reply(
        `✅ *تم حذف الكورس بنجاح*\\n\\n` +
        `🆔 *رقم الكورس:* ${escapedCourseId}\\n` +
        `🗑️ تم حذف جميع الدروس والواجبات المرتبطة بالكورس\\.\\n\\n` +
        `📊 *البيانات المحذوفة:*\\n` +
        `• جميع الدروس في الكورس\\n` +
        `• جميع الواجبات في الكورس\\n` +
        `• جميع تسجيلات الحضور\\n` +
        `• جميع إجابات الواجبات`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في حذف الكورس*\\n\\n` +
        `حدث خطأ تقني أثناء حذف الكورس\\.\\n` +
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deletecourse:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}