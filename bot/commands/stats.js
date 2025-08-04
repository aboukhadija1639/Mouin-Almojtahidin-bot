import { getStats } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleStats(ctx) {
  try {
    const userId = ctx.from.id;
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *${escapeMarkdownV2('غير مسموح')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('هذا الأمر للمدراء فقط.')}\n💡 ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const stats = await getStats();
    if (!stats) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('فشل في جلب الإحصائيات')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('حاول مرة أخرى لاحقًا.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    let message = `📊 *${escapeMarkdownV2('إحصائيات البوت')}*\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👥 *${escapeMarkdownV2('المستخدمون:')}*\n`;
    message += `• ${escapeMarkdownV2('إجمالي:')} ${stats.totalUsers}\n`;
    message += `• ${escapeMarkdownV2('مفعلون:')} ${stats.verifiedUsers}\n`;
    message += `• ${escapeMarkdownV2('نسبة التفعيل:')} ${stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}\%\n\n`;
    message += `📚 *${escapeMarkdownV2('الحضور:')}*\n`;
    message += stats.attendanceByLesson.map(l => `• ${escapeMarkdownV2(l.title)}: ${l.attendance_count}/${l.total_verified} (${Math.round((l.attendance_count / l.total_verified) * 100) || 0}\%)`).join('\n') + '\n\n';
    message += `📝 *${escapeMarkdownV2('الواجبات:')}*\n`;
    message += stats.submissionsByAssignment.map(a => `• ${escapeMarkdownV2(a.title)}: ${a.submission_count}/${a.total_verified} (${Math.round((a.submission_count / a.total_verified) * 100) || 0}\%)`).join('\n') + '\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `📅 *${escapeMarkdownV2('وقت الإحصائية:')}* ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}\n`;
    message += `🤖 *${escapeMarkdownV2('بوت معين المجتهدين')}*`;
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[STATS] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}