// bot/commands/submit.js
import { submitAnswer, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleSubmit(ctx) {
  try {
    const userId = ctx.from.id;

    // Check if user is verified
    const verified = await isUserVerified(userId);
    if (!verified) {
      await ctx.reply(
        escapeMarkdownV2(
          `🔒 *حسابك غير مفعل*\n` +
          `استخدم /verify كود_التفعيل لتفعيل حسابك\n` +
          `تواصل مع ${config.admin.supportChannel} للحصول على الكود`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const messageText = ctx.message.text;
    const args = messageText.split(' ').slice(1);
    if (args.length < 2) {
      await ctx.reply(
        escapeMarkdownV2(
          `📝 *كيفية إرسال إجابة*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `الصيغة الصحيحة: /submit رقم_الواجب الإجابة\n` +
          `مثال: /submit 1 البرمجة هي كتابة تعليمات\n` +
          `💡 تحقق من قائمة الواجبات بـ /assignments \n- قائمة الواجبات`
        ),
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
      return;
    }

    const assignmentId = parseInt(args[0]);
    const answer = args.slice(1).join(' ');
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *رقم الواجب غير صحيح*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `استخدم رقمًا صحيحًا من /assignments \n- قائمة الواجبات`
        ),
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
      return;
    }

    const result = await submitAnswer(userId, assignmentId, answer);
    if (result.success) {
      await ctx.reply(
        escapeMarkdownV2(
          `📝 *تم إرسال إجابتك بنجاح*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${result.message}\n` +
          `✅ الإجابة الصحيحة: ${result.correctAnswer}\n` +
          `📊 نقاطك: ${result.score}/1\n` +
          `🎉 شكرًا على المشاركة!`
        ),
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
    } else {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *فشل في إرسال الإجابة*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `${result.message}\n` +
          `💡 تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
      );
    }
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[SUBMIT] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {
      console.error('خطأ في تسجيل الخطأ:', e);
    }
    await ctx.reply(
      escapeMarkdownV2(
        `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}