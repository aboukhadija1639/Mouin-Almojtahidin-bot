import { submitAnswer } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleSubmit(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        `📝 *${escapeMarkdownV2('كيفية إرسال إجابة')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('الصيغة الصحيحة:')} `/submit رقم_الواجب الإجابة`\n${escapeMarkdownV2('مثال:')} `/submit 1 البرمجة هي كتابة تعليمات`\n💡 ${escapeMarkdownV2('تحقق من قائمة الواجبات بـ /assignments')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const assignmentId = parseInt(args[1]);
    const answer = args.slice(2).join(' ');
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('رقم الواجب غير صحيح')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('استخدم رقمًا صحيحًا من /assignments')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const result = await submitAnswer(userId, assignmentId, answer);
    if (result.success) {
      await ctx.reply(
        `📝 *${escapeMarkdownV2('تم إرسال إجابتك بنجاح')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2(result.message)}\n✅ ${escapeMarkdownV2('الإجابة الصحيحة:')} ${escapeMarkdownV2(result.correctAnswer)}\n📊 ${escapeMarkdownV2('نقاطك:')} ${result.score}/1\n🎉 ${escapeMarkdownV2('شكرًا على المشاركة!')}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('فشل في إرسال الإجابة')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2(result.message)}\n💡 ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[SUBMIT] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}