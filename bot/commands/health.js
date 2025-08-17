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
      checks.database.status = 'warning';
      checks.database.message = 'قاعدة البيانات بطيئة نسبياً';
    }
    
    // Cache health check
    const cacheData = cacheStats.getStats();
    checks.cache.hitRate = cacheData.hitRate;
    
    if (cacheData.hitRate > 90) {
      checks.cache.status = 'excellent';
      checks.cache.message = 'التخزين المؤقت فعال جداً';
    } else if (cacheData.hitRate > 70) {
      checks.cache.status = 'good';
      checks.cache.message = 'التخزين المؤقت فعال';
    } else {
      checks.cache.status = 'warning';
      checks.cache.message = 'التخزين المؤقت يحتاج تحسين';
    }
    
    // Memory health check
    checks.memory.usage = monitoringStats.memory.usage;
    
    if (checks.memory.usage < 100) {
      checks.memory.status = 'excellent';
      checks.memory.message = 'استخدام الذاكرة منخفض';
    } else if (checks.memory.usage < 200) {
      checks.memory.status = 'good';
      checks.memory.message = 'استخدام الذاكرة معتدل';
    } else {
      checks.memory.status = 'warning';
      checks.memory.message = 'استخدام الذاكرة مرتفع';
    }
    
    // Uptime health check
    checks.uptime.value = monitoringStats.uptime.days;
    
    if (checks.uptime.value > 30) {
      checks.uptime.status = 'excellent';
      checks.uptime.message = 'النظام مستقر لفترة طويلة';
    } else if (checks.uptime.value > 7) {
      checks.uptime.status = 'good';
      checks.uptime.message = 'النظام مستقر';
    } else {
      checks.uptime.status = 'recent';
      checks.uptime.message = 'إعادة تشغيل حديثة';
    }
    
    return checks;
    
  } catch (error) {
    console.error('[HEALTH] Error in performHealthChecks:', error);
    return checks;
  }
}

// Build the health report message
function buildHealthReport(monitoringStats, cacheStatsData, dbStatsData, healthChecks) {
  const overallStatus = calculateOverallStatus(healthChecks);
  const overallEmoji = getStatusEmoji(overallStatus);
  const overallText = getStatusText(overallStatus);

  let report = `🩺 ${bold('تقرير صحة النظام')}\n\n`;
  report += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}\n\n`;
  report += `📊 ${bold('الحالة العامة:')} ${overallEmoji} ${bold(overallText)}\n\n`;

  // System Status
  report += `🖥️ ${bold('حالة النظام:')}\n`;
  report += `   ${getStatusEmoji(healthChecks.uptime.status)} ${bold('الوقت التشغيلي:')} ${monitoringStats.uptime.days} ${escapeMarkdownV2('أيام')} (${escapeMarkdownV2(healthChecks.uptime.message)})\n`;
  report += `   ${getStatusEmoji(healthChecks.memory.status)} ${bold('استخدام الذاكرة:')} ${monitoringStats.memory.usage} MB (${escapeMarkdownV2(healthChecks.memory.message)})\n\n`;

  // Database Status
  report += `💾 ${bold('قاعدة البيانات:')}\n`;
  report += `   ${getStatusEmoji(healthChecks.database.status)} ${bold('وقت الاستجابة:')} ${healthChecks.database.responseTime} ms (${escapeMarkdownV2(healthChecks.database.message)})\n`;
  report += `   🔄 ${bold('عدد الاستعلامات:')} ${dbStatsData.totalQueries}\n`;
  report += `   ⏱️ ${bold('متوسط الوقت:')} ${dbStatsData.avgQueryTime.toFixed(2)} ms\n\n`;

  // Cache Status
  report += `⚡ ${bold('التخزين المؤقت:')}\n`;
  report += `   ${getStatusEmoji(healthChecks.cache.status)} ${bold('نسبة الإصابة:')} ${cacheStatsData.hitRate}% (${escapeMarkdownV2(healthChecks.cache.message)})\n`;
  report += `   📦 ${bold('عدد العناصر:')} ${cacheStatsData.size}\n`;
  report += `   🔑 ${bold('الإصابات:')} ${cacheStatsData.hits}\n`;
  report += `   ❌ ${bold('الإخفاقات:')} ${cacheStatsData.misses}\n\n`;

  // Response Time
  report += `🚀 ${bold('أداء الاستجابة:')}\n`;
  report += `   ⏱️ ${bold('المتوسط:')} ${monitoringStats.responseTime.average.toFixed(2)} ms\n`;
  report += `   🔝 ${bold('الأقصى:')} ${monitoringStats.responseTime.max.toFixed(2)} ms\n`;
  report += `   🔻 ${bold('الأدنى:')} ${monitoringStats.responseTime.min.toFixed(2)} ms\n\n`;

  // Error Statistics
  report += `⚠️ ${bold('إحصائيات الأخطاء:')}\n`;
  report += `   🔢 ${bold('الإجمالي:')} ${monitoringStats.errors.total}\n`;
  if (Object.keys(monitoringStats.errors.byType).length > 0) {
    report += `   📋 ${bold('حسب النوع:')}\n`;
    Object.entries(monitoringStats.errors.byType).forEach(([errorName, err]) => {
      report += `      • ${escapeMarkdownV2(errorName)}: ${err.count} ${escapeMarkdownV2('مرة')}\n`;
    });
  } else {
    report += `   ✅ ${italic('لا أخطاء مسجلة')}\n`;
  }
  report += `\n`;

  // Recommendations
  const recommendations = generateRecommendations(healthChecks, monitoringStats);
  if (recommendations.length > 0) {
    report += `💡 ${bold('توصيات التحسين:')}\n`;
    recommendations.forEach((rec, index) => {
      report += `   ${index + 1}\\. ${escapeMarkdownV2(rec)}\n`;
    });
    report += `\n`;
  }

  report += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}\n\n`;
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