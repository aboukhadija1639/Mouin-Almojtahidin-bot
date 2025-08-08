import { toggleUserReminders, getUserInfo } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

function replyMarkdown(ctx, message) {
  return ctx.reply(message, { parse_mode: 'MarkdownV2' });
}

function buildErrorMessage(title, body) {
  return `❌ *${escapeMarkdownV2(title)}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2(body)}\n💡 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`;
}

function logAndReply(ctx, userId, message) {
  console.log(`Sending message to user ${userId}: ${message}`);
  return replyMarkdown(ctx, message);
}

export async function handleReminders(ctx) {
  const userId = ctx.from?.id;
  console.log(`[REMINDERS] Triggered by user: ${userId}`);

  try {
    const userInfo = await getUserInfo(userId);
    if (!userInfo) {
      const msg = buildErrorMessage('لم يتم العثور على حسابك', 'استخدم /start للتسجيل');
      return logAndReply(ctx, userId, msg);
    }

    if (!userInfo.is_verified) {
      const msg = buildErrorMessage('حسابك غير مفعل', 'استخدم /verify للتفعيل');
      return logAndReply(ctx, userId, msg);
    }

    const result = await toggleUserReminders(userId);
    if (!result.success) {
      const msg = buildErrorMessage('فشل في تحديث التذكيرات', result.message);
      return logAndReply(ctx, userId, msg);
    }

    const enabled = result.remindersEnabled;
    const statusText = enabled ? '🔔 مفعلة' : '🔕 معطلة';
    const header = enabled ? 'تم تفعيل التذكيرات' : 'تم إيقاف التذكيرات';
    const body = enabled
      ? '✅ ستتلقى: تذكيرات الدروس والواجبات'
      : '❌ لن تتلقى: تذكيرات';

    const response = `*${escapeMarkdownV2(header)}*\n━━━━━━━━━━━━━━━━━━━━\n📊 *الحالة الحالية:* ${escapeMarkdownV2(statusText)}\n${escapeMarkdownV2(body)}\n🔄 استخدم /reminders للتغيير مجددًا\n💡 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`;
    return logAndReply(ctx, userId, response);

  } catch (error) {
    console.error(`[REMINDERS] Error for user ${userId}:`, error);
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[REMINDERS] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {
      console.error('Failed to write error log:', e);
    }

    const msg = `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    return logAndReply(ctx, userId, msg);
  }
}