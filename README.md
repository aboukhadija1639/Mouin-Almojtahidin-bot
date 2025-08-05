# 🤖 Mouin Almojtahidin Bot

A comprehensive Telegram bot for educational course management, built with **Telegraf**, **SQLite**, and **Node.js**. The bot focuses on robust reminder functionality with admin-controlled features for managing courses, assignments, and user interactions.

## ✨ Features

### 🎯 Core Functionality
- **Reminder System**: Advanced reminder management with group and DM notifications
- **User Management**: Verification system with admin-controlled access
- **Course Management**: Complete course and lesson administration
- **Assignment System**: Create, manage, and track assignments with automatic grading
- **Attendance Tracking**: Monitor student participation in lessons

### 📱 User Commands
- `/start` - Welcome message with interactive buttons
- `/verify <code>` - Account verification with admin-provided codes
- `/help` - Comprehensive command guide
- `/faq` - Frequently asked questions
- `/profile` - View personal profile and statistics
- `/courses` - List available courses and lessons
- `/assignments` - View active assignments
- `/attendance <lesson_id>` - Mark attendance for lessons
- `/submit <assignment_id> <answer>` - Submit assignment answers
- `/reminders` - Toggle reminder notifications
- `/addreminder <datetime> <message>` - Create custom reminders
- `/listreminders` - View active personal reminders
- `/deletereminder <id>` - Delete specific reminders
- `/upcominglessons` - Show lessons scheduled for next 7 days
- `/feedback <message>` - Send feedback to administrators
- `/reportbug <description>` - Report technical issues
- `/settings` - Manage user preferences (language, notifications)

### 👨‍💼 Admin Commands
- `/stats` - View bot statistics and analytics
- `/publish <message>` - Send announcements to all verified users
- `/broadcast <group|users> <message>` - Mass messaging system
- `/addassignment <course_id> <title> <question> <answer> <deadline>` - Create assignments
- `/updateassignment <id> <field> <value>` - Modify existing assignments
- `/deleteassignment <id>` - Remove assignments (with dependency handling)
- `/deletecourse <id>` - Remove courses
- `/export <type>` - Export data (attendance/assignments)
- `/viewfeedback` - Review user feedback

### 🔧 Technical Features
- **MarkdownV2 Support**: Proper escaping of all reserved characters
- **Database Integrity**: Foreign key constraints with CASCADE handling
- **Robust Launch**: Exponential backoff retry with webhook fallback
- **Input Validation**: Comprehensive security measures
- **Rate Limiting**: Built-in protection against spam
- **Localization**: Arabic/English language support
- **Error Reporting**: Comprehensive logging and bug tracking

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: Version 22.15.0 or higher
- **npm**: Version 10.0.0 or higher
- **Telegram Bot Token**: Obtain from [@BotFather](https://t.me/BotFather)

### 1. Clone Repository
```bash
git clone <repository-url>
cd mouin-almojtahidin-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:

```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here

# Admin Configuration
ADMIN_USER_IDS=123456789,987654321  # Comma-separated admin user IDs
ADMIN_CHAT_ID=-1001234567890        # Main group chat ID (optional)

# Verification
VERIFICATION_CODE=your_verification_code_here

# Support
SUPPORT_CHANNEL=@your_support_channel

# Webhook (optional - for production)
WEBHOOK_URL=https://your-domain.com/bot
PORT=3000

# Database
DATABASE_PATH=./data/mouin_almojtahidin.db
```

### 4. Database Setup
The bot automatically creates the SQLite database and tables on first run:

```bash
npm run start
```

### 5. Development
For development with auto-restart:

```bash
npm run dev
```

## 🔧 Configuration

### Admin Setup
1. Get your Telegram user ID by messaging [@userinfobot](https://t.me/userinfobot)
2. Add your user ID to `ADMIN_USER_IDS` in the `.env` file
3. Restart the bot

### Group Integration
1. Add the bot to your main group
2. Make the bot an administrator
3. Get the group chat ID using `/getChatId` command
4. Add the chat ID to `ADMIN_CHAT_ID` in the `.env` file

### Verification System
1. Set a secure verification code in `VERIFICATION_CODE`
2. Share this code with students for account activation
3. Only verified users can access most bot features

## 📚 Database Schema

### Tables
- **users**: User profiles and preferences
- **courses**: Course information
- **lessons**: Individual lesson details
- **assignments**: Assignment data with deadlines
- **submissions**: Student assignment submissions
- **attendance**: Lesson attendance records
- **custom_reminders**: User-created reminders
- **feedback**: User feedback and admin responses
- **bugs**: Bug reports and resolution tracking
- **announcements**: Published announcements

### Key Features
- Foreign key constraints with CASCADE delete
- Automatic timestamp tracking
- User language preferences
- Reminder status tracking

## 🚀 Deployment

### Option 1: Traditional Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start the bot
pm2 start index.js --name mouin-bot

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
# Build image
docker build -t mouin-bot .

# Run container
docker run -d --name mouin-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -p 3000:3000 \
  mouin-bot
```

### Option 3: Heroku
1. Create a new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Webhook Mode (Production)
For production deployment, use webhook mode:

1. Set `WEBHOOK_URL` in environment variables
2. The bot will automatically fall back to webhook if polling fails
3. Ensure your server is accessible via HTTPS

## 🔒 Security Features

### Input Validation
- All user inputs are sanitized and validated
- SQL injection prevention
- Command argument validation
- Rate limiting protection

### Access Control
- Admin-only commands with verification
- User verification system
- Secure database operations with transactions

### Error Handling
- Comprehensive error logging
- Graceful degradation
- User-friendly error messages

## 📊 Monitoring & Maintenance

### Logs
- **Combined logs**: `./data/combined.log`
- **Error logs**: `./data/error.log`
- **Database**: `./data/mouin_almojtahidin.db`

### Health Checks
- `/health` endpoint (webhook mode)
- Bot status monitoring
- Database connection verification

### Backup
Regular database backups recommended:
```bash
# Backup database
cp ./data/mouin_almojtahidin.db ./backups/backup-$(date +%Y%m%d).db

# Backup logs
tar -czf ./backups/logs-$(date +%Y%m%d).tar.gz ./data/*.log
```

## 🛠️ Development

### Project Structure
```
mouin-almojtahidin-bot/
├── bot/
│   ├── commands/          # Command handlers
│   ├── middlewares/       # Bot middlewares
│   └── utils/            # Utility functions
├── data/                 # Database and logs
├── test/                # Test files
├── config.js            # Configuration
├── index.js             # Main bot file
└── package.json         # Dependencies
```

### Adding New Commands
1. Create command handler in `bot/commands/`
2. Import and register in `index.js`
3. Add to help command documentation
4. Update README

### Testing
```bash
npm test
```

## 🐛 Troubleshooting

### Common Issues

**Bot not responding:**
- Check BOT_TOKEN is correct
- Verify bot is not blocked
- Check network connectivity

**Database errors:**
- Ensure write permissions to `./data/` directory
- Check disk space
- Verify SQLite installation

**Webhook issues:**
- Ensure HTTPS is properly configured
- Check webhook URL accessibility
- Verify port configuration

**Path issues with spaces:**
- Move project to path without spaces
- Use quotes around paths in scripts

### Getting Help
- Check logs in `./data/error.log`
- Use `/reportbug` command for technical issues
- Contact support channel specified in configuration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support and questions:
- Use the `/feedback` command in the bot
- Report bugs with `/reportbug`
- Contact the support channel configured in your bot

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintained by**: Mouin Almojtahidin Team