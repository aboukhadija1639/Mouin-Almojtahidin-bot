import { getStats } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleStats(ctx) {
  try {
    const userId = ctx.from.id;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\n\n` +
        `هذا الأمر مخصص للمدراء فقط.\n\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get statistics from database
    const stats = await getStats();
    
    if (!stats) {
      await ctx.reply(
        `❌ *فشل في جلب الإحصائيات*\n\n` +
        `حدث خطأ تقني، حاول مرة أخرى.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Build statistics message
    let message = `📊 *إحصائيات البوت*\n\n`;
    
    // User statistics
    message += `👥 *المستخدمون:*\n`;
    message += `• إجمالي المستخدمين: ${stats.totalUsers}\n`;
    message += `• المستخدمون المفعلون: ${stats.verifiedUsers}\n`;
    message += `• نسبة التفعيل: ${stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%\n\n`;
    
    // Attendance statistics
    message += `📚 *الحضور حسب الدرس:*\n`;
    if (stats.attendanceByLesson.length > 0) {
      stats.attendanceByLesson.forEach((lesson) => {
        const attendanceRate = lesson.total_verified > 0 ? Math.round((lesson.attendance_count / lesson.total_verified) * 100) : 0;
        message += `• ${lesson.title}: ${lesson.attendance_count}/${lesson.total_verified} (${attendanceRate}%)\n`;
      });
    } else {
      message += `• لا توجد دروس مسجلة بعد\n`;
    }
    
    message += `\n`;
    
    // Assignment statistics
    message += `📝 *الواجبات حسب التسليم:*\n`;
    if (stats.submissionsByAssignment.length > 0) {
      stats.submissionsByAssignment.forEach((assignment) => {
        const submissionRate = assignment.total_verified > 0 ? Math.round((assignment.submission_count / assignment.total_verified) * 100) : 0;
        message += `• ${assignment.title}: ${assignment.submission_count}/${assignment.total_verified} (${submissionRate}%)\n`;
      });
    } else {
      message += `• لا توجد واجبات مضافة بعد\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 *وقت الإحصائية:* ${new Date().toLocaleString('ar-SA')}\n`;
    message += `🤖 *بوت معين المجتهدين*`;

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /stats:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}