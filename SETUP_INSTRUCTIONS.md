# Mouin-Almojtahidin Bot - Setup Instructions

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Git installed
- A Telegram Bot Token (get from @BotFather)
- Admin Telegram User IDs

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd mouin-almojtahidin-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Environment Configuration

Edit `.env` file with your settings:

```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Admin Configuration
ADMIN_USER_IDS=123456789,987654321
ADMIN_CHAT_ID=-1001234567890
ADMIN_SUPPORT_CHANNEL=@your_support_channel

# Database Configuration
DATABASE_PATH=./data/mouin_almojtahidin.db

# Webhook Configuration (for Render deployment)
WEBHOOK_URL=https://your-app-name.onrender.com
WEBHOOK_PATH=/webhook
PORT=3000
```

### 4. Testing

```bash
# Run comprehensive tests
node test_bot.js

# Test specific functionality
npm test
```

### 5. Local Development

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start
```

## 🔧 Configuration Details

### Bot Token
1. Message @BotFather on Telegram
2. Create a new bot: `/newbot`
3. Choose a name and username
4. Copy the token to `BOT_TOKEN`

### Admin Setup
1. Get your Telegram User ID (use @userinfobot)
2. Add to `ADMIN_USER_IDS` (comma-separated)
3. Set up admin chat/channel for notifications

### Database
- SQLite database is created automatically
- Located at `./data/mouin_almojtahidin.db`
- Tables created on first run

## 📋 Available Commands

### User Commands
- `/start` - Start the bot
- `/verify` - Verify account
- `/profile` - View profile
- `/settings` - Manage settings
- `/addreminder` - Add custom reminder
- `/assignments` - View assignments
- `/feedback` - Send feedback
- `/health` - System health

### Admin Commands
- `/stats` - View statistics
- `/publish` - Publish announcement
- `/addassignment` - Add assignment
- `/deleteassignment` - Delete assignment
- `/viewfeedback` - View feedback
- `/broadcast` - Send broadcast message

## 🚀 Deployment

### Render Deployment

1. **Create Render Account**
   - Sign up at render.com
   - Connect your GitHub repository

2. **Create Web Service**
   - New → Web Service
   - Connect your repository
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**
   - Add all variables from `.env` file
   - Set `NODE_ENV=production`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Local Deployment

```bash
# Install PM2 for process management
npm install -g pm2

# Start the bot
pm2 start index.js --name "mouin-bot"

# Monitor logs
pm2 logs mouin-bot

# Restart if needed
pm2 restart mouin-bot
```

## 🔍 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot token is correct
   - Verify bot is not blocked
   - Check webhook/polling mode

2. **Database errors**
   - Ensure data directory exists
   - Check file permissions
   - Verify SQLite is working

3. **Command not found**
   - Check command registration in `index.js`
   - Verify import statements
   - Check for syntax errors

4. **MarkdownV2 parsing errors**
   - Use `escapeMarkdownV2()` for dynamic content
   - Check for unescaped special characters
   - Test with simple text first

### Debug Mode

```bash
# Enable debug logging
DEBUG=true npm start

# Check logs
tail -f ./data/combined.log
tail -f ./data/error.log
```

## 📊 Monitoring

### Health Check
- Use `/health` command to check system status
- Monitor memory usage and uptime
- Check database connectivity

### Logs
- Combined logs: `./data/combined.log`
- Error logs: `./data/error.log`
- Application logs in console

### Statistics
- User count and verification status
- Assignment and submission statistics
- System performance metrics

## 🔒 Security

### Rate Limiting
- Enabled by default
- Configurable limits in `.env`
- Prevents abuse and spam

### User Verification
- Required for most commands
- Admin-controlled activation
- Secure verification process

### Data Protection
- SQL injection prevention
- Input sanitization
- Secure database operations

## 📈 Performance

### Optimization Tips
1. Use webhooks for production
2. Enable database indexing
3. Monitor memory usage
4. Regular log rotation
5. Efficient error handling

### Scaling
- Horizontal scaling with multiple instances
- Database optimization for large datasets
- Caching for frequently accessed data

## 🆘 Support

### Getting Help
1. Check this documentation
2. Review error logs
3. Test with `/health` command
4. Contact support channel

### Reporting Issues
1. Use `/feedback` command
2. Use `/reportbug` command
3. Include error details and steps to reproduce

### Contributing
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## 📝 Changelog

### Version 2.0.0
- ✅ Fixed all import errors
- ✅ Enhanced settings with interactive buttons
- ✅ Added health monitoring
- ✅ Improved error handling
- ✅ Enhanced MarkdownV2 formatting
- ✅ Added comprehensive testing
- ✅ Fixed database schema issues
- ✅ Added notification frequency support

### Previous Versions
- See git history for detailed changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Acknowledgments

- Telegram Bot API
- Telegraf.js framework
- SQLite database
- Node.js community

---

**For technical support, contact: @your_support_channel**