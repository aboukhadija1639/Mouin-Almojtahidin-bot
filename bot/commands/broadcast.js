// bot/commands/broadcast.js
import { getAllVerifiedUsers } from '../utils/database.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleBroadcast(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 ${bold('غير مسموح')}\n\n` +
        `هذا الأمر مخصص للمدراء فقط\\.\n\n` +
        `📞 للمساعدة، تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        `📢 ${bold('كيفية استخدام البث')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📝 ${bold('الصيغة الصحيحة:')}\n` +
        `${code('/broadcast <group|users> <message>')}\n\n` +
        `🎯 ${bold('الخيارات:')}\n` +
        `• ${code('group')} \\- إرسال للمجموعة الرئيسية\n` +
        `• ${code('users')} \\- إرسال لجميع المستخدمين المفعلين\n\n` +
        `💡 ${bold('أمثلة:')}\n` +
        `${code('/broadcast group الدرس غداً في الساعة 8 مساءً')}\n` +
        `${code('/broadcast users تذكير: موعد التسليم غداً')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const target = args[1].toLowerCase();
    const message = args.slice(2).join(' ');

    if (!['group', 'users'].includes(target)) {
      await ctx.reply(
        `❌ ${bold('خيار غير صحيح')}\n\n` +
        `الخيارات المتاحة: ${code('group')} أو ${code('users')}\n\n` +
        `استخدم ${code('/broadcast')} بدون معاملات لمعرفة التفاصيل\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (message.trim().length === 0) {
      await ctx.reply(
        `❌ ${bold('الرسالة فارغة')}\n\n` +
        `يرجى كتابة الرسالة المراد إرسالها\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let totalTargets = 0;

    if (target === 'group') {
      // Send to main group
      if (config.admin.chatId) {
        try {
          await ctx.telegram.sendMessage(
            config.admin.chatId,
            `📢 ${bold('إعلان من الإدارة')}\n\n${escapeMarkdownV2(message)}`,
            { parse_mode: 'MarkdownV2' }
          );
          successCount = 1;
          totalTargets = 1;
        } catch (error) {
          console.error('خطأ في إرسال الرسالة للمجموعة:', error);
          failCount = 1;
          totalTargets = 1;
        }
      } else {
        await ctx.reply(
          `❌ ${bold('معرف المجموعة غير محدد')}\n\n` +
          `لم يتم تحديد معرف المجموعة الرئيسية في الإعدادات\\.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }
    } else if (target === 'users') {
      // Send to all verified users
      const users = await getAllVerifiedUsers();
      totalTargets = users.length;

      if (users.length === 0) {
        await ctx.reply(
          `❌ ${bold('لا يوجد مستخدمون مفعلون')}\n\n` +
          `لا يوجد مستخدمون مفعلون لإرسال الرسالة إليهم\\.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      // Send status message
      await ctx.reply(
        `📤 ${bold('جاري الإرسال...')}\n\n` +
        `👥 عدد المستخدمين المستهدفين: ${totalTargets}\n\n` +
        `⏳ سيتم إرسال تقرير عند الانتهاء\\.`,
        { parse_mode: 'MarkdownV2' }
      );

      // Send to each user with delay to avoid rate limiting
      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(
            user.user_id,
            `📢 ${bold('رسالة من إدارة معين المجتهدين')}\n\n${escapeMarkdownV2(message)}`,
            { parse_mode: 'MarkdownV2' }
          );
          successCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`خطأ في إرسال الرسالة للمستخدم ${user.user_id}:`, error);
          failCount++;
        }
      }
    }

    // Send completion report
    const successRate = totalTargets > 0 ? Math.round((successCount / totalTargets) * 100) : 0;
    await ctx.reply(
      `✅ ${bold('تم إنجاز البث')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📊 ${bold('تقرير الإرسال:')}\n` +
      `• المستهدفون: ${totalTargets}\n` +
      `• نجح الإرسال: ${successCount}\n` +
      `• فشل الإرسال: ${failCount}\n` +
      `• معدل النجاح: ${successRate}%\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📝 ${bold('الرسالة المرسلة:')}\n${escapeMarkdownV2(message)}`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('خطأ في أمر /broadcast:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}