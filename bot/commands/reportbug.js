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
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `📝 ${bold('كيفية الاستخدام:')}\n` +
        `${code('/reportbug وصف المشكلة بالتفصيل')}\n\n` +
        `💡 ${bold('نصائح لتقرير أفضل:')}\n` +
        `${escapeMarkdownV2('• اشرح المشكلة بوضوح')}\n` +
        `${escapeMarkdownV2('• اذكر الخطوات التي أدت للمشكلة')}\n` +
        `${escapeMarkdownV2('• أضف أي تفاصيل مهمة')}\n\n` +
        `${escapeMarkdownV2('📞 للمساعدة الفورية:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const bugDescription = args.slice(1).join(' ');
    
    if (bugDescription.trim().length < 10) {
      await ctx.reply(
        `❌ ${bold('وصف المشكلة قصير جداً')}\n\n` +
        `${escapeMarkdownV2('يرجى كتابة وصف مفصل للمشكلة (على الأقل 10 أحرف).')}\n\n` +
        `${escapeMarkdownV2('💡 كلما كان الوصف أكثر تفصيلاً، كلما تمكنا من حل المشكلة بشكل أسرع.')}`,
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
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `🆔 ${bold('رقم التقرير:')} ${code(reportId.toString())}\n` +
        `📝 ${bold('وصف المشكلة:')} ${escapeMarkdownV2(bugDescription)}\n` +
        `📅 ${bold('تاريخ الإرسال:')} ${escapeMarkdownV2(new Date().toLocaleDateString('ar-SA'))}\n\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `🔄 ${bold('ماذا يحدث الآن؟')}\n` +
        `${escapeMarkdownV2('• سيتم مراجعة تقريرك من قبل فريق التطوير')}\n` +
        `${escapeMarkdownV2('• ستحصل على رد في أقرب وقت ممكن')}\n` +
        `${escapeMarkdownV2('• يمكنك الرجوع لهذا التقرير برقم')} ${code(reportId.toString())}\n\n` +
        `${escapeMarkdownV2('📞 للمتابعة:')} ${escapeMarkdownV2(config.admin.supportChannel)}\n\n` +
        `${italic('🙏 شكراً لك على مساعدتنا في تحسين البوت!')}`,
        { parse_mode: 'MarkdownV2' }
      );

      // Send notification to admin group if configured
      if (config.admin.groupId) {
        try {
          await ctx.telegram.sendMessage(
            config.admin.groupId,
            `🐛 ${bold('تقرير مشكلة جديد')}\n\n` +
            `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
            `🆔 ${bold('رقم التقرير:')} ${code(reportId.toString())}\n` +
            `👤 ${bold('المستخدم:')} ${escapeMarkdownV2(firstName)} (${escapeMarkdownV2(username)})\n` +
            `📝 ${bold('المشكلة:')} ${escapeMarkdownV2(bugDescription)}\n` +
            `📅 ${bold('التاريخ:')} ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}\n\n` +
            `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
            `${italic('⚡ يرجى المراجعة والرد على المستخدم')}`,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (adminError) {
          console.error('خطأ في إرسال إشعار للمدراء:', adminError);
        }
      }

    } else {
      await ctx.reply(
        `❌ ${bold('فشل في حفظ تقرير المشكلة')}\n\n` +
        `${escapeMarkdownV2('حدث خطأ أثناء حفظ تقريرك. يرجى المحاولة مرة أخرى.')}\n\n` +
        `${escapeMarkdownV2('📞 إذا استمرت المشكلة، تواصل مباشرة مع:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /reportbug:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ أثناء معالجة تقرير المشكلة')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}