import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleFaq(ctx) {
  try {
    const faqs = config.faq || [
      { question: 'كيف أسجل في الكورس؟', answer: 'استخدم /verify مع كود التفعيل من المدرب.' },
      { question: 'كيف أسجل الحضور؟', answer: 'استخدم /attendance مع رقم الدرس (مثال: /attendance 1).' },
      { question: 'كيف أرى ملفي؟', answer: 'استخدم /profile لعرض معلوماتك.' }
    ];

    let message = `❓ *${escapeMarkdownV2('الأسئلة الشائعة')}*\n`;
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    faqs.forEach((faq, index) => {
      message += `*${index + 1}\. ${escapeMarkdownV2(faq.question)}*\n`;
      message += `${escapeMarkdownV2(faq.answer)}\n\n`;
    });
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `💡 *${escapeMarkdownV2('لم تجد إجابة؟')}* ${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`;

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[FAQ] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}