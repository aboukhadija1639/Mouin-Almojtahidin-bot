// bot/commands/help.js
import { isUserVerified, isUserAdmin } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleHelp(ctx) {
  try {
    console.log('Processing /help command for user:', ctx.from.id);
    const userId = ctx.from.id;
    const verified = await isUserVerified(userId);
    console.log('User verification status:', verified);
    const isAdmin = await isUserAdmin(userId);
    console.log('User admin status:', isAdmin);

    let message = escapeMarkdownV2(
      `🆘 *دليل استخدام بوت معين المجتهدين*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📚 *مرحبًا بك في بوت إدارة الدورات!*\n\n` +
      `🌐 *أوامر عامة (متاحة للجميع):*\n` +
      `• 🏠 /start \\- بدء الاستخدام وتسجيل الحساب\n` +
      `• 🔑 /verify كود_التفعيل \\- تفعيل الحساب (مثال: /verify free_palestine1447)\n` +
      `• ℹ️ /help \\- عرض هذا الدليل\n` +
      `• ❓ /faq \\- الأسئلة الشائعة\n\n`
    );

    if (verified?.verified) {
      message += escapeMarkdownV2(
        `👤 *أوامر المستخدم المفعل:*\n` +
        `• 📋 /profile \\- عرض ملفك الشخصي\n` +
        `• 📅 /attendance رقم_الدرس \\- تسجيل الحضور (مثال: /attendance 1)\n` +
        `• 📝 /submit رقم_الواجب الإجابة \\- إرسال إجابة (مثال: /submit 1 إجابتي)\n` +
        `• 📚 /courses \\- قائمة الدروس\n` +
        `• 📋 /assignments \\- قائمة الواجبات\n` +
        `• 🔔 /reminders \\- تفعيل/إيقاف التذكيرات\n` +
        `• ⏰ /addreminder التاريخ_الوقت الرسالة \\- إضافة تذكير مخصص\n` +
        `• 📋 /listreminders \\- عرض التذكيرات النشطة\n` +
        `• 🗑️ /deletereminder رقم_ID \\- حذف تذكير محدد\n` +
        `• 📅 /upcominglessons \\- الدروس القادمة (7 أيام)\n` +
        `• 💬 /feedback رسالتك \\- إرسال تغذية راجعة\n` +
        `• 🐛 /reportbug وصف_المشكلة \\- الإبلاغ عن خطأ\n` +
        `• ⚙️ /settings \\- إعدادات المستخدم\n`
      );
    } else {
      message += escapeMarkdownV2(
        `🔒 *يجب التفعيل أولاً (استخدم /verify)*\n\n`
      );
    }

    if (isAdmin) {
      message += escapeMarkdownV2(
        `⚙️ *أوامر المدير:*\n` +
        `• 📊 /stats \\- عرض إحصائيات البوت\n` +
        `• 📢 /publish نص_الإعلان \\- نشر إعلان (مثال: /publish الدرس القادم غدًا)\n` +
        `• 📊 /export نوع_البيانات \\- تصدير البيانات (attendance/assignments)\n` +
        `• 📬 /viewfeedback \\- عرض التغذية الراجعة\n` +
        `• 📢 /broadcast <group|users> <message> \\- إرسال رسالة جماعية\n` +
        `• 🗑️ /deletecourse رقم_الكورس \\- حذف الكورس\n` +
        `• 📝 إدارة الواجبات: /addassignment, /updateassignment, /deleteassignment\n` +
        `• 📚 إدارة الكورسات: /addcourse, /updatecourse, /deletecourse\n\n`
      );
    }

    message += escapeMarkdownV2(
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💡 *نصائح:*\n` +
      `• احفظ كود التفعيل بأمان\n` +
      `• تابع مواعيد الدروس والواجبات\n` +
      `• تواصل مع ${config.admin.supportChannel} للدعم\n\n` +
      `🤖 *بوت معين المجتهدين \\- v2\\.0\\.0*\n` +
      `📅 *آخر تحديث:* ${new Date().toLocaleDateString('ar-SA')}`
    );

    console.log('Sending /help response:', message);
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error('Error in /help command:', error);
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[HELP] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {
      console.error('Error logging to file:', e);
    }
    await ctx.reply(
      escapeMarkdownV2(
        `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}