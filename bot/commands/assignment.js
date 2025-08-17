import { addAssignment, updateAssignment, deleteAssignment, getAssignment, submitAnswer } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';

// Handle add assignment command (admin only)
export async function handleAddAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 ${bold('غير مسموح')}\n\n` +
        `${escapeMarkdownV2('هذا الأمر مخصص للمدراء فقط.')}\n\n` +
        `${escapeMarkdownV2('للمساعدة، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 6) {
      await ctx.reply(
        `📝 ${bold('كيفية إضافة واجب')}\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')}\n` +
        `${code('/addassignment رقم_الكورس العنوان السؤال الإجابة_الصحيحة الموعد_النهائي')}\n\n` +
        `${escapeMarkdownV2('مثال:')}\n` +
        `${code('/addassignment 1 "اختبار الوحدة الأولى" "ما هو تعريف البرمجة؟" "البرمجة هي عملية كتابة التعليمات" "2024-01-20"')}`,
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
        `❌ ${bold('رقم الكورس غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يرجى إدخال رقم صحيح للكورس.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate title length
    if (!title || title.length < 3 || title.length > 100) {
      await ctx.reply(
        `❌ ${bold('عنوان الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يجب أن يكون العنوان بين 3 و 100 حرف.')}\n\n` +
        `${escapeMarkdownV2('العنوان الحالي:')} ${title?.length || 0} ${escapeMarkdownV2('حرف')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate question length
    if (!question || question.length < 10 || question.length > 500) {
      await ctx.reply(
        `❌ ${bold('سؤال الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يجب أن يكون السؤال بين 10 و 500 حرف.')}\n\n` +
        `${escapeMarkdownV2('السؤال الحالي:')} ${question?.length || 0} ${escapeMarkdownV2('حرف')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate correct answer length
    if (!correctAnswer || correctAnswer.length < 3 || correctAnswer.length > 500) {
      await ctx.reply(
        `❌ ${bold('الإجابة الصحيحة غير صحيحة')}\n\n` +
        `${escapeMarkdownV2('يجب أن تكون الإجابة بين 3 و 500 حرف.')}\n\n` +
        `${escapeMarkdownV2('الإجابة الحالية:')} ${correctAnswer?.length || 0} ${escapeMarkdownV2('حرف')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadline || !deadlineRegex.test(deadline)) {
      await ctx.reply(
        `❌ ${bold('الموعد النهائي غير صحيح')}\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة: YYYY-MM-DD')}\n\n` +
        `${escapeMarkdownV2('مثال: 2024-01-20')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Add assignment to database
    const assignmentId = await addAssignment(courseId, title, question, correctAnswer, deadline);
    
    if (assignmentId) {
      await ctx.reply(
        `✅ ${bold('تم إضافة الواجب بنجاح')}\n\n` +
        `🆔 ${bold('رقم الواجب:')} ${assignmentId}\n` +
        `📚 ${bold('الكورس:')} ${courseId}\n` +
        `📝 ${bold('العنوان:')} ${escapeMarkdownV2(title)}\n` +
        `❓ ${bold('السؤال:')} ${escapeMarkdownV2(question)}\n` +
        `✅ ${bold('الإجابة الصحيحة:')} ${escapeMarkdownV2(correctAnswer)}\n` +
        `⏰ ${bold('الموعد النهائي:')} ${escapeMarkdownV2(deadline)}\n\n` +
        `${escapeMarkdownV2('يمكن للمستخدمين الآن الإجابة باستخدام /submit')}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('فشل في إضافة الواجب')}\n\n` +
        `${escapeMarkdownV2('حدث خطأ تقني، حاول مرة أخرى.')}\n\n` +
        `${escapeMarkdownV2('إذا استمر الخطأ، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addassignment:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
        `🚫 ${bold('غير مسموح')}\n\n` +
        `${escapeMarkdownV2('هذا الأمر مخصص للمدراء فقط.')}\n\n` +
        `${escapeMarkdownV2('للمساعدة، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        `📝 ${bold('كيفية تحديث واجب')}\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')}\n` +
        `${code('/updateassignment رقم_الواجب [العنوان] [السؤال] [الإجابة_الصحيحة] [الموعد_النهائي]')}\n\n` +
        `${escapeMarkdownV2('يمكنك تحديث حقل واحد أو أكثر.')}\n\n` +
        `${escapeMarkdownV2('مثال:')}\n` +
        `${code('/updateassignment 1 "عنوان جديد"')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ ${bold('رقم الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يرجى إدخال رقم صحيح للواجب.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Get current assignment
    const currentAssignment = await getAssignment(assignmentId);
    if (!currentAssignment) {
      await ctx.reply(
        `❌ ${bold('الواجب غير موجود')}\n\n` +
        `${escapeMarkdownV2('تأكد من رقم الواجب.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse updates
    const updates = {};
    let index = 2;
    if (args[index]) updates.title = args[index++];
    if (args[index]) updates.question = args[index++];
    if (args[index]) updates.correctAnswer = args[index++];
    if (args[index]) updates.deadline = args[index++];

    // Validate updates if provided
    if (updates.title && (updates.title.length < 3 || updates.title.length > 100)) {
      await ctx.reply(
        `❌ ${bold('عنوان الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يجب أن يكون بين 3 و 100 حرف.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (updates.question && (updates.question.length < 10 || updates.question.length > 500)) {
      await ctx.reply(
        `❌ ${bold('سؤال الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يجب أن يكون بين 10 و 500 حرف.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (updates.correctAnswer && (updates.correctAnswer.length < 3 || updates.correctAnswer.length > 500)) {
      await ctx.reply(
        `❌ ${bold('الإجابة الصحيحة غير صحيحة')}\n\n` +
        `${escapeMarkdownV2('يجب أن تكون بين 3 و 500 حرف.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (updates.deadline) {
      const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!deadlineRegex.test(updates.deadline)) {
        await ctx.reply(
          `❌ ${bold('الموعد النهائي غير صحيح')}\n\n` +
          `${escapeMarkdownV2('الصيغة الصحيحة: YYYY-MM-DD')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }
    }

    // Update assignment
    const updateResult = await updateAssignment(assignmentId, updates);
    
    if (updateResult.success) {
      const updatedAssignment = await getAssignment(assignmentId);
      await ctx.reply(
        `✅ ${bold('تم تحديث الواجب بنجاح')}\n\n` +
        `🆔 ${bold('رقم الواجب:')} ${assignmentId}\n` +
        `📝 ${bold('العنوان:')} ${escapeMarkdownV2(updatedAssignment.title)}\n` +
        `❓ ${bold('السؤال:')} ${escapeMarkdownV2(updatedAssignment.question)}\n` +
        `✅ ${bold('الإجابة الصحيحة:')} ${escapeMarkdownV2(updatedAssignment.correct_answer)}\n` +
        `⏰ ${bold('الموعد النهائي:')} ${escapeMarkdownV2(updatedAssignment.deadline)}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('فشل في تحديث الواجب')}\n\n` +
        `${escapeMarkdownV2(updateResult.message)}\n\n` +
        `${escapeMarkdownV2('تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /updateassignment:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
        `🚫 ${bold('غير مسموح')}\n\n` +
        `${escapeMarkdownV2('هذا الأمر مخصص للمدراء فقط.')}\n\n` +
        `${escapeMarkdownV2('للمساعدة، تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `🗑️ ${bold('كيفية حذف واجب')}\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')}\n` +
        `${code('/deleteassignment رقم_الواجب')}\n\n` +
        `${escapeMarkdownV2('مثال:')}\n` +
        `${code('/deleteassignment 1')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ ${bold('رقم الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يرجى إدخال رقم صحيح للواجب.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Get assignment to confirm
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        `❌ ${bold('الواجب غير موجود')}\n\n` +
        `${escapeMarkdownV2('تأكد من رقم الواجب.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Delete assignment
    const deleteResult = await deleteAssignment(assignmentId);
    
    if (deleteResult.success) {
      await ctx.reply(
        `✅ ${bold('تم حذف الواجب بنجاح')}\n\n` +
        `🆔 ${bold('رقم الواجب المحذوف:')} ${assignmentId}\n` +
        `📝 ${bold('عنوان الواجب:')} ${escapeMarkdownV2(assignment.title)}`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('فشل في حذف الواجب')}\n\n` +
        `${escapeMarkdownV2('حدث خطأ تقني، حاول مرة أخرى.')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deleteassignment:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
        `📋 ${bold('كيفية إرسال إجابة واجب')}\n\n` +
        `${escapeMarkdownV2('الصيغة الصحيحة:')} ${code('/submit رقم_الواجب الإجابة')}\n\n` +
        `${escapeMarkdownV2('مثال:')} ${code('/submit 1 البرمجة هي عملية كتابة التعليمات')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    const answer = args.slice(2).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ ${bold('رقم الواجب غير صحيح')}\n\n` +
        `${escapeMarkdownV2('يرجى إدخال رقم صحيح للواجب.')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Submit answer
    const result = await submitAnswer(userId, assignmentId, answer);
    
    if (result.success) {
      await ctx.reply(
        `📝 ${bold('تم إرسال إجابتك بنجاح')}\n\n` +
        `${escapeMarkdownV2(result.message)}\n\n` +
        `✅ ${bold('الإجابة الصحيحة:')} ${escapeMarkdownV2(result.correctAnswer)}\n` +
        `📊 ${bold('نقاطك:')} ${result.score}/1\n\n` +
        `${escapeMarkdownV2('شكراً لك على المشاركة!')} 🎉`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ ${bold('فشل في إرسال الإجابة')}\n\n` +
        `${escapeMarkdownV2(result.message)}\n\n` +
        `${escapeMarkdownV2('تأكد من رقم الواجب أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /submit:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}