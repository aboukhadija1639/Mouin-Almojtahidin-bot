// bot/commands/addcourse.js
import { addCourse } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleAddCourse(ctx) {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('صيغة خاطئة')}*\n\n` +
        `${escapeMarkdownV2('الصيغة:')} \`/addcourse <اسم_الكورس> <الوصف>\`\n` +
        `${escapeMarkdownV2('مثال:')} \`/addcourse "رياضيات 101" "مقدمة في الرياضيات"\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const courseName = args[0];
    const description = args.slice(1).join(' ');

    // Add course to database
    const result = await addCourse(courseName, description);
    
    if (result.success) {
      await ctx.reply(
        `✅ *${escapeMarkdownV2('تم إنشاء الكورس بنجاح')}*\n\n` +
        `📚 ${escapeMarkdownV2('اسم الكورس:')} ${escapeMarkdownV2(courseName)}\n` +
        `📝 ${escapeMarkdownV2('الوصف:')} ${escapeMarkdownV2(description)}\n` +
        `🆔 ${escapeMarkdownV2('معرف الكورس:')} ${result.courseId}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${escapeMarkdownV2('فشل في إنشاء الكورس:')} ${escapeMarkdownV2(result.message || 'خطأ غير معروف')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addcourse:', error);
    await ctx.reply(
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}