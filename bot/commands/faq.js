import { config } from '../../config.js';

export async function handleFaq(ctx) {
  try {
    let message = `❓ *الأسئلة الشائعة*\n\n`;

    // Add each FAQ item
    config.faq.forEach((faqItem, index) => {
      message += `*${index + 1}. ${faqItem.question}*\n`;
      message += `${faqItem.answer}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💡 لم تجد إجابة لسؤالك؟\n`;
    message += `تواصل معنا: ${config.admin.supportChannel}`;

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /faq:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}