# 🚀 Mouin Almojtahidin Bot - Deployment Guide

## 📋 Overview

This guide will help you deploy the **Mouin Almojtahidin Bot** for production use. The bot is designed for educational course management with features like lesson reminders, assignment tracking, and user verification.

## ✅ Pre-Deployment Checklist

### 1. System Requirements
- **Node.js**: v22.15.0 or higher
- **npm**: v10.0.0 or higher
- **Operating System**: Linux, macOS, or Windows
- **Memory**: Minimum 512MB RAM
- **Storage**: Minimum 1GB free space

### 2. Telegram Setup
- [ ] Create a bot with [@BotFather](https://t.me/BotFather)
- [ ] Get your bot token
- [ ] Create/identify your main group for announcements
- [ ] Create/identify your admin group for notifications
- [ ] Get admin user IDs (use [@userinfobot](https://t.me/userinfobot))
- [ ] Set up support channel

## 🔧 Installation Steps

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <your-repository-url>
cd Mouin-Almojtahidin-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Step 2: Environment Configuration
Edit the `.env` file with your actual values:

```bash
# Required - Bot Token from @BotFather
BOT_TOKEN=your_actual_bot_token

# Required - Admin user IDs (comma-separated)
ADMIN_USER_IDS=123456789,987654321

# Required - Group IDs (use negative numbers for groups)
MAIN_GROUP_ID=-1001234567890
ADMIN_GROUP_ID=-1001234567890

# Required - Support channel
SUPPORT_CHANNEL=@YourSupportChannel

# Required - Activation code for users
ACTIVATION_CODE=your_secret_code
```

### Step 3: Database Initialization
The bot will automatically create the SQLite database on first run:
```bash
# Test database creation
npm run test
```

### Step 4: Validation Test
```bash
# Check for syntax errors
node -c index.js

# Test bot connectivity (optional)
npm start
```

## 🌐 Deployment Options

### Option 1: Simple Polling Mode (Recommended for beginners)
```bash
# Start the bot
npm start

# Or with PM2 for production
npm install -g pm2
pm2 start index.js --name "mouin-bot"
pm2 save
pm2 startup
```

### Option 2: Webhook Mode (For production servers)
```bash
# Set webhook URL in .env
WEBHOOK_URL=https://yourdomain.com/bot
WEBHOOK_PORT=3000

# Start with webhook
npm start
```

### Option 3: Docker Deployment
```bash
# Build Docker image
docker build -t mouin-bot .

# Run container
docker run -d \
  --name mouin-bot \
  --restart unless-stopped \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/.env:/app/.env \
  mouin-bot
```

## 🛡️ Security Configuration

### 1. Environment Variables Security
- Never commit `.env` to version control
- Use strong activation codes
- Regularly rotate bot tokens if compromised
- Limit admin user IDs to trusted individuals

### 2. Rate Limiting
```bash
RATE_LIMITING_ENABLED=true
MAX_REQUESTS_PER_MINUTE=30
MAX_REQUESTS_PER_HOUR=100
```

### 3. Group Security
- Make sure bot has appropriate permissions in groups
- Regularly review admin list
- Monitor bot logs for suspicious activity

## 📊 Monitoring and Maintenance

### 1. Log Files
The bot creates log files in the `./data/` directory:
- `combined.log` - All activities
- `error.log` - Error messages only

### 2. Database Backup
```bash
# Backup database regularly
cp ./data/mouin_almojtahidin.db ./backups/backup_$(date +%Y%m%d).db
```

### 3. Health Checks
Monitor these key indicators:
- Bot responsiveness to `/start` command
- Database file size growth
- Error log entries
- Memory usage

## 🔧 Common Issues and Solutions

### Issue 1: Bot not responding
```bash
# Check bot token validity
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"

# Check logs
tail -f ./data/error.log
```

### Issue 2: Database errors
```bash
# Check database file permissions
ls -la ./data/mouin_almojtahidin.db

# Reset database (WARNING: This deletes all data)
rm ./data/mouin_almojtahidin.db
npm start
```

### Issue 3: Memory issues
```bash
# Monitor memory usage
top -p $(pgrep -f "node.*index.js")

# Restart bot if needed
pm2 restart mouin-bot
```

## 📈 Performance Optimization

### 1. Database Optimization
- Regular database cleanup of old records
- Index optimization for frequently queried tables
- Monitor database file size

### 2. Memory Management
- Use PM2 for automatic restarts
- Monitor memory leaks
- Set appropriate restart policies

### 3. Network Optimization
- Use webhook mode for high-traffic scenarios
- Implement proper error handling for network issues
- Consider CDN for media files

## 🔄 Updates and Maintenance

### 1. Regular Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Restart bot
pm2 restart mouin-bot
```

### 2. Database Migrations
- Always backup database before updates
- Test migrations in staging environment
- Monitor for migration errors

### 3. Feature Rollouts
- Test new features with limited user groups
- Monitor error logs after deployments
- Have rollback plan ready

## 📞 Support and Troubleshooting

### 1. Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start
```

### 2. Common Commands for Troubleshooting
```bash
# Check bot status
pm2 status

# View live logs
pm2 logs mouin-bot

# Restart bot
pm2 restart mouin-bot

# Check system resources
htop
df -h
```

### 3. Getting Help
- Check error logs first: `./data/error.log`
- Review bot configuration: `.env` file
- Test individual commands manually
- Contact development team if needed

## 🎯 Post-Deployment Checklist

- [ ] Bot responds to `/start` command
- [ ] Admin commands work for authorized users
- [ ] User verification system works
- [ ] Database is being created and populated
- [ ] Logs are being written properly
- [ ] Reminders system is functional
- [ ] All message formatting displays correctly
- [ ] Rate limiting is working
- [ ] Backup system is in place
- [ ] Monitoring is set up

## 📅 Deployment Timeline

**Target Deployment Date**: August 05, 2025

### Pre-deployment (1 week before)
- [ ] Complete testing in staging environment
- [ ] Prepare production server
- [ ] Set up monitoring and alerting
- [ ] Prepare rollback plan

### Deployment Day
- [ ] Deploy during low-usage hours
- [ ] Monitor closely for first 24 hours
- [ ] Have development team on standby
- [ ] Communicate with users about new features

### Post-deployment (1 week after)
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any issues promptly
- [ ] Document lessons learned

---

**🤖 Mouin Almojtahidin Bot v2.0 - Ready for Community Deployment**

For technical support during deployment, contact the development team.