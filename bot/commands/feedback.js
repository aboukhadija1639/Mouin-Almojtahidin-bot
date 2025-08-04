import { addFeedback, getFeedback } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleFeedback(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `💬 *إرسال تغذية راجعة*\\n\\n` +
        `📝 *الصيغة الصحيحة:*\\n` +
        `\`/feedback رسالتك\`\\n\\n` +
        `💡 *أمثلة:*\\n` +
        `• \`/feedback البوت يعمل بشكل ممتاز\`\\n` +
        `• \`/feedback أحتاج مساعدة في تسجيل الحضور\`\\n` +
        `• \`/feedback اقتراح: إضافة ميزة جديدة\`\\n\\n` +
        `📧 سيتم إرسال رسالتك للمدراء للرد عليها\\.\\n\\n` +
        `للمساعدة المباشرة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Extract feedback message
    const feedbackMessage = args.slice(1).join(' ');

    // Validate message length
    if (feedbackMessage.length < 5) {
      await ctx.reply(
        `❌ *الرسالة قصيرة جداً*\\n\\n` +
        `يرجى كتابة رسالة أطول من 5 أحرف\\.\\n\\n` +
        `💡 مثال: \`/feedback البوت يعمل بشكل ممتاز\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (feedbackMessage.length > 500) {
      await ctx.reply(
        `❌ *الرسالة طويلة جداً*\\n\\n` +
        `يرجى تقصير الرسالة إلى أقل من 500 حرف\\.\\n\\n` +
        `📝 الرسالة الحالية: ${escapeMarkdownV2(feedbackMessage.length.toString())} حرف`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add feedback to database
    const feedbackId = await addFeedback(userId, feedbackMessage);
    
    if (feedbackId) {
      const escapedMessage = escapeMarkdownV2(feedbackMessage);
      const escapedId = escapeMarkdownV2(feedbackId.toString());
      
      await ctx.reply(
        `✅ *تم إرسال التغذية الراجعة بنجاح*\\n\\n` +
        `🆔 *رقم الرسالة:* ${escapedId}\\n` +
        `💬 *رسالتك:* ${escapedMessage}\\n\\n` +
        `📧 سيتم الرد عليك في أقرب وقت ممكن\\.\\n\\n` +
        `💡 للمساعدة العاجلة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );

      // Notify admins about new feedback
      if (config.admin.chatId) {
        try {
          const user = ctx.from;
          const escapedUsername = escapeMarkdownV2(user.username || 'غير محدد');
          const escapedFirstName = escapeMarkdownV2(user.first_name || 'غير محدد');
          const escapedUserId = escapeMarkdownV2(userId.toString());
          
          const adminNotification = `📬 *تغذية راجعة جديدة*\\n\\n` +
            `👤 *من:* ${escapedFirstName} \\(@${escapedUsername}\\)\\n` +
            `🆔 *معرف المستخدم:* ${escapedUserId}\\n` +
            `🆔 *رقم الرسالة:* ${escapedId}\\n` +
            `💬 *الرسالة:* ${escapedMessage}\\n\\n` +
            `⏰ *التاريخ:* ${escapeMarkdownV2(new Date().toLocaleString('ar-SA'))}`;

          await ctx.telegram.sendMessage(config.admin.chatId, adminNotification, { 
            parse_mode: 'MarkdownV2' 
          });
        } catch (notifyError) {
          console.error('خطأ في إشعار المدراء بالتغذية الراجعة:', notifyError);
        }
      }
    } else {
      await ctx.reply(
        `❌ *فشل في إرسال التغذية الراجعة*\\n\\n` +
        `حدث خطأ تقني أثناء إرسال الرسالة\\.\\n` +
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /feedback:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

// Admin command to view all feedback
export async function handleViewFeedback(ctx) {
  try {
    const userId = ctx.from.id;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\\n\\n` +
        `هذا الأمر مخصص للمدراء فقط\\.\\n\\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Get all feedback
    const feedback = await getFeedback();
    
    if (feedback.length === 0) {
      await ctx.reply(
        `📭 *لا توجد تغذية راجعة*\\n\\n` +
        `لا توجد رسائل تغذية راجعة في النظام\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Show recent feedback (last 10)
    const recentFeedback = feedback.slice(0, 10);
    
    let message = `📬 *التغذية الراجعة الأخيرة* \\(${escapeMarkdownV2(feedback.length.toString())} رسالة\\)\\n\\n`;
    
    recentFeedback.forEach((item, index) => {
      const escapedId = escapeMarkdownV2(item.feedback_id.toString());
      const escapedUsername = escapeMarkdownV2(item.username || 'غير محدد');
      const escapedFirstName = escapeMarkdownV2(item.first_name || 'غير محدد');
      const escapedMessage = escapeMarkdownV2(item.message.substring(0, 100));
      const escapedDate = escapeMarkdownV2(new Date(item.created_at).toLocaleDateString('ar-SA'));
      
      message += `${index + 1}\\. *${escapedId}* \\- ${escapedFirstName} \\(@${escapedUsername}\\)\\n` +
        `   💬 ${escapedMessage}${item.message.length > 100 ? '...' : ''}\\n` +
        `   📅 ${escapedDate}\\n\\n`;
    });

    if (feedback.length > 10) {
      message += `📄 *عرض:* آخر 10 رسائل من ${escapeMarkdownV2(feedback.length.toString())} رسالة\\n\\n`;
    }

    message += `💡 استخدم \`/feedback\` لإرسال تغذية راجعة جديدة\\.`;

    await ctx.reply(message, { parse_mode: 'MarkdownV2' });

  } catch (error) {
    console.error('خطأ في أمر عرض التغذية الراجعة:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}