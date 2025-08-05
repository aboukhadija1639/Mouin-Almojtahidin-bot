// bot/commands/reportbug.js
import { addBugReport } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleReportBug(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name || 'مستخدم';

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        escapeMarkdownV2(
          `🐛 *الإبلاغ عن خطأ*\n\n` +
          `الصيغة الصحيحة: \`/reportbug وصف_المشكلة\`\n\n` +
          `*مثال:*\n` +
          `\`/reportbug البوت لا يرد على أمر /start\`\n\n` +
          `*نصائح لتقرير أفضل:*\n` +
          `• اذكر الأمر الذي واجهت فيه المشكلة\n` +
          `• وصف ما حدث بالتفصيل\n` +
          `• اذكر الوقت التقريبي للمشكلة\n\n` +
          `📞 للمساعدة العاجلة: ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const bugDescription = args.slice(1).join(' ');

    if (bugDescription.trim().length < 10) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *وصف المشكلة قصير جداً*\n\n` +
          `يرجى كتابة وصف مفصل للمشكلة (على الأقل 10 أحرف).\n` +
          `هذا يساعد المطورين على حل المشكلة بشكل أسرع.`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add bug report to database
    const bugId = await addBugReport(userId, bugDescription);
    
    if (bugId) {
      // Send confirmation to user
      await ctx.reply(
        escapeMarkdownV2(
          `✅ *تم إرسال تقرير الخطأ بنجاح*\n\n` +
          `🆔 *رقم التقرير:* ${bugId}\n` +
          `📝 *المشكلة:* ${bugDescription}\n\n` +
          `🔄 *الخطوات التالية:*\n` +
          `• سيتم مراجعة التقرير من قبل الفريق التقني\n` +
          `• ستحصل على رد في أقرب وقت ممكن\n` +
          `• احتفظ برقم التقرير للمتابعة\n\n` +
          `شكراً لك على مساعدتنا في تحسين البوت! 🙏\n\n` +
          `📞 للمساعدة العاجلة: ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );

      // Notify admins if admin chat is configured
      if (config.admin.chatId) {
        try {
          await ctx.telegram.sendMessage(
            config.admin.chatId,
            `🐛 *تقرير خطأ جديد*\n\n` +
            `🆔 *رقم التقرير:* ${bugId}\n` +
            `👤 *المستخدم:* ${username} (${userId})\n` +
            `📝 *المشكلة:* ${bugDescription}\n` +
            `📅 *الوقت:* ${new Date().toLocaleString('ar-SA')}\n\n` +
            `💡 استخدم /viewbugs لعرض جميع التقارير`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.error('خطأ في إشعار المدراء بالتقرير:', error);
        }
      }

      // Notify individual admin users
      for (const adminId of config.admin.userIds) {
        try {
          await ctx.telegram.sendMessage(
            adminId,
            `🐛 *تقرير خطأ جديد*\n\n` +
            `🆔 *رقم التقرير:* ${bugId}\n` +
            `👤 *المستخدم:* ${username} (${userId})\n` +
            `📝 *المشكلة:* ${bugDescription}\n` +
            `📅 *الوقت:* ${new Date().toLocaleString('ar-SA')}\n\n` +
            `💡 استخدم /viewbugs لعرض جميع التقارير`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.error(`خطأ في إشعار المدير ${adminId}:`, error);
        }
      }

    } else {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *فشل في إرسال التقرير*\n\n` +
          `حدث خطأ تقني، حاول مرة أخرى.\n` +
          `إذا استمرت المشكلة، تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /reportbug:', error);
    await ctx.reply(
      escapeMarkdownV2(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`),
      { parse_mode: 'MarkdownV2' }
    );
  }
}