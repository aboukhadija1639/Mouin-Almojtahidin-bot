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
        `🚫 *غير مسموح*\nn\nn` +
        `هذا الأمر مخصص للمدراء فقط\n.\nn\nn` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel.replace(/@/g, '\n@')}`,
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
          `📚 *إدارة الكورسات*\nn\nn` +
          `لا توجد كورسات متاحة للحذف\n.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      let message = `🗑️ *حذف الكورس*\nn\nn` +
        `📝 *الصيغة الصحيحة:*\nn` +
        `\`/deletecourse رقم_الكورس\`\nn\nn` +
        `📚 *الكورسات المتاحة:*\nn\nn`;

      courses.forEach((course, index) => {
        const escapedCourseId = escapeMarkdownV2(course.course_id.toString());
        const escapedLessonCount = escapeMarkdownV2(course.lesson_count.toString());
        const escapedAssignmentCount = escapeMarkdownV2(course.assignment_count.toString());
        
        message += `${index + 1}\n. *الكورس ${escapedCourseId}*\nn` +
          `   📅 عدد الدروس: ${escapedLessonCount}\nn` +
          `   📝 عدد الواجبات: ${escapedAssignmentCount}\nn\nn`;
      });

      message += `⚠️ *تحذير:* حذف الكورس سيؤدي إلى حذف جميع الدروس والواجبات المرتبطة به نهائياً\n.\nn\nn` +
        `💡 مثال: \`/deletecourse 1\``;

      await ctx.reply(message, { parse_mode: 'MarkdownV2' });
      return;
    }

    const courseId = parseInt(args[1]);

    // Validate course ID
    if (isNaN(courseId) || courseId <= 0) {
      await ctx.reply(
        `❌ *رقم الكورس غير صحيح*\nn\nn` +
        `يرجى إدخال رقم صحيح للكورس\n.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if course exists
    const courses = await getCourses();
    const courseExists = courses.some(course => course.course_id === courseId);
    
    if (!courseExists) {
      await ctx.reply(
        `❌ *الكورس غير موجود*\nn\nn` +
        `لا يوجد كورس برقم ${escapeMarkdownV2(courseId.toString())}\n.\nn\nn` +
        `استخدم \`/deletecourse\` لعرض الكورسات المتاحة\n.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Delete course
    const success = await deleteCourse(courseId);
    
    if (success) {
      const escapedCourseId = escapeMarkdownV2(courseId.toString());
      await ctx.reply(
        `✅ *تم حذف الكورس بنجاح*\nn\nn` +
        `🆔 *رقم الكورس:* ${escapedCourseId}\nn` +
        `🗑️ تم حذف جميع الدروس والواجبات المرتبطة بالكورس\n.\nn\nn` +
        `📊 *البيانات المحذوفة:*\nn` +
        `• جميع الدروس في الكورس\nn` +
        `• جميع الواجبات في الكورس\nn` +
        `• جميع تسجيلات الحضور\nn` +
        `• جميع إجابات الواجبات`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في حذف الكورس*\nn\nn` +
        `حدث خطأ تقني أثناء حذف الكورس\n.\nn` +
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\n@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deletecourse:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\n@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}