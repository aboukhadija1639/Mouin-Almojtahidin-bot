// bot/commands/reportbug.js
import { addBugReport } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleReportbug(ctx) {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username ? `@${ctx.from.username}` : 'غير متوفر';
    const firstName = ctx.from.first_name || 'مستخدم';
    const messageText = ctx.message.text;
    const args = messageText.split(' ');

    if (args.length < 2) {
      await ctx.reply(
        `🐛 ${bold('الإبلاغ عن خطأ أو مشكلة')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${bold('كيفية الاستخدام:')}\n` +
        `${code('/reportbug وصف المشكلة بالتفصيل')}\n\n` +
        `💡 ${bold('نصائح لتقرير أفضل:')}\n` +
        `• اشرح المشكلة بوضوح\n` +
        `• اذكر الخطوات التي أدت للمشكلة\n` +
        `• أضف أي تفاصيل مهمة\n\n` +
        `📞 للمساعدة الفورية: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const bugDescription = args.slice(1).join(' ');
    
    if (bugDescription.trim().length < 10) {
      await ctx.reply(
        `❌ ${bold('وصف المشكلة قصير جداً')}\n\n` +
        `يرجى كتابة وصف مفصل للمشكلة \\(على الأقل 10 أحرف\\)\\.\n\n` +
        `💡 كلما كان الوصف أكثر تفصيلاً، كلما تمكنا من حل المشكلة بشكل أسرع\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Save bug report to database
    const reportId = await addBugReport(userId, bugDescription);

    if (reportId) {
      // Send confirmation to user
      await ctx.reply(
        `✅ ${bold('تم إرسال تقرير المشكلة بنجاح')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🆔 ${bold('رقم التقرير:')} ${code(reportId.toString())}\n` +
        `📝 ${bold('وصف المشكلة:')} ${escapeMarkdownV2(bugDescription)}\n` +
        `📅 ${bold('تاريخ الإرسال:')} ${new Date().toLocaleDateString('ar-SA')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔄 ${bold('ماذا يحدث الآن؟')}\n` +
        `• سيتم مراجعة تقريرك من قبل فريق التطوير\n` +
        `• ستحصل على رد في أقرب وقت ممكن\n` +
        `• يمكنك الرجوع لهذا التقرير برقم ${code(reportId.toString())}\n\n` +
        `📞 للمتابعة: ${escapeMarkdownV2(config.admin.supportChannel)}\n\n` +
        `🙏 ${italic('شكراً لك على مساعدتنا في تحسين البوت!')}`,
        { parse_mode: 'MarkdownV2' }
      );

      // Send notification to admin group if configured
      if (config.admin.groupId) {
        try {
          await ctx.telegram.sendMessage(
            config.admin.groupId,
            `🐛 ${bold('تقرير مشكلة جديد')}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🆔 ${bold('رقم التقرير:')} ${code(reportId.toString())}\n` +
            `👤 ${bold('المستخدم:')} ${escapeMarkdownV2(firstName)} \\(${escapeMarkdownV2(username)}\\)\n` +
            `📝 ${bold('المشكلة:')} ${escapeMarkdownV2(bugDescription)}\n` +
            `📅 ${bold('التاريخ:')} ${new Date().toLocaleString('ar-SA')}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⚡ ${italic('يرجى المراجعة والرد على المستخدم')}`,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (adminError) {
          console.error('خطأ في إرسال إشعار للمدراء:', adminError);
        }
      }

    } else {
      await ctx.reply(
        `❌ ${bold('فشل في حفظ تقرير المشكلة')}\n\n` +
        `حدث خطأ أثناء حفظ تقريرك\\. يرجى المحاولة مرة أخرى\\.\n\n` +
        `📞 إذا استمرت المشكلة، تواصل مباشرة مع: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /reportbug:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء معالجة تقرير المشكلة')}\n\n` +
      `حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}