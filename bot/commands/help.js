import { isUserVerified, isUserAdmin } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleHelp(ctx) {
  try {
    const userId = ctx.from.id;
    const verified = await isUserVerified(userId);
    const isAdmin = await isUserAdmin(userId);

    let message = `🆘 *${escapeMarkdownV2('دليل استخدام بوت معين المجتهدين')}*\n`;
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `📚 *${escapeMarkdownV2('مرحبًا بك في بوت إدارة الدورات!')}*\n\n`;
    message += `🌐 *${escapeMarkdownV2('أوامر عامة (متاحة للجميع):')}*\n`;
    message += `• 🏠 /start - ${escapeMarkdownV2('بدء الاستخدام وتسجيل الحساب')}\n`;
    message += `• 🔑 /verify كود_التفعيل - ${escapeMarkdownV2('تفعيل الحساب (مثال: /verify free_palestine1447)')}\n`;
    message += `• ℹ️ /help - ${escapeMarkdownV2('عرض هذا الدليل')}\n\n`;
    if (verified) {
      message += `👤 *${escapeMarkdownV2('أوامر المستخدم المفعل:')}*\n`;
      message += `• 📋 /profile - ${escapeMarkdownV2('عرض ملفك الشخصي')}\n`;
      message += `• 📅 /attendance رقم_الدرس - ${escapeMarkdownV2('تسجيل الحضور (مثال: /attendance 1)')}\n`;
      message += `• 📝 /submit رقم_الواجب الإجابة - ${escapeMarkdownV2('إرسال إجابة (مثال: /submit 1 إجابتي)')}\n`;
      message += `• 📚 /courses - ${escapeMarkdownV2('قائمة الدروس')}\n`;
      message += `• 📋 /assignments - ${escapeMarkdownV2('قائمة الواجبات')}\n`;
      message += `• 🔔 /reminders - ${escapeMarkdownV2('تفعيل/إيقاف التذكيرات')}\n`;
      message += `• ⏰ /addreminder التاريخ_الوقت الرسالة - ${escapeMarkdownV2('إضافة تذكير مخصص')}\n`;
      message += `• 💬 /feedback رسالتك - ${escapeMarkdownV2('إرسال تغذية راجعة')}\n`;
      message += `• ⚙️ /settings - ${escapeMarkdownV2('إعدادات المستخدم')}\n`;
      message += `• ❓ /faq - ${escapeMarkdownV2('الأسئلة الشائعة')}\n\n`;
    } else {
      message += `🔒 *${escapeMarkdownV2('يجب التفعيل أولاً (استخدم /verify):')}*\n\n`;
    }
    if (isAdmin) {
      message += `⚙️ *${escapeMarkdownV2('أوامر المدير:')}*\n`;
      message += `• 📊 /stats - ${escapeMarkdownV2('عرض إحصائيات البوت')}\n`;
      message += `• 📢 /publish نص_الإعلان - ${escapeMarkdownV2('نشر إعلان (مثال: /publish الدرس القادم غدًا)')}\n`;
      message += `• 📊 /export نوع_البيانات - ${escapeMarkdownV2('تصدير البيانات (attendance/assignments)')}\n`;
      message += `• 📬 /viewfeedback - ${escapeMarkdownV2('عرض التغذية الراجعة')}\n`;
      message += `• 🗑️ /deletecourse رقم_الكورس - ${escapeMarkdownV2('حذف الكورس')}\n`;
      message += `• 📝 إدارة الواجبات: /addassignment, /updateassignment, /deleteassignment\n\n`;
    }
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `💡 *${escapeMarkdownV2('نصائح:')}*\n`;
    message += `- ${escapeMarkdownV2('احفظ كود التفعيل بأمان')}\n`;
    message += `- ${escapeMarkdownV2('تابع مواعيد الدروس والواجبات')}\n`;
    message += `- ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)} ${escapeMarkdownV2('للدعم')}\n\n`;
    message += `🤖 *${escapeMarkdownV2('بوت معين المجتهدين - v2.0.0')}*\n`;
    message += `📅 *${escapeMarkdownV2('آخر تحديث:')}* ${escapeMarkdownV2(new Date().toLocaleDateString('ar-SA'))}`;

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[HELP] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}