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
    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;

    // Basic commands for all users
    message += `📋 ${bold('الأوامر الأساسية:')}\n\n`;
    message += `• ${code('/start')} \\- ${escapeMarkdownV2('بدء استخدام البوت')}\n`;
    message += `• ${code('/help')} \\- ${escapeMarkdownV2('عرض هذه المساعدة')}\n`;
    message += `• ${code('/faq')} \\- ${escapeMarkdownV2('الأسئلة الشائعة')}\n`;
    message += `• ${code('/profile')} \\- ${escapeMarkdownV2('عرض ملفك الشخصي')}\n`;
    if (!isVerified) {
      message += `• ${code('/verify <كود>')} \\- ${escapeMarkdownV2('تفعيل حسابك')}\n`;
    }
    message += `\n`;

    // Commands for verified users
    if (isVerified) {
      message += `✅ ${bold('أوامر المستخدمين المفعلين:')}\n\n`;
      message += `• ${code('/courses')} \\- ${escapeMarkdownV2('عرض الدورات المتاحة')}\n`;
      message += `• ${code('/assignments')} \\- ${escapeMarkdownV2('عرض الواجبات')}\n`;
      message += `• ${code('/submit')} \\- ${escapeMarkdownV2('إرسال إجابة واجب')}\n`;
      message += `• ${code('/attendance')} \\- ${escapeMarkdownV2('تسجيل الحضور')}\n`;
      message += `• ${code('/stats')} \\- ${escapeMarkdownV2('إحصائياتك الشخصية')}\n`;
      message += `• ${code('/settings')} \\- ${escapeMarkdownV2('إعدادات الحساب')}\n\n`;
      message += `⏰ ${bold('أوامر التذكيرات:')}\n\n`;
      message += `• ${code('/addreminder')} \\- ${escapeMarkdownV2('إضافة تذكير شخصي')}\n`;
      message += `• ${code('/listreminders')} \\- ${escapeMarkdownV2('عرض تذكيراتك')}\n`;
      message += `• ${code('/deletereminder')} \\- ${escapeMarkdownV2('حذف تذكير')}\n`;
      message += `• ${code('/upcominglessons')} \\- ${escapeMarkdownV2('الدروس القادمة')}\n\n`;
    }

    // Admin commands
    if (isAdmin) {
      message += `👑 ${bold('أوامر الإدارة:')}\n\n`;
      message += `• ${code('/broadcast')} \\- ${escapeMarkdownV2('إرسال رسالة جماعية')}\n`;
      message += `• ${code('/courseadmin')} \\- ${escapeMarkdownV2('إدارة الدورات')}\n`;
      message += `• ${code('/export')} \\- ${escapeMarkdownV2('تصدير البيانات')}\n`;
      message += `• ${code('/publish')} \\- ${escapeMarkdownV2('نشر إعلان')}\n\n`;
    }

    // Support and feedback
    message += `🛠️ ${bold('الدعم والتطوير:')}\n\n`;
    message += `• ${code('/reportbug')} \\- ${escapeMarkdownV2('الإبلاغ عن مشكلة')}\n`;
    message += `• ${code('/feedback')} \\- ${escapeMarkdownV2('إرسال اقتراح أو رأي')}\n\n`;
    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n`;

    if (!isVerified) {
      message += `🔒 ${bold('تنبيه:')}\n`;
      message += `${escapeMarkdownV2('بعض الأوامر تتطلب تفعيل الحساب أولاً.')}\n`;
      message += `${escapeMarkdownV2('استخدم')} ${code('/verify <كود>')} ${escapeMarkdownV2('للتفعيل.')}\n\n`;
    }

    message += `💡 ${bold('نصائح مهمة:')}\n`;
    message += `• ${escapeMarkdownV2('استخدم الأوامر بالصيغة الصحيحة')}\n`;
    message += `• ${escapeMarkdownV2('تأكد من تفعيل التذكيرات في الإعدادات')}\n`;
    message += `• ${escapeMarkdownV2('راجع الأسئلة الشائعة للمساعدة السريعة')}\n\n`;
    message += `📞 ${bold('تحتاج مساعدة إضافية؟')}\n`;
    message += `${escapeMarkdownV2('تواصل معنا:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    message += `🤖 ${italic('بوت معين المجتهدين - نسخة 2.0')}`;

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('خطأ في أمر /help:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء عرض المساعدة')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}