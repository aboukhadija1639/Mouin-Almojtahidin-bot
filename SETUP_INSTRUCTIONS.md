# Mouin-Almojtahidin-bot Setup Instructions

## Overview
This document provides complete setup and testing instructions for the fixed and enhanced Mouin-Almojtahidin-bot.

## Issues Fixed

### 1. MarkdownV2 Parsing Errors ✅
- **Issue**: Commands /start, /help, /faq, and /reminders failed with 400: Bad Request due to unescaped reserved characters
- **Fix**: Updated `bot/utils/escapeMarkdownV2.js` to properly escape all MarkdownV2 reserved characters
- **Files Modified**: `bot/utils/escapeMarkdownV2.js`, `bot/commands/faq.js`, `bot/commands/courses.js`

### 2. Non-Iterable Errors ✅
- **Issue**: `lessons is not iterable` in reminders.js and courses.js due to inconsistent database return format
- **Fix**: Updated database functions to return consistent `{success, data}` format
- **Files Modified**: `bot/utils/database.js`, `bot/utils/reminders.js`, `bot/commands/courses.js`, `bot/commands/upcominglessons.js`

### 3. Profile and Verification Issues ✅
- **Issue**: /profile showed incorrect data, verification status issues
- **Fix**: Database functions now properly handle user data and verification status
- **Files Modified**: `bot/utils/database.js`, improved user data handling

### 4. Bot Launch Timeout ✅
- **Issue**: Bot launch timed out after 90 seconds
- **Fix**: Reduced timeout to 30 seconds and optimized initialization
- **Files Modified**: `index.js`

### 5. Missing Commands ✅
- **Issue**: /listreminders, /reportbug, and admin commands not properly implemented
- **Fix**: All commands are now properly registered and implemented
- **Files Added**: `bot/commands/addcourse.js`, `bot/commands/updatecourse.js`
- **Files Modified**: `index.js`, `bot/utils/database.js`

## Project Setup

### 1. Move Project (Recommended)
Move the project from the space-containing path to:
```bash
# Windows
C:/Users/mouss/Projects/Mouin-Almojtahidin-bot

# Linux/Mac
~/Projects/Mouin-Almojtahidin-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create or update your `.env` file with:
```env
# Bot Token (required)
BOT_TOKEN=your_telegram_bot_token_here

# Activation Code (required)
ACTIVATION_CODE=free_palestine1447

# Support Channel (required)
SUPPORT_CHANNEL=@your_support_channel

# Admin User IDs (comma-separated)
ADMIN_USER_IDS=123456789,987654321

# Optional: Admin Chat ID for notifications
ADMIN_CHAT_ID=your_admin_chat_id

# Optional: Webhook URL for deployment
WEBHOOK_URL=https://your-domain.com/bot
```

### 4. Database Setup
The database will be automatically created when you first run the bot. To populate with test data:

```bash
# Option 1: Use the setup script
node setup_test.js

# Option 2: Manual SQL import (if you have sqlite3 CLI)
sqlite3 data/mouin_almojtahidin.db < test_data.sql
```

### 5. Start the Bot
```bash
npm start
```

## Testing Instructions

### Public Commands (No verification required)
Test these commands with any Telegram account:

```
/start - Register user and show welcome message
/help - Display comprehensive help guide
/faq - Show frequently asked questions
/verify free_palestine1447 - Verify user account
```

### User Commands (Requires verification)
After verification, test these commands:

```
/profile - Show user profile information
/courses - List all available courses and lessons
/assignments - Show active and expired assignments
/upcominglessons - List lessons in next 7 days
/attendance 1 - Record attendance for lesson ID 1
/submit 1 55 - Submit answer "55" for assignment ID 1
/reminders - Enable/disable reminders
/listreminders - List all user reminders
/settings - Update language and preferences
/reportbug - Report issues to support channel
```

### Admin Commands (Requires admin privileges)
Test with admin user IDs from .env:

```
/stats - Display bot statistics
/addcourse "Math 101" "Basic mathematics" - Create new course
/updatecourse 1 name "Advanced Math" - Update course field
/deletecourse 1 - Delete course
/addassignment 1 "Test Question" "What is 2+2?" "4" "2024-12-31 23:59:59" - Add assignment
/updateassignment 1 title "Updated Question" - Update assignment
/deleteassignment 1 - Delete assignment
/publish "Important announcement" - Publish announcement
/broadcast users "Message to all users" - Broadcast message
/export attendance - Export attendance data
/viewfeedback - View user feedback
```

## Verification Steps

### 1. Database Population
Verify test data was loaded correctly:
- 4 courses (Math, Physics, Chemistry, Islamic History)
- 15 lessons across different dates
- 10 assignments with various deadlines
- 4 sample users including admin

### 2. MarkdownV2 Formatting
All messages should display properly without parsing errors. Look for:
- Proper bold/italic formatting
- Escaped special characters
- Clean message layout

### 3. Error Handling
Test error scenarios:
- Invalid command syntax
- Non-existent IDs
- Unauthorized access to admin commands
- Network/database errors

### 4. Reminder System
Test reminder functionality:
- Check if reminders are scheduled for upcoming lessons
- Verify reminder messages are sent
- Test custom reminder addition/deletion

### 5. Log Files
Check log files for proper operation:
```bash
# View combined logs
tail -f data/combined.log

# View error logs
tail -f data/error.log
```

## Database Schema

The bot uses SQLite with the following tables:

- **users**: User information and verification status
- **courses**: Course catalog with descriptions
- **lessons**: Scheduled lessons with Zoom links
- **assignments**: Homework assignments with deadlines
- **submissions**: Student assignment submissions
- **attendance**: Lesson attendance records
- **announcements**: Published announcements
- **custom_reminders**: User-created reminders

## Command List Summary

### Public Commands (9)
- /start, /verify, /help, /faq, /profile, /courses, /assignments, /upcominglessons, /settings

### User Commands (8)
- /attendance, /submit, /reminders, /listreminders, /reportbug, /feedback

### Admin Commands (13)
- /stats, /publish, /broadcast, /addcourse, /updatecourse, /deletecourse
- /addassignment, /updateassignment, /deleteassignment, /export, /viewfeedback

## Troubleshooting

### Common Issues

1. **Bot doesn't start**
   - Check BOT_TOKEN in .env
   - Verify network connectivity
   - Check for port conflicts

2. **Commands return errors**
   - Verify user verification status
   - Check admin user IDs
   - Review log files for specific errors

3. **Database issues**
   - Ensure data directory exists
   - Check file permissions
   - Verify SQLite installation

4. **MarkdownV2 errors**
   - All special characters should be escaped
   - Use escapeMarkdownV2 function consistently
   - Test messages in small batches

### Support

For additional help:
- Check log files in `data/` directory
- Review bot responses for error messages
- Contact support channel specified in .env

## Production Deployment

For production deployment:
1. Use webhook mode instead of polling
2. Set up proper SSL certificates
3. Configure environment variables securely
4. Set up log rotation
5. Monitor bot performance
6. Regular database backups

## Security Notes

- Never commit .env file to version control
- Regularly rotate bot token
- Monitor admin access logs
- Validate all user inputs
- Use rate limiting to prevent abuse
- Keep dependencies updated