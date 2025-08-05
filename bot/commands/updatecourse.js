// bot/commands/updatecourse.js
import { updateCourse, getCourses } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleUpdateCourse(ctx) {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 3) {
      await ctx.reply(
        `❌ *${escapeMarkdownV2('صيغة خاطئة')}*\n\n` +
        `${escapeMarkdownV2('الصيغة:')} \`/updatecourse <معرف_الكورس> <الحقل> <القيمة>\`\n\n` +
        `${escapeMarkdownV2('الحقول المتاحة:')}\n` +
        `• \`name\` ${escapeMarkdownV2('- اسم الكورس')}\n` +
        `• \`description\` ${escapeMarkdownV2('- وصف الكورس')}\n\n` +
        `${escapeMarkdownV2('مثال:')} \`/updatecourse 1 name "رياضيات متقدمة"\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const courseId = parseInt(args[0]);
    const field = args[1];
    const value = args.slice(2).join(' ');

    if (isNaN(courseId)) {
      await ctx.reply(
        `❌ ${escapeMarkdownV2('معرف الكورس يجب أن يكون رقم')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Update course in database
    const result = await updateCourse(courseId, field, value);
    
    if (result.success) {
      await ctx.reply(
        `✅ *${escapeMarkdownV2('تم تحديث الكورس بنجاح')}*\n\n` +
        `🆔 ${escapeMarkdownV2('معرف الكورس:')} ${courseId}\n` +
        `📝 ${escapeMarkdownV2('الحقل:')} ${escapeMarkdownV2(field)}\n` +
        `🔄 ${escapeMarkdownV2('القيمة الجديدة:')} ${escapeMarkdownV2(value)}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${escapeMarkdownV2('فشل في تحديث الكورس:')} ${escapeMarkdownV2(result.message || 'خطأ غير معروف')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /updatecourse:', error);
    await ctx.reply(
      `❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}