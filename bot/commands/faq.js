// bot/commands/faq.js
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleFaq(ctx) {
  try {
    console.log('[FAQ] Starting /faq command handler for user:', ctx.from.id);
    const faqs = config.faq || [
      {
        question: 'كيف أسجل في الكورس؟',
        answer: 'استخدم /verify كود_التفعيل من المدرب\\.',
      },
      {
        question: 'كيف أسجل الحضور؟',
        answer: 'استخدم /attendance رقم_الدرس \\(مثال: /attendance 1\\)\\.',
      },
      {
        question: 'كيف أرى ملفي؟',
        answer: 'استخدم /profile \\- عرض معلوماتك\\.',
      },
    ];
    console.log('[FAQ] Retrieved FAQs:', faqs);

    let message = escapeMarkdownV2('❓ *الأسئلة الشائعة*\n');
    message += escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━\n');
    faqs.forEach((faq, index) => {
      message += escapeMarkdownV2(`*${index + 1}\\. ${faq.question}*\n`);
      message += escapeMarkdownV2(faq.answer) + '\n';
    });
    message += escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━\n');
    message += escapeMarkdownV2(
      `💡 *لم تجد إجابة؟* تواصل مع ${config.admin.supportChannel}`
    );

    console.log('[FAQ] Sending response to Telegram:', message);
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
    });
    console.log('[FAQ] Response sent successfully for user:', ctx.from.id);
  } catch (error) {
    console.error('[FAQ] Error in /faq command:', {
      error: error.message,
      stack: error.stack,
      userId: ctx.from?.id,
      messageText: ctx.message?.text,
    });
    try {
      const fs = await import('fs');
      fs.appendFileSync(
        './data/error.log',
        `[FAQ] ${new Date().toISOString()}\n${error.stack || error}\n`
      );
    } catch (e) {
      console.error('[FAQ] Failed to write to error.log:', e);
    }
    await ctx.reply(
      escapeMarkdownV2(
        `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}