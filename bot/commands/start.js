import { addUser, isUserVerified } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleStart(ctx) {
  try {
    const user = ctx.from;
    const userId = user.id;
    const username = user.username || '';
    const firstName = user.first_name || '';

    // Add user to database
    await addUser(userId, username, firstName);

    // Check if user is already verified
    const verified = await isUserVerified(userId);

    let message = `🤝 *مرحباً بك في بوت معين المجتهدين*\n\n`;
    
    if (verified) {
      message += `✅ حسابك مفعل بالفعل!\n\n`;
      message += `يمكنك الآن استخدام جميع ميزات البوت:\n\n`;
    } else {
      message += `🔒 حسابك غير مفعل حالياً.\n\n`;
      message += `لتفعيل حسابك واستخدام البوت، استخدم الأمر:\n`;
      message += `\`/verify كود_التفعيل\`\n\n`;
      message += `للحصول على كود التفعيل، تواصل مع ${config.admin.supportChannel}\n\n`;
    }

    message += `📚 *الميزات المتاحة:*\n`;
    message += `• /profile - عرض ملفك الشخصي\n`;
    message += `• /attendance - تسجيل الحضور\n`;
    message += `• /faq - الأسئلة الشائعة\n`;
    message += `• /submit - إرسال إجابة واجب\n\n`;
    
    message += `📞 *للدعم والمساعدة:*\n`;
    message += `${config.admin.supportChannel}`;

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /start:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}