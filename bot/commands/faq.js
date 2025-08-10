// bot/commands/faq.js
import { getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleFaq(ctx) {
  try {
    const userId = ctx.from?.id;

    // Get user language
    const userLanguage = await getUserLanguage(userId).catch(() => 'ar') || 'ar';

    // Define bilingual FAQ content
    const faqContent = {
      ar: {
        title: 'الأسئلة الشائعة',
        questions: [
          {
            q: 'كيف أفعل حسابي؟',
            a: `استخدم الأمر ${code('/verify كود_التفعيل')} واحصل على الكود من ${escapeMarkdownV2(config.admin.supportChannel)}`
          },
          {
            q: 'كيف أسجل الحضور؟',
            a: `استخدم الأمر ${code('/attendance رقم_الدرس')} مع رقم الدرس المعطى من المدرب`
          },
          {
            q: 'كيف أرسل إجابة واجب؟',
            a: `استخدم الأمر ${code('/submit رقم_الواجب إجابتك')} لإرسال إجابتك`
          },
          {
            q: 'كيف أعرض ملفي الشخصي؟',
            a: `استخدم الأمر ${code('/profile')} لعرض معلوماتك وإحصائياتك`
          },
          {
            q: 'كيف أغير إعداداتي؟',
            a: `استخدم الأمر ${code('/settings')} لتغيير اللغة والتذكيرات`
          },
          {
            q: 'كيف أضيف تذكير مخصص؟',
            a: `استخدم الأمر ${code('/addreminder')} لإضافة تذكير شخصي`
          },
          {
            q: 'أين أجد قائمة جميع الأوامر؟',
            a: `استخدم الأمر ${code('/help')} للحصول على دليل شامل لجميع الأوامر`
          }
        ],
        support: 'للدعم والمساعدة:',
        moreHelp: 'لمزيد من المساعدة، استخدم'
      },
      en: {
        title: 'Frequently Asked Questions',
        questions: [
          {
            q: 'How do I activate my account?',
            a: `Use the command ${code('/verify activation_code')} and get the code from ${escapeMarkdownV2(config.admin.supportChannel)}`
          },
          {
            q: 'How do I mark attendance?',
            a: `Use the command ${code('/attendance lesson_number')} with the lesson number given by the instructor`
          },
          {
            q: 'How do I submit an assignment answer?',
            a: `Use the command ${code('/submit assignment_number your_answer')} to submit your answer`
          },
          {
            q: 'How do I view my profile?',
            a: `Use the command ${code('/profile')} to view your information and statistics`
          },
          {
            q: 'How do I change my settings?',
            a: `Use the command ${code('/settings')} to change language and reminders`
          },
          {
            q: 'How do I add a custom reminder?',
            a: `Use the command ${code('/addreminder')} to add a personal reminder`
          },
          {
            q: 'Where can I find a list of all commands?',
            a: `Use the command ${code('/help')} to get a comprehensive guide of all commands`
          }
        ],
        support: 'For support and assistance:',
        moreHelp: 'For more help, use'
      }
    };

    const content = faqContent[userLanguage] || faqContent.ar;

    let message = `❓ ${bold(content.title)}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    content.questions.forEach((item, index) => {
      message += `${bold(`${index + 1}. ${escapeMarkdownV2(item.q)}`)}\n`;
      message += `${item.a}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💬 ${bold(content.support)} ${escapeMarkdownV2(config.admin.supportChannel)}\n`;
    message += `🆘 ${content.moreHelp} ${code('/help')}`;

    await ctx.reply(
      message,
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );

  } catch (err) {
    logError(err, 'COMMAND_FAQ');
    
    const userLanguage = await getUserLanguage(ctx.from?.id).catch(() => 'ar') || 'ar';
    const errorMessages = {
      ar: 'حدث خطأ، حاول مرة أخرى أو تواصل مع الدعم',
      en: 'An error occurred, try again or contact support'
    };

    await ctx.reply(
      error(errorMessages[userLanguage] || errorMessages.ar),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );
  }
}