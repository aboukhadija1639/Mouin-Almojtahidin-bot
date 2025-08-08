import fs from 'fs';
import path from 'path';
import { getDbStats } from './database.js';
import { cacheStats } from './cache.js';
import { getUserActivityInfo } from '../middlewares/rateLimiter.js';

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      commands: new Map(),
      errors: new Map(),
      responseTime: {
        total: 0,
        count: 0,
        max: 0,
        min: Infinity,
        recent: []
      },
      memoryUsage: [],
      activeUsers: new Set(),
      hourlyStats: new Map()
    };
    
    this.logDir = './data/monitoring';
    this.ensureLogDirectory();
    this.startPeriodicLogging();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Track command execution
  trackCommand(command, userId, executionTime, success = true) {
    // Update command stats
    const commandStats = this.stats.commands.get(command) || {
      count: 0,
      totalTime: 0,
      errors: 0,
      avgTime: 0
    };
    
    commandStats.count++;
    commandStats.totalTime += executionTime;
    commandStats.avgTime = commandStats.totalTime / commandStats.count;
    
    if (!success) {
      commandStats.errors++;
    }
    
    this.stats.commands.set(command, commandStats);
    
    // Update response time stats
    this.updateResponseTime(executionTime);
    
    // Track active users
    this.stats.activeUsers.add(userId);
    
    // Update hourly stats
    this.updateHourlyStats(command);
    
    console.debug(`[MONITOR] ${command}: ${executionTime}ms (${success ? 'success' : 'error'})`);
  }

  // Track errors
  trackError(error, context, userId = null) {
    const errorKey = `${context}:${error.message}`;
    const errorStats = this.stats.errors.get(errorKey) || {
      count: 0,
      lastOccurred: null,
      context,
      users: new Set()
    };
    
    errorStats.count++;
    errorStats.lastOccurred = new Date().toISOString();
    
    if (userId) {
      errorStats.users.add(userId);
    }
    
    this.stats.errors.set(errorKey, errorStats);
    
    // Log error to file
    this.logError(error, context, userId);
    
    console.error(`[MONITOR] Error in ${context}:`, error.message);
  }

  // Update response time statistics
  updateResponseTime(time) {
    this.stats.responseTime.total += time;
    this.stats.responseTime.count++;
    this.stats.responseTime.max = Math.max(this.stats.responseTime.max, time);
    this.stats.responseTime.min = Math.min(this.stats.responseTime.min, time);
    
    // Keep recent response times (last 100)
    this.stats.responseTime.recent.push({
      time,
      timestamp: Date.now()
    });
    
    if (this.stats.responseTime.recent.length > 100) {
      this.stats.responseTime.recent.shift();
    }
  }

  // Update hourly statistics
  updateHourlyStats(command) {
    const hour = new Date().getHours();
    const hourlyData = this.stats.hourlyStats.get(hour) || {
      commands: new Map(),
      totalCommands: 0
    };
    
    const commandCount = hourlyData.commands.get(command) || 0;
    hourlyData.commands.set(command, commandCount + 1);
    hourlyData.totalCommands++;
    
    this.stats.hourlyStats.set(hour, hourlyData);
  }

  // Get comprehensive statistics
  getStats() {
    const now = Date.now();
    const uptime = now - this.stats.startTime;
    const avgResponseTime = this.stats.responseTime.count > 0 ? 
      this.stats.responseTime.total / this.stats.responseTime.count : 0;
    
    // Get most used commands
    const topCommands = Array.from(this.stats.commands.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([command, stats]) => ({
        command,
        ...stats,
        errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0
      }));
    
    // Get recent errors
    const recentErrors = Array.from(this.stats.errors.entries())
      .sort(([,a], [,b]) => new Date(b.lastOccurred) - new Date(a.lastOccurred))
      .slice(0, 10)
      .map(([error, stats]) => ({
        error,
        ...stats,
        users: stats.users.size
      }));
    
    // Get database and cache stats
    const dbStats = getDbStats();
    const cacheStatsData = cacheStats.getStats();
    
    return {
      uptime: {
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
        formatted: this.formatUptime(uptime)
      },
      responseTime: {
        average: Math.round(avgResponseTime * 100) / 100,
        min: this.stats.responseTime.min === Infinity ? 0 : this.stats.responseTime.min,
        max: this.stats.responseTime.max,
        recent: this.stats.responseTime.recent.slice(-10)
      },
      commands: {
        total: Array.from(this.stats.commands.values()).reduce((sum, cmd) => sum + cmd.count, 0),
        unique: this.stats.commands.size,
        top: topCommands
      },
      errors: {
        total: Array.from(this.stats.errors.values()).reduce((sum, err) => sum + err.count, 0),
        unique: this.stats.errors.size,
        recent: recentErrors
      },
      users: {
        active: this.stats.activeUsers.size,
        activeList: Array.from(this.stats.activeUsers)
      },
      database: dbStats,
      cache: cacheStatsData,
      memory: this.getMemoryStats(),
      hourlyActivity: this.getHourlyActivity()
    };
  }

  // Get memory usage statistics
  getMemoryStats() {
    const usage = process.memoryUsage();
    
    // Store memory usage (keep last 60 entries for trend)
    this.stats.memoryUsage.push({
      timestamp: Date.now(),
      ...usage
    });
    
    if (this.stats.memoryUsage.length > 60) {
      this.stats.memoryUsage.shift();
    }
    
    return {
      current: {
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100
      },
      trend: this.stats.memoryUsage.slice(-10)
    };
  }

  // Get hourly activity pattern
  getHourlyActivity() {
    const activity = {};
    for (let hour = 0; hour < 24; hour++) {
      const hourData = this.stats.hourlyStats.get(hour);
      activity[hour] = {
        commands: hourData ? hourData.totalCommands : 0,
        topCommand: hourData ? this.getTopCommandForHour(hourData) : null
      };
    }
    return activity;
  }

  getTopCommandForHour(hourData) {
    if (!hourData.commands.size) return null;
    
    let topCommand = null;
    let maxCount = 0;
    
    for (const [command, count] of hourData.commands.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topCommand = command;
      }
    }
    
    return { command: topCommand, count: maxCount };
  }

  // Format uptime in human readable format
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Log error to file
  logError(error, context, userId) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context,
      userId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    };
    
    const logFile = path.join(this.logDir, 'errors.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Start periodic logging
  startPeriodicLogging() {
    // Log stats every 15 minutes
    setInterval(() => {
      this.saveStatsToFile();
    }, 15 * 60 * 1000);
    
    // Log hourly summary
    setInterval(() => {
      this.saveHourlySummary();
    }, 60 * 60 * 1000);
  }

  // Save current stats to file
  saveStatsToFile() {
    try {
      const stats = this.getStats();
      const timestamp = new Date().toISOString();
      const logFile = path.join(this.logDir, 'stats.jsonl');
      
      const logEntry = {
        timestamp,
        ...stats
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[MONITOR] Failed to save stats:', error);
    }
  }

  // Save hourly summary
  saveHourlySummary() {
    try {
      const hour = new Date().getHours();
      const hourData = this.stats.hourlyStats.get(hour);
      
      if (hourData) {
        const summary = {
          timestamp: new Date().toISOString(),
          hour,
          totalCommands: hourData.totalCommands,
          commands: Object.fromEntries(hourData.commands),
          activeUsers: this.stats.activeUsers.size
        };
        
        const logFile = path.join(this.logDir, 'hourly.jsonl');
        fs.appendFileSync(logFile, JSON.stringify(summary) + '\n');
        
        // Clear hourly stats for next hour
        this.stats.hourlyStats.delete(hour);
        this.stats.activeUsers.clear();
      }
    } catch (error) {
      console.error('[MONITOR] Failed to save hourly summary:', error);
    }
  }

  // Generate performance report
  generateReport() {
    const stats = this.getStats();
    const timestamp = new Date().toISOString();
    
    let report = `📊 Bot Performance Report - ${timestamp}\n`;
    report += `═══════════════════════════════════════\n\n`;
    
    // Uptime and basic stats
    report += `⏱️ Uptime: ${stats.uptime.formatted}\n`;
    report += `📨 Total Commands: ${stats.commands.total}\n`;
    report += `👥 Active Users: ${stats.users.active}\n`;
    report += `❌ Total Errors: ${stats.errors.total}\n\n`;
    
    // Performance metrics
    report += `🚀 Performance Metrics:\n`;
    report += `   • Average Response Time: ${stats.responseTime.average}ms\n`;
    report += `   • Fastest Response: ${stats.responseTime.min}ms\n`;
    report += `   • Slowest Response: ${stats.responseTime.max}ms\n\n`;
    
    // Database performance
    report += `💾 Database Performance:\n`;
    report += `   • Cache Hit Rate: ${stats.database.cacheHitRate}%\n`;
    report += `   • Average Query Time: ${stats.database.avgQueryTime}ms\n`;
    report += `   • Total Queries: ${stats.database.queries}\n\n`;
    
    // Memory usage
    report += `🧠 Memory Usage:\n`;
    report += `   • Heap Used: ${stats.memory.current.heapUsed}MB\n`;
    report += `   • Total RSS: ${stats.memory.current.rss}MB\n\n`;
    
    // Top commands
    report += `🔥 Top Commands:\n`;
    stats.commands.top.slice(0, 5).forEach((cmd, index) => {
      report += `   ${index + 1}. ${cmd.command}: ${cmd.count} uses (avg: ${cmd.avgTime.toFixed(1)}ms)\n`;
    });
    
    if (stats.errors.recent.length > 0) {
      report += `\n⚠️ Recent Errors:\n`;
      stats.errors.recent.slice(0, 3).forEach((err, index) => {
        report += `   ${index + 1}. ${err.error}: ${err.count} occurrences\n`;
      });
    }
    
    // Save report to file
    const reportFile = path.join(this.logDir, `report_${Date.now()}.txt`);
    fs.writeFileSync(reportFile, report);
    
    return report;
  }

  // Reset all statistics
  reset() {
    this.stats = {
      startTime: Date.now(),
      commands: new Map(),
      errors: new Map(),
      responseTime: {
        total: 0,
        count: 0,
        max: 0,
        min: Infinity,
        recent: []
      },
      memoryUsage: [],
      activeUsers: new Set(),
      hourlyStats: new Map()
    };
    
    console.log('[MONITOR] Statistics reset');
  }
}

// Create singleton instance
const monitor = new PerformanceMonitor();

// Middleware wrapper for automatic performance tracking
export function withMonitoring(handler, commandName) {
  return async (ctx) => {
    const startTime = Date.now();
    const userId = ctx.from?.id;
    
    try {
      await handler(ctx);
      const duration = Date.now() - startTime;
      monitor.trackCommand(commandName, userId, duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      monitor.trackCommand(commandName, userId, duration, false);
      monitor.trackError(error, commandName, userId);
      throw error; // Re-throw to maintain error handling
    }
  };
}

// Export monitor functions
export const {
  trackCommand: trackCommand,
  trackError: trackError,
  getStats: getMonitoringStats,
  generateReport: generatePerformanceReport,
  reset: resetMonitoring
} = monitor;

export default monitor;