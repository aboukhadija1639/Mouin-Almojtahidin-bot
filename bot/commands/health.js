import { escapeMarkdownV2, bold } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';
import { getStats } from '../utils/database.js';

export async function handleHealth(ctx) {
  try {
    const userId = ctx.from.id;
    
    // Get system statistics
    const stats = await getStats();
    
    // Calculate uptime (simplified)
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // System health status
    const healthStatus = memUsageMB < 100 ? '🟢 ممتاز' : 
                        memUsageMB < 200 ? '🟡 جيد' : '🔴 يحتاج انتباه';
    
    const message = 
      `🏥 ${bold('حالة النظام')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 ${bold('الإحصائيات العامة:')}\n` +
      `👥 ${escapeMarkdownV2('إجمالي المستخدمين:')} ${stats.totalUsers || 0}\n` +
      `✅ ${escapeMarkdownV2('المستخدمين المفعلين:')} ${stats.verifiedUsers || 0}\n` +
      `📝 ${escapeMarkdownV2('إجمالي الواجبات:')} ${stats.totalAssignments || 0}\n` +
      `📋 ${escapeMarkdownV2('إجمالي الإرسالات:')} ${stats.totalSubmissions || 0}\n\n` +
      `🔧 ${bold('حالة النظام:')}\n` +
      `⏱️ ${escapeMarkdownV2('وقت التشغيل:')} ${uptimeHours}${escapeMarkdownV2(' ساعة')} ${uptimeMinutes}${escapeMarkdownV2(' دقيقة')}\n` +
      `💾 ${escapeMarkdownV2('استخدام الذاكرة:')} ${memUsageMB}${escapeMarkdownV2(' ميجابايت من')} ${memTotalMB}${escapeMarkdownV2(' ميجابايت')}\n` +
      `🏥 ${escapeMarkdownV2('الحالة:')} ${healthStatus}\n\n` +
      `📈 ${bold('النشاط الأخير:')}\n` +
      `📅 ${escapeMarkdownV2('آخر تسجيل حضور:')} ${stats.lastAttendance || escapeMarkdownV2('لا يوجد')}\n` +
      `📝 ${escapeMarkdownV2('آخر واجب مضاف:')} ${stats.lastAssignment || escapeMarkdownV2('لا يوجد')}\n` +
      `💬 ${escapeMarkdownV2('آخر تغذية راجعة:')} ${stats.lastFeedback || escapeMarkdownV2('لا يوجد')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    
  } catch (error) {
    console.error('خطأ في أمر /health:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ في فحص حالة النظام')}\n\n` +
      `يرجى المحاولة لاحقًا أو التواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}