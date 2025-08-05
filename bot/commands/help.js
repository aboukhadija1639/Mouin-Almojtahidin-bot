// bot/commands/help.js
import { isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handleHelp(ctx) {
  try {
    const userId = ctx.from.id;
    const userData = await isUserVerified(userId);
    const isVerified = userData?.verified || false;
    const isAdmin = config.admin.userIds.includes(userId);

    let message = `🆘 ${bold('مساعدة بوت معين المجتهدين')}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Basic commands for all users
    message += `📋 ${bold('الأوامر الأساسية:')}\n\n`;
    message += `• ${code('/start')} \\- بدء استخدام البوت\n`;
    message += `• ${code('/help')} \\- عرض هذه المساعدة\n`;
    message += `• ${code('/faq')} \\- الأسئلة الشائعة\n`;
    message += `• ${code('/profile')} \\- عرض ملفك الشخصي\n`;
    
    if (!isVerified) {
      message += `• ${code('/verify <كود>')} \\- تفعيل حسابك\n`;
    }
    
    message += `\n`;

    // Commands for verified users
    if (isVerified) {
      message += `✅ ${bold('أوامر المستخدمين المفعلين:')}\n\n`;
      message += `• ${code('/courses')} \\- عرض الدورات المتاحة\n`;
      message += `• ${code('/assignments')} \\- عرض الواجبات\n`;
      message += `• ${code('/submit')} \\- إرسال إجابة واجب\n`;
      message += `• ${code('/attendance')} \\- تسجيل الحضور\n`;
      message += `• ${code('/stats')} \\- إحصائياتك الشخصية\n`;
      message += `• ${code('/settings')} \\- إعدادات الحساب\n\n`;

      message += `⏰ ${bold('أوامر التذكيرات:')}\n\n`;
      message += `• ${code('/addreminder')} \\- إضافة تذكير شخصي\n`;
      message += `• ${code('/listreminders')} \\- عرض تذكيراتك\n`;
      message += `• ${code('/deletereminder')} \\- حذف تذكير\n`;
      message += `• ${code('/upcominglessons')} \\- الدروس القادمة\n\n`;
    }

    // Admin commands
    if (isAdmin) {
      message += `👑 ${bold('أوامر الإدارة:')}\n\n`;
      message += `• ${code('/broadcast')} \\- إرسال رسالة جماعية\n`;
      message += `• ${code('/courseadmin')} \\- إدارة الدورات\n`;
      message += `• ${code('/export')} \\- تصدير البيانات\n`;
      message += `• ${code('/publish')} \\- نشر إعلان\n\n`;
    }

    // Support and feedback
    message += `🛠️ ${bold('الدعم والتطوير:')}\n\n`;
    message += `• ${code('/reportbug')} \\- الإبلاغ عن مشكلة\n`;
    message += `• ${code('/feedback')} \\- إرسال اقتراح أو رأي\n\n`;

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (!isVerified) {
      message += `🔒 ${bold('تنبيه:')}\n`;
      message += `بعض الأوامر تتطلب تفعيل الحساب أولاً\\.\n`;
      message += `استخدم ${code('/verify <كود>')} للتفعيل\\.\n\n`;
    }

    message += `💡 ${bold('نصائح مهمة:')}\n`;
    message += `• استخدم الأوامر بالصيغة الصحيحة\n`;
    message += `• تأكد من تفعيل التذكيرات في الإعدادات\n`;
    message += `• راجع الأسئلة الشائعة للمساعدة السريعة\n\n`;

    message += `📞 ${bold('تحتاج مساعدة إضافية؟')}\n`;
    message += `تواصل معنا: ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    
    message += `🤖 ${italic('بوت معين المجتهدين \\- نسخة 2\\.0')}`;

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });

  } catch (error) {
    console.error('خطأ في أمر /help:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء عرض المساعدة')}\n\n` +
      `حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}