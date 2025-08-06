// bot/commands/courseAdmin.js
import { isUserAdmin, addCourse, updateCourse, deleteCourse } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { validateDate } from '../utils/security.js';

export function setupCourseAdmin(bot) {
  bot.command('addcourse', async (ctx) => {
    const isAdmin = await isUserAdmin(ctx.from.id);
    if (!isAdmin) {
      return ctx.reply(
        escapeMarkdownV2('غير مصرح لك باستخدام هذا الأمر ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
      return ctx.reply(
        escapeMarkdownV2(
          'إضافة كورس جديد 📚\n' +
          'الصيغة: /addcourse <اسم_الكورس> [الوصف] [تاريخ_البدء] [تاريخ_الانتهاء]\n' +
          'مثال: /addcourse "رياضيات 101" "مقدمة في الرياضيات" "2025-08-10" "2025-12-10"'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const [courseName, description = '', startDate = '', endDate = ''] = args;
    try {
      const courseId = await addCourse(courseName, description, startDate, endDate);
      if (courseId) {
        await ctx.reply(
          escapeMarkdownV2(
            `تم إضافة الكورس "${courseName}" بنجاح! ✅\n` +
            `رقم الكورس: ${courseId}`
          ),
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          escapeMarkdownV2('فشل في إضافة الكورس، حاول مرة أخرى ❌'),
          { parse_mode: 'MarkdownV2' }
        );
      }
    } catch (error) {
      console.error('Error adding course:', error);
      await ctx.reply(
        escapeMarkdownV2('حدث خطأ أثناء إضافة الكورس ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }
  });

  bot.command('updatecourse', async (ctx) => {
    const isAdmin = await isUserAdmin(ctx.from.id);
    if (!isAdmin) {
      return ctx.reply(
        escapeMarkdownV2('غير مصرح لك باستخدام هذا الأمر ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
      return ctx.reply(
        escapeMarkdownV2(
          'تحديث كورس 📚\n' +
          'الصيغة: /updatecourse <رقم_الكورس> <الحقل> <القيمة>\n' +
          'الحقول المتاحة: course_name, description, start_date, end_date\n' +
          'مثال: /updatecourse 1 course_name "رياضيات متقدمة"'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const [courseId, field, ...valueParts] = args;
    const value = valueParts.join(' ');
    try {
      const success = await updateCourse(parseInt(courseId), field, value);
      if (success) {
        await ctx.reply(
          escapeMarkdownV2(
            `تم تحديث ${field} للكورس ${courseId} بنجاح! ✅`
          ),
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          escapeMarkdownV2('فشل في تحديث الكورس، تحقق من البيانات ❌'),
          { parse_mode: 'MarkdownV2' }
        );
      }
    } catch (error) {
      console.error('Error updating course:', error);
      await ctx.reply(
        escapeMarkdownV2('حدث خطأ أثناء تحديث الكورس ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }
  });

  bot.command('deletecourse', async (ctx) => {
    const isAdmin = await isUserAdmin(ctx.from.id);
    if (!isAdmin) {
      return ctx.reply(
        escapeMarkdownV2('غير مصرح لك باستخدام هذا الأمر ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length !== 1) {
      return ctx.reply(
        escapeMarkdownV2(
          'حذف كورس 📚\n' +
          'الصيغة: /deletecourse <رقم_الكورس>\n' +
          'مثال: /deletecourse 1'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

    const courseId = parseInt(args[0]);
    try {
      const success = await deleteCourse(courseId);
      if (success) {
        await ctx.reply(
          escapeMarkdownV2(
            `تم حذف الكورس ${courseId} بنجاح! ✅`
          ),
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          escapeMarkdownV2('فشل في حذف الكورس، تحقق من رقم الكورس ❌'),
          { parse_mode: 'MarkdownV2' }
        );
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      await ctx.reply(
        escapeMarkdownV2('حدث خطأ أثناء حذف الكورس ❌'),
        { parse_mode: 'MarkdownV2' }
      );
    }
  });
}