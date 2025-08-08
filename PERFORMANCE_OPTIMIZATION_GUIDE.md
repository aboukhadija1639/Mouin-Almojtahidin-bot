# 🚀 Performance Optimization Guide - Telegram Bot

This guide provides comprehensive instructions for optimizing your Telegram bot for maximum performance on free hosting platforms.

## 📋 Table of Contents
- [Local Development with Webhooks](#local-development-with-webhooks)
- [Performance Optimizations](#performance-optimizations)
- [Free Hosting Options](#free-hosting-options)
- [Cold Start Optimization](#cold-start-optimization)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🌐 Local Development with Webhooks

### Using ngrok for Local Webhooks

1. **Install dependencies:**
```bash
npm install
```

2. **Set up ngrok (optional but recommended):**
```bash
# If you have an ngrok account, set your auth token
export NGROK_AUTH_TOKEN="your_auth_token"
# Optional: Set a custom subdomain
export NGROK_SUBDOMAIN="your-bot-name"
```

3. **Start the bot with webhooks:**
```bash
npm run webhook
```

### Environment Variables for Webhooks
```env
# .env file
BOT_TOKEN=your_bot_token
WEBHOOK_PORT=3000
NGROK_AUTH_TOKEN=your_ngrok_token  # Optional
NGROK_SUBDOMAIN=your-subdomain     # Optional
```

### Benefits of Webhooks vs Polling
- ✅ **Resource Efficient**: Only processes requests when needed
- ✅ **Faster Response**: No polling delay
- ✅ **Better for Production**: Scales better under load
- ✅ **Free Hosting Friendly**: Reduces unnecessary server wake-ups

## ⚡ Performance Optimizations

### 1. Caching System
The bot now includes comprehensive caching for:
- **User Data**: 5-minute cache for user verification and settings
- **Course Data**: 10-minute cache for course listings
- **Assignment Data**: 5-minute cache for assignments
- **Stats Data**: 15-minute cache for statistics

```javascript
// Example usage
import { userCacheUtil } from './bot/utils/cache.js';

// Check cache before database
const userData = userCacheUtil.get(userId);
if (!userData) {
  // Fetch from database and cache
  const dbUser = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);
  userCacheUtil.set(userId, dbUser, 300);
}
```

### 2. Enhanced Rate Limiting
Smart rate limiting with command-specific limits:
- **General Commands**: 8 req/min
- **Query Commands**: 15 req/min
- **Heavy Operations**: 3 req/5min
- **Admin Commands**: 20 req/min

### 3. Database Optimizations
- **Query Performance Tracking**: Monitor slow queries (>100ms)
- **Connection Pooling**: Efficient SQLite connection management
- **Batch Operations**: Bulk user/data operations
- **Cache Integration**: Automatic cache invalidation

### 4. Memory Management
- **Efficient Data Structures**: Maps and Sets for better performance
- **Automatic Cleanup**: Periodic cleanup of old data
- **Memory Monitoring**: Track memory usage and trends

## 🆓 Free Hosting Options

### 1. Render.com (Recommended)
**Pros:**
- 750 hours/month free
- Automatic deployments from Git
- Built-in monitoring
- SSL certificates

**Setup:**
```dockerfile
# Use the optimized Dockerfile provided
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 10000
CMD ["npm", "start"]
```

**render.yaml:**
```yaml
services:
  - type: web
    name: mouin-bot
    env: node
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: BOT_TOKEN
        fromSecret: BOT_TOKEN
```

### 2. Railway.app
**Pros:**
- $5 free credit monthly
- Easy deployment
- Good performance

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

### 3. Vercel (with Serverless Functions)
**Pros:**
- Excellent for webhooks
- Edge network
- Free tier generous

**Setup:**
Create `api/webhook.js`:
```javascript
import { Telegraf } from 'telegraf';
// Import your bot logic

const bot = new Telegraf(process.env.BOT_TOKEN);
// Register your handlers

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### 4. Replit + Uptime Robot
**Pros:**
- Free hosting
- Easy setup
- Can stay awake with monitoring

**Setup:**
1. Import your project to Replit
2. Set up environment variables
3. Use Uptime Robot to ping your bot every 5 minutes

## 🚀 Cold Start Optimization

### 1. Minimize Startup Time
```javascript
// Optimize imports - lazy load heavy modules
const heavyModule = await import('./heavyModule.js');

// Pre-warm critical caches
await warmCache.preloadCourseData(dbFunctions);
```

### 2. Keep-Alive Strategies
```javascript
// For platforms that sleep after inactivity
setInterval(async () => {
  // Light health check
  console.log('Keep-alive ping:', new Date().toISOString());
}, 25 * 60 * 1000); // Every 25 minutes
```

### 3. Efficient Initialization
```javascript
// Parallel initialization
await Promise.all([
  initDatabase(),
  initReminders(),
  validateConfig()
]);
```

## 📊 Monitoring & Maintenance

### 1. Built-in Monitoring
Access comprehensive monitoring via `/health` command:
- Response time statistics
- Memory usage tracking
- Database performance metrics
- Cache hit rates
- Error tracking

### 2. Log Management
```javascript
// Structured logging
console.log('[MONITOR]', {
  command: 'start',
  userId: 12345,
  duration: '45ms',
  cache: 'hit'
});
```

### 3. Performance Reports
Generate automatic performance reports:
```bash
# View monitoring data
ls data/monitoring/
# - stats.jsonl (15-minute intervals)
# - hourly.jsonl (hourly summaries)
# - errors.jsonl (error logs)
```

## 🔧 Configuration Tips

### 1. Environment Variables
```env
# Production optimizations
NODE_ENV=production
BOT_TOKEN=your_bot_token

# Rate limiting
RATE_LIMIT_ENABLED=true
MAX_REQUESTS_PER_MINUTE=10

# Caching
CACHE_ENABLED=true
CACHE_TTL_SECONDS=300

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=info
```

### 2. SQLite Optimizations
```javascript
// Optimize SQLite for production
await db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = 10000;
  PRAGMA foreign_keys = ON;
`);
```

### 3. Memory Limits
```javascript
// Set memory limits for free hosting
const memoryLimit = process.env.MEMORY_LIMIT || 512; // MB
if (process.memoryUsage().heapUsed > memoryLimit * 1024 * 1024) {
  console.warn('Memory usage high, forcing garbage collection');
  global.gc && global.gc();
}
```

## 📈 Performance Targets

With these optimizations, expect:
- **Response Time**: <200ms for cached operations
- **Memory Usage**: <100MB for typical load
- **Concurrent Users**: 20-30 users simultaneously
- **Cache Hit Rate**: >80% for frequently accessed data
- **Error Rate**: <1% under normal conditions

## 🛠️ Troubleshooting

### Common Issues:

1. **High Memory Usage**
   - Check for memory leaks in monitoring
   - Increase cache cleanup frequency
   - Use `global.gc()` if available

2. **Slow Database Queries**
   - Check slow query logs in monitoring
   - Optimize indexes
   - Increase cache TTL for stable data

3. **Rate Limiting Issues**
   - Adjust limits in config
   - Implement user education
   - Use better UX with inline keyboards

4. **Cold Starts**
   - Implement keep-alive pings
   - Optimize initialization code
   - Use webhook mode instead of polling

## 🎯 Best Practices

1. **Always use caching** for repeated database queries
2. **Monitor performance** regularly with `/health` command
3. **Use webhooks** instead of polling in production
4. **Implement proper error handling** with retry logic
5. **Keep dependencies minimal** to reduce bundle size
6. **Use structured logging** for better debugging
7. **Set up monitoring** for production deployments

## 📚 Additional Resources

- [Telegraf Documentation](https://telegraf.js.org/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [SQLite Optimization Guide](https://www.sqlite.org/optoverview.html)

---

🎉 **Your bot is now optimized for high performance on free hosting platforms!**