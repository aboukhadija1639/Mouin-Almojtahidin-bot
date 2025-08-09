// bot/commands/addcourse.js
import { addCourse } from '../utils/database.js';
import { templates, courseTemplates } from '../utils/messageTemplates.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleAddCourse(ctx) {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      await ctx.reply(
        templates.info(
          'كيفية إضافة دورة جديدة',
          `الصيغة الصحيحة: ${code('/addcourse <اسم_الكورس> <الوصف>')}\n\nمثال: ${code('/addcourse "رياضيات 101" "مقدمة في الرياضيات"')}`,
          'تأكد من إدخال اسم الدورة والوصف بوضوح'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const courseName = args[0];
    const description = args.slice(1).join(' ');

    // Validate course name
    if (!courseName || courseName.length < 2 || courseName.length > 100) {
      await ctx.reply(
        templates.error(
          'اسم الدورة غير صحيح',
          `يجب أن يكون اسم الدورة بين 2 و 100 حرف. الاسم الحالي: ${courseName?.length || 0} حرف`,
          'اختر اسماً واضحاً ومختصراً للدورة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate description
    if (!description || description.length < 5 || description.length > 500) {
      await ctx.reply(
        templates.error(
          'وصف الدورة غير صحيح',
          `يجب أن يكون وصف الدورة بين 5 و 500 حرف. الوصف الحالي: ${description?.length || 0} حرف`,
          'اكتب وصفاً مفيداً يوضح محتوى الدورة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add course to database
    const result = await addCourse(courseName, description);
    
    if (result.success) {
      await ctx.reply(
        courseTemplates.created({
          name: courseName,
          description: description,
          id: result.courseId
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في إنشاء الدورة',
          result.message || 'حدث خطأ غير معروف أثناء إنشاء الدورة',
          'تأكد من عدم وجود دورة بنفس الاسم أو حاول مرة أخرى'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addcourse:', error);
    await ctx.reply(
      templates.error(
        'حدث خطأ غير متوقع',
        'تعذر معالجة طلبك في الوقت الحالي',
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}