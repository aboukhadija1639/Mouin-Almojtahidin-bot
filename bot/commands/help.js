// bot/commands/help.js
import { getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleHelp(ctx) {
  try {
    const userId = ctx.from?.id;

    // Get user language
    const userLanguage = await getUserLanguage(userId).catch(() => 'ar') || 'ar';

    // Define bilingual help content
    const helpContent = {
      ar: {
        title: 'دليل المساعدة الشامل',
        publicCommands: 'الأوامر العامة:',
        userCommands: 'أوامر المستخدم:',
        adminCommands: 'أوامر المدير:',
        commands: {
          start: 'بدء استخدام البوت',
          verify: 'تفعيل الحساب',
          help: 'عرض هذا الدليل',
          faq: 'الأسئلة الشائعة',
          profile: 'عرض الملف الشخصي',
          courses: 'قائمة الدروس',
          assignments: 'قائمة الواجبات',
          attendance: 'تسجيل الحضور',
          reminders: 'إدارة التذكيرات',
          submit: 'إرسال إجابة واجب',
          addreminder: 'إضافة تذكير مخصص',
          listreminders: 'عرض التذكيرات',
          deletereminder: 'حذف تذكير',
          upcominglessons: 'الدروس القادمة',
          feedback: 'إرسال تغذية راجعة',
          reportbug: 'الإبلاغ عن مشكلة',
          settings: 'إعدادات المستخدم',
          health: 'حالة النظام',
          stats: 'عرض الإحصائيات',
          publish: 'نشر إعلان',
          addassignment: 'إضافة واجب',
          updateassignment: 'تحديث واجب',
          deleteassignment: 'حذف واجب',
          addcourse: 'إضافة كورس',
          updatecourse: 'تحديث كورس',
          deletecourse: 'حذف كورس',
          export: 'تصدير البيانات',
          viewfeedback: 'عرض التغذية الراجعة',
          broadcast: 'إرسال رسالة جماعية'
        },
        usage: 'الاستخدام:',
        examples: 'أمثلة:',
        support: 'للدعم والمساعدة:',
        moreInfo: 'لمزيد من المعلومات حول أمر معين، استخدم',
        withCommand: 'مع الأمر'
      },
      en: {
        title: 'Comprehensive Help Guide',
        publicCommands: 'Public Commands:',
        userCommands: 'User Commands:',
        adminCommands: 'Admin Commands:',
        commands: {
          start: 'Start using the bot',
          verify: 'Activate account',
          help: 'Show this guide',
          faq: 'Frequently asked questions',
          profile: 'View profile',
          courses: 'List courses',
          assignments: 'List assignments',
          attendance: 'Mark attendance',
          reminders: 'Manage reminders',
          submit: 'Submit assignment answer',
          addreminder: 'Add custom reminder',
          listreminders: 'List reminders',
          deletereminder: 'Delete reminder',
          upcominglessons: 'Upcoming lessons',
          feedback: 'Send feedback',
          reportbug: 'Report a problem',
          settings: 'User settings',
          health: 'System status',
          stats: 'View statistics',
          publish: 'Publish announcement',
          addassignment: 'Add assignment',
          updateassignment: 'Update assignment',
          deleteassignment: 'Delete assignment',
          addcourse: 'Add course',
          updatecourse: 'Update course',
          deletecourse: 'Delete course',
          export: 'Export data',
          viewfeedback: 'View feedback',
          broadcast: 'Send broadcast message'
        },
        usage: 'Usage:',
        examples: 'Examples:',
        support: 'For support and assistance:',
        moreInfo: 'For more information about a specific command, use',
        withCommand: 'with the command'
      }
    };

    const content = helpContent[userLanguage] || helpContent.ar;

    let message = `🆘 ${bold(content.title)}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Public Commands
    message += `🌐 ${bold(content.publicCommands)}\n`;
    message += `• ${code('/start')} \\- ${escapeMarkdownV2(content.commands.start)}\n`;
    message += `• ${code('/verify')} \\- ${escapeMarkdownV2(content.commands.verify)}\n`;
    message += `• ${code('/help')} \\- ${escapeMarkdownV2(content.commands.help)}\n`;
    message += `• ${code('/faq')} \\- ${escapeMarkdownV2(content.commands.faq)}\n\n`;

    // User Commands
    message += `👤 ${bold(content.userCommands)}\n`;
    message += `• ${code('/profile')} \\- ${escapeMarkdownV2(content.commands.profile)}\n`;
    message += `• ${code('/courses')} \\- ${escapeMarkdownV2(content.commands.courses)}\n`;
    message += `• ${code('/assignments')} \\- ${escapeMarkdownV2(content.commands.assignments)}\n`;
    message += `• ${code('/attendance')} \\- ${escapeMarkdownV2(content.commands.attendance)}\n`;
    message += `• ${code('/submit')} \\- ${escapeMarkdownV2(content.commands.submit)}\n`;
    message += `• ${code('/reminders')} \\- ${escapeMarkdownV2(content.commands.reminders)}\n`;
    message += `• ${code('/addreminder')} \\- ${escapeMarkdownV2(content.commands.addreminder)}\n`;
    message += `• ${code('/listreminders')} \\- ${escapeMarkdownV2(content.commands.listreminders)}\n`;
    message += `• ${code('/deletereminder')} \\- ${escapeMarkdownV2(content.commands.deletereminder)}\n`;
    message += `• ${code('/upcominglessons')} \\- ${escapeMarkdownV2(content.commands.upcominglessons)}\n`;
    message += `• ${code('/feedback')} \\- ${escapeMarkdownV2(content.commands.feedback)}\n`;
    message += `• ${code('/reportbug')} \\- ${escapeMarkdownV2(content.commands.reportbug)}\n`;
    message += `• ${code('/settings')} \\- ${escapeMarkdownV2(content.commands.settings)}\n`;
    message += `• ${code('/health')} \\- ${escapeMarkdownV2(content.commands.health)}\n\n`;

    // Admin Commands
    message += `⚙️ ${bold(content.adminCommands)}\n`;
    message += `• ${code('/stats')} \\- ${escapeMarkdownV2(content.commands.stats)}\n`;
    message += `• ${code('/publish')} \\- ${escapeMarkdownV2(content.commands.publish)}\n`;
    message += `• ${code('/broadcast')} \\- ${escapeMarkdownV2(content.commands.broadcast)}\n`;
    message += `• ${code('/export')} \\- ${escapeMarkdownV2(content.commands.export)}\n`;
    message += `• ${code('/viewfeedback')} \\- ${escapeMarkdownV2(content.commands.viewfeedback)}\n`;
    message += `• ${code('/addassignment')} \\- ${escapeMarkdownV2(content.commands.addassignment)}\n`;
    message += `• ${code('/updateassignment')} \\- ${escapeMarkdownV2(content.commands.updateassignment)}\n`;
    message += `• ${code('/deleteassignment')} \\- ${escapeMarkdownV2(content.commands.deleteassignment)}\n`;
    message += `• ${code('/addcourse')} \\- ${escapeMarkdownV2(content.commands.addcourse)}\n`;
    message += `• ${code('/updatecourse')} \\- ${escapeMarkdownV2(content.commands.updatecourse)}\n`;
    message += `• ${code('/deletecourse')} \\- ${escapeMarkdownV2(content.commands.deletecourse)}\n\n`;

    // Examples
    message += `💡 ${bold(content.examples)}\n`;
    message += `• ${code('/verify ABC123')}\n`;
    message += `• ${code('/attendance 1')}\n`;
    message += `• ${code('/submit 1 "my answer"')}\n`;
    message += `• ${code('/addreminder "2024-01-20 10:00" "درس مهم"')}\n\n`;

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💬 ${bold(content.support)} ${escapeMarkdownV2(config.admin.supportChannel)}`;

    await ctx.reply(
      message,
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );

  } catch (err) {
    logError(err, 'COMMAND_HELP');
    
    const userLanguage = await getUserLanguage(ctx.from?.id).catch(() => 'ar') || 'ar';
    const errorMessages = {
      ar: 'حدث خطأ، حاول مرة أخرى أو تواصل مع الدعم',
      en: 'An error occurred, try again or contact support'
    };

    await ctx.reply(
      error(errorMessages[userLanguage] || errorMessages.ar),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );
  }
}