import { addAssignment, updateAssignment, deleteAssignment, getAssignment, submitAnswer } from '../utils/database.js';
import { config } from '../../config.js';
import { templates, assignmentTemplates } from '../utils/messageTemplates.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

// Handle add assignment command (admin only)
export async function handleAddAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        templates.accessDenied('هذا الأمر مخصص للمدراء فقط', config.admin.supportChannel),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 6) {
      await ctx.reply(
        templates.info(
          'كيفية إضافة واجب',
          `الصيغة الصحيحة:\n${code('/addassignment رقم_الكورس العنوان السؤال الإجابة_الصحيحة الموعد_النهائي')}\n\nمثال:\n${code('/addassignment 1 "اختبار الوحدة الأولى" "ما هو تعريف البرمجة؟" "البرمجة هي عملية كتابة التعليمات" "2024-01-20"')}`,
          'تأكد من إدخال جميع المعلومات المطلوبة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const courseId = parseInt(args[1]);
    const title = args[2];
    const question = args[3];
    const correctAnswer = args[4];
    const deadline = args[5];

    // Validate course ID
    if (isNaN(courseId) || courseId <= 0) {
      await ctx.reply(
        templates.error(
          'رقم الكورس غير صحيح',
          'يرجى إدخال رقم صحيح للكورس',
          'تأكد من أن رقم الكورس عدد صحيح أكبر من صفر'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate title length
    if (!title || title.length < 3 || title.length > 100) {
      await ctx.reply(
        templates.error(
          'عنوان الواجب غير صحيح',
          `يجب أن يكون العنوان بين 3 و 100 حرف. العنوان الحالي: ${title?.length || 0} حرف`,
          'اختر عنواناً واضحاً ومختصراً للواجب'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate question length
    if (!question || question.length < 10 || question.length > 500) {
      await ctx.reply(
        templates.error(
          'سؤال الواجب غير صحيح',
          `يجب أن يكون السؤال بين 10 و 500 حرف. السؤال الحالي: ${question?.length || 0} حرف`,
          'تأكد من أن السؤال واضح ومفهوم'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate correct answer length
    if (!correctAnswer || correctAnswer.length < 2 || correctAnswer.length > 200) {
      await ctx.reply(
        templates.error(
          'الإجابة الصحيحة غير صحيحة',
          `يجب أن تكون الإجابة بين 2 و 200 حرف. الإجابة الحالية: ${correctAnswer?.length || 0} حرف`,
          'اكتب الإجابة الصحيحة بوضوح'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadline || !deadlineRegex.test(deadline)) {
      await ctx.reply(
        templates.error(
          'تاريخ الموعد النهائي غير صحيح',
          'يجب أن يكون التاريخ بصيغة: YYYY-MM-DD',
          'مثال: 2024-12-31'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate that deadline is in the future
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      await ctx.reply(
        templates.error(
          'الموعد النهائي في الماضي',
          `يجب أن يكون الموعد النهائي في المستقبل. التاريخ المحدد: ${deadline} والتاريخ الحالي: ${today.toISOString().split('T')[0]}`,
          'اختر تاريخاً في المستقبل للموعد النهائي'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add assignment to database
    const assignmentId = await addAssignment(courseId, title, question, correctAnswer, deadline);
    
    if (assignmentId) {
      await ctx.reply(
        assignmentTemplates.created({
          id: assignmentId,
          courseId: courseId,
          title: title,
          question: question,
          deadline: deadline
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في إضافة الواجب',
          'حدث خطأ تقني أثناء إضافة الواجب',
          'حاول مرة أخرى أو تواصل مع الدعم الفني'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addassignment:', error);
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

// Handle update assignment command (admin only)
export async function handleUpdateAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        templates.accessDenied('هذا الأمر مخصص للمدراء فقط', config.admin.supportChannel),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 4) {
      await ctx.reply(
        templates.info(
          'كيفية تحديث واجب',
          `الصيغة الصحيحة:\n${code('/updateassignment رقم_الواجب الحقل القيمة_الجديدة')}\n\nالحقول المتاحة: title, question, correct_answer, deadline\n\nمثال:\n${code('/updateassignment 1 title "عنوان جديد"')}`,
          'تأكد من صحة اسم الحقل والقيمة الجديدة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    const field = args[2];
    const newValue = args.slice(3).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        templates.error(
          'رقم الواجب غير صحيح',
          'يرجى إدخال رقم صحيح للواجب',
          'تأكد من أن رقم الواجب عدد صحيح أكبر من صفر'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if assignment exists
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        templates.error(
          'الواجب غير موجود',
          `لم يتم العثور على واجب برقم ${assignmentId}`,
          'تأكد من صحة رقم الواجب أو راجع قائمة الواجبات المتاحة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Update assignment
    const updateSuccess = await updateAssignment(assignmentId, field, newValue);
    
    if (updateSuccess) {
      await ctx.reply(
        assignmentTemplates.updated({
          id: assignmentId,
          field: field,
          newValue: newValue
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في تحديث الواجب',
          'تعذر تحديث الواجب المحدد',
          'تأكد من صحة اسم الحقل أو حاول مرة أخرى'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /updateassignment:', error);
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

// Handle delete assignment command (admin only)
export async function handleDeleteAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        templates.accessDenied('هذا الأمر مخصص للمدراء فقط', config.admin.supportChannel),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        templates.info(
          'كيفية حذف واجب',
          `الصيغة الصحيحة: ${code('/deleteassignment رقم_الواجب')}\n\nمثال: ${code('/deleteassignment 1')}`,
          'تأكد من رقم الواجب قبل الحذف - هذا الإجراء لا يمكن التراجع عنه'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        templates.error(
          'رقم الواجب غير صحيح',
          'يرجى إدخال رقم صحيح للواجب',
          'تأكد من أن رقم الواجب عدد صحيح أكبر من صفر'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Check if assignment exists
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        templates.error(
          'الواجب غير موجود',
          `لم يتم العثور على واجب برقم ${assignmentId}`,
          'تأكد من صحة رقم الواجب أو راجع قائمة الواجبات المتاحة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Delete assignment
    const deleteResult = await deleteAssignment(assignmentId);
    
    if (deleteResult.success) {
      await ctx.reply(
        assignmentTemplates.deleted({
          id: assignmentId,
          title: assignment.title
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في حذف الواجب',
          'تعذر حذف الواجب المحدد',
          'حدث خطأ تقني، حاول مرة أخرى أو تواصل مع الدعم الفني'
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deleteassignment:', error);
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

// Handle submit assignment answer command
export async function handleSubmit(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        templates.info(
          'كيفية إرسال إجابة واجب',
          `الصيغة الصحيحة: ${code('/submit رقم_الواجب الإجابة')}\n\nمثال: ${code('/submit 1 البرمجة هي عملية كتابة التعليمات')}`,
          'تأكد من كتابة إجابتك بوضوح ودقة'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    const answer = args.slice(2).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        templates.error(
          'رقم الواجب غير صحيح',
          'يرجى إدخال رقم صحيح للواجب',
          'تأكد من أن رقم الواجب عدد صحيح أكبر من صفر'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Submit answer
    const result = await submitAnswer(userId, assignmentId, answer);
    
    if (result.success) {
      await ctx.reply(
        assignmentTemplates.submitted({
          message: result.message,
          correctAnswer: result.correctAnswer,
          score: result.score,
          isCorrect: result.score === 1
        }),
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        templates.error(
          'فشل في إرسال الإجابة',
          result.message || 'تعذر إرسال إجابتك',
          `تأكد من رقم الواجب أو تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /submit:', error);
    await ctx.reply(
      templates.error(
        'حدث خطأ غير متوقع',
        'تعذر معالجة إجابتك في الوقت الحالي',
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}