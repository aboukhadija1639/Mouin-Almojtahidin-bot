// bot/commands/help.js
import { isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { templates, welcomeTemplates } from '../utils/messageTemplates.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handleHelp(ctx) {
  try {
    const userId = ctx.from.id;
    const userData = await isUserVerified(userId);
    const isVerified = userData?.verified || false;
    const isAdmin = config.admin.userIds.includes(userId);

    // Use the professional help template as base
    let message = welcomeTemplates.help();

    // Add admin commands if user is admin
    if (isAdmin) {
      message += `\n\n👑 ${bold('أوامر الإدارة:')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `• ${code('/addcourse')} \\- إضافة دورة جديدة\n`;
      message += `• ${code('/addassignment')} \\- إضافة واجب جديد\n`;
      message += `• ${code('/updateassignment')} \\- تحديث واجب\n`;
      message += `• ${code('/deleteassignment')} \\- حذف واجب\n`;
      message += `• ${code('/publish')} \\- نشر إعلان\n`;
      message += `• ${code('/broadcast')} \\- إرسال رسالة جماعية\n`;
      message += `• ${code('/export')} \\- تصدير البيانات\n`;
      message += `• ${code('/courseadmin')} \\- إدارة الدورات\n\n`;
    }

    // Add verification status info
    if (!isVerified) {
      message += `\n\n🔑 ${bold('تنبيه مهم:')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🔒 حسابك غير مفعل حالياً\n`;
      message += `بعض الأوامر تتطلب تفعيل الحساب أولاً\n`;
      message += `📞 ${bold('للتفعيل:')} استخدم ${code('/verify <كود>')} أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}\n\n`;
    } else {
      message += `\n\n✅ ${bold('معلومات حسابك:')}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🎉 حسابك مفعل \\- جميع الميزات متاحة!\n`;
      message += `📊 يمكنك الوصول إلى جميع الدورات والواجبات\n\n`;
    }

    // Add professional footer
    message += `💡 ${bold('نصائح مهمة:')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• استخدم الأزرار السريعة بدلاً من كتابة الأوامر\n`;
    message += `• فعل التذكيرات في الإعدادات للحصول على تنبيهات\n`;
    message += `• راجع ${code('/faq')} للأسئلة الشائعة\n`;
    message += `• استخدم ${code('/profile')} لمراقبة تقدمك\n\n`;

    message += `📞 ${bold('هل تحتاج مساعدة إضافية؟')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆘 ${bold('الدعم الفني:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n`;
    message += `📧 ${bold('التقارير:')} استخدم ${code('/reportbug')} للمشاكل التقنية\n`;
    message += `💬 ${bold('الاقتراحات:')} استخدم ${code('/feedback')} لإرسال آرائك\n\n`;
    
    message += `🤖 ${italic('بوت معين المجتهدين')} \\- ${italic('نسخة محسنة 2\\.1')}`;

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });

  } catch (error) {
    console.error('خطأ في أمر /help:', error);
    await ctx.reply(
      templates.error(
        'حدث خطأ أثناء عرض المساعدة',
        'تعذر تحميل صفحة المساعدة في الوقت الحالي',
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}