import { getMonitoringStats } from '../utils/monitoring.js';
import { cacheStats } from '../utils/cache.js';
import { getDbStats } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleHealth(ctx) {
  const startTime = Date.now();
  console.log('[HEALTH] Health check requested', { userId: ctx.from?.id });

  try {
    // Get comprehensive system statistics
    const monitoringStats = getMonitoringStats();
    const cacheStatsData = cacheStats.getStats();
    const dbStatsData = getDbStats();
    
    // System health checks
    const healthChecks = await performHealthChecks();
    
    // Build comprehensive health report
    const healthReport = buildHealthReport(monitoringStats, cacheStatsData, dbStatsData, healthChecks);
    
    await ctx.reply(healthReport, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });

    const duration = Date.now() - startTime;
    console.log(`[HEALTH] Health check completed in ${duration}ms`);

  } catch (error) {
    console.error('[HEALTH] Error in health check:', error);
    
    await ctx.reply(
      `❌ ${bold('خطأ في فحص الحالة')}\n\n` +
      `${escapeMarkdownV2('حدث خطأ أثناء فحص حالة النظام.')}\n` +
      `${escapeMarkdownV2('يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.')}\n\n` +
      `💬 ${bold('الدعم:')} ${escapeMarkdownV2(config.admin?.supportChannel || '@support')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Perform various health checks
async function performHealthChecks() {
  const checks = {
    database: { status: 'unknown', message: '', responseTime: 0 },
    cache: { status: 'unknown', message: '', hitRate: 0 },
    memory: { status: 'unknown', message: '', usage: 0 },
    uptime: { status: 'unknown', message: '', value: 0 }
  };

  try {
    // Database health check
    const dbStart = Date.now();
    const dbStats = getDbStats();
    checks.database.responseTime = Date.now() - dbStart;
    
    if (dbStats.avgQueryTime < 50) {
      checks.database.status = 'excellent';
      checks.database.message = 'قاعدة البيانات تعمل بكفاءة عالية';
    } else if (dbStats.avgQueryTime < 100) {
      checks.database.status = 'good';
      checks.database.message = 'قاعدة البيانات تعمل بشكل جيد';
    } else {
      checks.database.status = 'slow';
      checks.database.message = 'قاعدة البيانات تعمل ببطء';
    }

    // Cache health check
    const cacheStatsData = cacheStats.getStats();
    const avgHitRate = Object.values(cacheStatsData).reduce((sum, stat) => {
      return sum + (stat.hits / (stat.hits + stat.misses) || 0);
    }, 0) / Object.keys(cacheStatsData).length * 100;
    
    checks.cache.hitRate = avgHitRate;
    
    if (avgHitRate > 80) {
      checks.cache.status = 'excellent';
      checks.cache.message = 'التخزين المؤقت يعمل بكفاءة ممتازة';
    } else if (avgHitRate > 60) {
      checks.cache.status = 'good';
      checks.cache.message = 'التخزين المؤقت يعمل بشكل جيد';
    } else {
      checks.cache.status = 'poor';
      checks.cache.message = 'التخزين المؤقت يحتاج تحسين';
    }

    // Memory health check
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    checks.memory.usage = heapUsedMB;
    
    if (heapUsedMB < 100) {
      checks.memory.status = 'excellent';
      checks.memory.message = 'استخدام الذاكرة ممتاز';
    } else if (heapUsedMB < 200) {
      checks.memory.status = 'good';
      checks.memory.message = 'استخدام الذاكرة جيد';
    } else {
      checks.memory.status = 'high';
      checks.memory.message = 'استخدام الذاكرة مرتفع';
    }

    // Uptime check
    const uptime = process.uptime();
    checks.uptime.value = uptime;
    
    if (uptime > 86400) { // More than 1 day
      checks.uptime.status = 'excellent';
      checks.uptime.message = 'النظام مستقر لفترة طويلة';
    } else if (uptime > 3600) { // More than 1 hour
      checks.uptime.status = 'good';
      checks.uptime.message = 'النظام يعمل بشكل مستقر';
    } else {
      checks.uptime.status = 'recent';
      checks.uptime.message = 'النظام تم تشغيله مؤخراً';
    }

  } catch (error) {
    console.error('Health check error:', error);
  }

  return checks;
}

// Build comprehensive health report
function buildHealthReport(monitoringStats, cacheStatsData, dbStatsData, healthChecks) {
  let report = `🏥 ${bold('تقرير الحالة الصحية للنظام')}\n\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Overall status
  const overallStatus = calculateOverallStatus(healthChecks);
  const statusEmoji = getStatusEmoji(overallStatus);
  report += `${statusEmoji} ${bold('الحالة العامة:')} ${getStatusText(overallStatus)}\n\n`;

  // System uptime and basic info
  report += `⏱️ ${bold('معلومات النظام:')}\n`;
  report += `   • مدة التشغيل: ${escapeMarkdownV2(monitoringStats.uptime.formatted)}\n`;
  report += `   • إجمالي الأوامر: ${monitoringStats.commands.total}\n`;
  report += `   • المستخدمين النشطين: ${monitoringStats.users.active}\n`;
  report += `   • وقت الاستجابة المتوسط: ${monitoringStats.responseTime.average}ms\n\n`;

  // Health checks details
  report += `🔍 ${bold('فحوصات مفصلة:')}\n\n`;
  
  // Database health
  const dbEmoji = getStatusEmoji(healthChecks.database.status);
  report += `${dbEmoji} ${bold('قاعدة البيانات:')}\n`;
  report += `   • الحالة: ${escapeMarkdownV2(healthChecks.database.message)}\n`;
  report += `   • متوسط وقت الاستعلام: ${dbStatsData.avgQueryTime}ms\n`;
  report += `   • معدل نجاح التخزين المؤقت: ${dbStatsData.cacheHitRate}%\n`;
  report += `   • إجمالي الاستعلامات: ${dbStatsData.queries}\n\n`;

  // Cache health
  const cacheEmoji = getStatusEmoji(healthChecks.cache.status);
  report += `${cacheEmoji} ${bold('التخزين المؤقت:')}\n`;
  report += `   • الحالة: ${escapeMarkdownV2(healthChecks.cache.message)}\n`;
  report += `   • معدل النجاح: ${healthChecks.cache.hitRate.toFixed(1)}%\n`;
  
  // Cache details
  const cacheDetails = Object.entries(cacheStatsData).map(([name, stats]) => {
    const hitRate = stats.hits + stats.misses > 0 ? 
      (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1) : '0';
    return `     ◦ ${escapeMarkdownV2(name)}: ${hitRate}% \\(${stats.keys} مفاتيح\\)`;
  }).join('\n');
  
  if (cacheDetails) {
    report += `${cacheDetails}\n\n`;
  }

  // Memory health
  const memoryEmoji = getStatusEmoji(healthChecks.memory.status);
  report += `${memoryEmoji} ${bold('الذاكرة:')}\n`;
  report += `   • الحالة: ${escapeMarkdownV2(healthChecks.memory.message)}\n`;
  report += `   • الاستخدام: ${healthChecks.memory.usage.toFixed(1)}MB\n`;
  report += `   • إجمالي الذاكرة: ${(monitoringStats.memory.current.heapTotal).toFixed(1)}MB\n\n`;

  // Performance metrics
  report += `📊 ${bold('مقاييس الأداء:')}\n`;
  report += `   • أسرع استجابة: ${monitoringStats.responseTime.min}ms\n`;
  report += `   • أبطأ استجابة: ${monitoringStats.responseTime.max}ms\n`;
  report += `   • إجمالي الأخطاء: ${monitoringStats.errors.total}\n\n`;

  // Top commands
  if (monitoringStats.commands.top.length > 0) {
    report += `🔥 ${bold('الأوامر الأكثر استخداماً:')}\n`;
    monitoringStats.commands.top.slice(0, 5).forEach((cmd, index) => {
      const errorRate = cmd.errorRate > 0 ? ` \\(${cmd.errorRate.toFixed(1)}% أخطاء\\)` : '';
      report += `   ${index + 1}\\. ${code(cmd.command)}: ${cmd.count} استخدام${errorRate}\n`;
    });
    report += `\n`;
  }

  // Recent errors (if any)
  if (monitoringStats.errors.recent.length > 0) {
    report += `⚠️ ${bold('أخطاء حديثة:')}\n`;
    monitoringStats.errors.recent.slice(0, 3).forEach((err, index) => {
      const errorName = err.error.split(':')[0] || 'خطأ غير محدد';
      report += `   ${index + 1}\\. ${escapeMarkdownV2(errorName)}: ${err.count} مرة\n`;
    });
    report += `\n`;
  }

  // Recommendations
  const recommendations = generateRecommendations(healthChecks, monitoringStats);
  if (recommendations.length > 0) {
    report += `💡 ${bold('توصيات التحسين:')}\n`;
    recommendations.forEach((rec, index) => {
      report += `   ${index + 1}\\. ${escapeMarkdownV2(rec)}\n`;
    });
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  report += `🕐 ${italic(`آخر فحص: ${new Date().toLocaleString('ar-SA')}`)}\n`;
  report += `💬 ${bold('للدعم:')} ${escapeMarkdownV2(config.admin?.supportChannel || '@support')}`;

  return report;
}

// Helper functions
function calculateOverallStatus(checks) {
  const statuses = Object.values(checks).map(check => check.status);
  
  if (statuses.every(status => status === 'excellent')) return 'excellent';
  if (statuses.some(status => status === 'slow' || status === 'poor' || status === 'high')) return 'warning';
  if (statuses.some(status => status === 'good')) return 'good';
  return 'unknown';
}

function getStatusEmoji(status) {
  const emojis = {
    excellent: '🟢',
    good: '🟡',
    warning: '🟠',
    slow: '🔴',
    poor: '🔴',
    high: '🟠',
    recent: '🔵',
    unknown: '⚪'
  };
  return emojis[status] || '⚪';
}

function getStatusText(status) {
  const texts = {
    excellent: 'ممتاز',
    good: 'جيد',
    warning: 'يحتاج انتباه',
    slow: 'بطيء',
    poor: 'ضعيف',
    high: 'مرتفع',
    recent: 'حديث',
    unknown: 'غير معروف'
  };
  return texts[status] || 'غير معروف';
}

function generateRecommendations(healthChecks, monitoringStats) {
  const recommendations = [];
  
  if (healthChecks.database.status === 'slow') {
    recommendations.push('فكر في تحسين استعلامات قاعدة البيانات أو زيادة التخزين المؤقت');
  }
  
  if (healthChecks.cache.hitRate < 70) {
    recommendations.push('حسن استراتيجية التخزين المؤقت لتحسين الأداء');
  }
  
  if (healthChecks.memory.usage > 150) {
    recommendations.push('راقب استخدام الذاكرة وفكر في تحسين الكود');
  }
  
  if (monitoringStats.responseTime.average > 500) {
    recommendations.push('متوسط وقت الاستجابة مرتفع، حسن أداء الأوامر');
  }
  
  if (monitoringStats.errors.total > 10) {
    recommendations.push('هناك عدد مرتفع من الأخطاء، راجع السجلات للتفاصيل');
  }
  
  return recommendations;
}