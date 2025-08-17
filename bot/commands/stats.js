// bot/commands/stats.js
import { getStats } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold } from '../utils/escapeMarkdownV2.js';

export async function handleStats(ctx) {
  try {
    const userId = ctx.from.id;
    console.log(`[STATS] Processing /stats command for userId: ${userId}`);

    // Check if user is admin
    const isAdmin = config.admin.userIds.includes(userId);
    console.log(`[STATS] Admin check result: ${isAdmin}`);
    if (!isAdmin) {
      console.log(`[STATS] User ${userId} is not authorized`);
      await ctx.reply(
        `🚫 ${bold('غير مسموح')}\n\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `${escapeMarkdownV2('هذا الأمر للمدراء فقط')}\n` +
        `💡 ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
      return;
    }

    // Fetch stats
    console.log('[STATS] Fetching statistics from database');
    const stats = await getStats();
    console.log('[STATS] Stats retrieved:', JSON.stringify(stats, null, 2));
    if (!stats || !stats.totalUsers) {
      console.log('[STATS] No statistics available or invalid data');
      await ctx.reply(
        `❌ ${bold('فشل في جلب الإحصائيات')}\n\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `${escapeMarkdownV2('حاول مرة أخرى لاحقًا')}`,
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
      return;
    }

    // Build response message
    let message = `📊 ${bold('إحصائيات البوت')}\n\n` +
      `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
    message += `${bold('👥 المستخدمون:')}\n`;
    message += `${escapeMarkdownV2('• إجمالي:')} ${stats.totalUsers}\n`;
    message += `${escapeMarkdownV2('• مفعلون:')} ${stats.verifiedUsers}\n`;
    message += `${escapeMarkdownV2('• نسبة التفعيل:')} ${stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%\n\n`;
    message += `${bold('📚 الحضور:')}\n`;
    message += stats.attendanceByLesson?.length
      ? stats.attendanceByLesson
          .map((l) =>
            `${escapeMarkdownV2('•')} ${escapeMarkdownV2(l.title)}: ${l.attendance_count}/${l.total_verified} (${l.total_verified > 0 ? Math.round((l.attendance_count / l.total_verified) * 100) : 0}%)`
          )
          .join('\n') + '\n\n'
      : `${escapeMarkdownV2('• لا توجد بيانات حضور')}\n\n`;
    message += `${bold('📝 الواجبات:')}\n`;
    message += stats.submissionsByAssignment?.length
      ? stats.submissionsByAssignment
          .map((a) =>
            `${escapeMarkdownV2('•')} ${escapeMarkdownV2(a.title)}: ${a.submission_count}/${a.total_verified} (${a.total_verified > 0 ? Math.round((a.submission_count / a.total_verified) * 100) : 0}%)`
          )
          .join('\n') + '\n\n'
      : `${escapeMarkdownV2('• لا توجد بيانات واجبات')}\n\n`;
    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;
    message += `${escapeMarkdownV2('📅 وقت الإحصائية:')} ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}\n`;
    message += `${bold('🤖 بوت معين المجتهدين')}`;

    console.log('[STATS] Constructed message:', message);
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error('[STATS] Error in handleStats:', error);
    try {
      const fs = await import('fs');
      fs.appendFileSync(
        './data/error.log',
        `[STATS] ${new Date().toISOString()}\n${error.stack || error}\n`
      );
      console.log('[STATS] Error logged to file');
    } catch (e) {
      console.error('[STATS] Failed to log error to file:', e);
    }
    await ctx.reply(
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
  }
}