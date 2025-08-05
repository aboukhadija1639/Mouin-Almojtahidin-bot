import { addAssignment, updateAssignment, deleteAssignment, getAssignment, submitAnswer } from '../utils/database.js';
import { config } from '../../config.js';

// Handle add assignment command (admin only)
export async function handleAddAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\n` +
        `هذا الأمر مخصص للمدراء فقط.\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 6) {
      await ctx.reply(
        `📝 *كيفية إضافة واجب*\n` +
        `الصيغة الصحيحة:\n` +
        `\`/addassignment رقم_الكورس العنوان السؤال الإجابة_الصحيحة الموعد_النهائي\`\n` +
        `مثال:\n` +
        `\`/addassignment 1 "اختبار الوحدة الأولى" "ما هو تعريف البرمجة؟" "البرمجة هي عملية كتابة التعليمات" "2024-01-20"\``,
        { parse_mode: 'Markdown' }
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
        `❌ *رقم الكورس غير صحيح*\n` +
        `يرجى إدخال رقم صحيح للكورس.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate title length
    if (!title || title.length < 3 || title.length > 100) {
      await ctx.reply(
        `❌ *عنوان الواجب غير صحيح*\n` +
        `يجب أن يكون العنوان بين 3 و 100 حرف.\n` +
        `العنوان الحالي: ${title?.length || 0} حرف`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate question length
    if (!question || question.length < 10 || question.length > 500) {
      await ctx.reply(
        `❌ *سؤال الواجب غير صحيح*\n` +
        `يجب أن يكون السؤال بين 10 و 500 حرف.\n` +
        `السؤال الحالي: ${question?.length || 0} حرف`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate correct answer length
    if (!correctAnswer || correctAnswer.length < 2 || correctAnswer.length > 200) {
      await ctx.reply(
        `❌ *الإجابة الصحيحة غير صحيحة*\n` +
        `يجب أن تكون الإجابة بين 2 و 200 حرف.\n` +
        `الإجابة الحالية: ${correctAnswer?.length || 0} حرف`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadline || !deadlineRegex.test(deadline)) {
      await ctx.reply(
        `❌ *تاريخ الموعد النهائي غير صحيح*\n` +
        `يجب أن يكون التاريخ بصيغة: YYYY-MM-DD\n` +
        `مثال: 2024-12-31`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate that deadline is in the future
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate < today) {
      await ctx.reply(
        `❌ *الموعد النهائي في الماضي*\n` +
        `يجب أن يكون الموعد النهائي في المستقبل.\n` +
        `التاريخ المحدد: ${deadline}\n` +
        `التاريخ الحالي: ${today.toISOString().split('T')[0]}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Add assignment to database
    const assignmentId = await addAssignment(courseId, title, question, correctAnswer, deadline);
    
    if (assignmentId) {
      await ctx.reply(
        `✅ *تم إضافة الواجب بنجاح*\n` +
        `🆔 *رقم الواجب:* ${assignmentId}\n` +
        `📚 *رقم الكورس:* ${courseId}\n` +
        `📝 *العنوان:* ${title}\n` +
        `❓ *السؤال:* ${question}\n` +
        `✅ *الإجابة الصحيحة:* ${correctAnswer}\n` +
        `📅 *الموعد النهائي:* ${deadline}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في إضافة الواجب*\n` +
        `حدث خطأ تقني، حاول مرة أخرى.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /addassignment:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
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
        `🚫 *غير مسموح*\n` +
        `هذا الأمر مخصص للمدراء فقط.\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 4) {
      await ctx.reply(
        `🔄 *كيفية تحديث واجب*\n` +
        `الصيغة الصحيحة:\n` +
        `\`/updateassignment رقم_الواجب الحقل القيمة_الجديدة\`\n` +
        `الحقول المتاحة: title, question, correct_answer, deadline\n` +
        `مثال:\n` +
        `\`/updateassignment 1 title "عنوان جديد"\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    const field = args[2];
    const newValue = args.slice(3).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ *رقم الواجب غير صحيح*\n` +
        `يرجى إدخال رقم صحيح للواجب.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Check if assignment exists
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        `❌ *الواجب غير موجود*\n` +
        `لم يتم العثور على واجب برقم ${assignmentId}.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Update assignment
    const updateSuccess = await updateAssignment(assignmentId, field, newValue);
    
    if (updateSuccess) {
      await ctx.reply(
        `✅ *تم تحديث الواجب بنجاح*\n` +
        `🆔 *رقم الواجب:* ${assignmentId}\n` +
        `🔄 *الحقل المحدث:* ${field}\n` +
        `📝 *القيمة الجديدة:* ${newValue}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في تحديث الواجب*\n` +
        `تأكد من صحة اسم الحقل أو حاول مرة أخرى.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /updateassignment:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
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
        `🚫 *غير مسموح*\n` +
        `هذا الأمر مخصص للمدراء فقط.\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `🗑️ *كيفية حذف واجب*\n` +
        `الصيغة الصحيحة: \`/deleteassignment رقم_الواجب\`\n` +
        `مثال: \`/deleteassignment 1\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ *رقم الواجب غير صحيح*\n` +
        `يرجى إدخال رقم صحيح للواجب.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Check if assignment exists
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        `❌ *الواجب غير موجود*\n` +
        `لم يتم العثور على واجب برقم ${assignmentId}.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Delete assignment
    const deleteSuccess = await deleteAssignment(assignmentId);
    
    if (deleteSuccess) {
      await ctx.reply(
        `✅ *تم حذف الواجب بنجاح*\n` +
        `🆔 *رقم الواجب المحذوف:* ${assignmentId}\n` +
        `📝 *عنوان الواجب:* ${assignment.title}`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في حذف الواجب*\n` +
        `حدث خطأ تقني، حاول مرة أخرى.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /deleteassignment:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
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
        `📋 *كيفية إرسال إجابة واجب*\n` +
        `الصيغة الصحيحة: \`/submit رقم_الواجب الإجابة\`\n` +
        `مثال: \`/submit 1 البرمجة هي عملية كتابة التعليمات\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const assignmentId = parseInt(args[1]);
    const answer = args.slice(2).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        `❌ *رقم الواجب غير صحيح*\n` +
        `يرجى إدخال رقم صحيح للواجب.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Submit answer
    const result = await submitAnswer(userId, assignmentId, answer);
    
    if (result.success) {
      await ctx.reply(
        `📝 *تم إرسال إجابتك بنجاح*\n` +
        `${result.message}\n` +
        `✅ *الإجابة الصحيحة:* ${result.correctAnswer}\n` +
        `📊 *نقاطك:* ${result.score}/1\n` +
        `شكراً لك على المشاركة! 🎉`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في إرسال الإجابة*\n` +
        `${result.message}\n` +
        `تأكد من رقم الواجب أو تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('خطأ في أمر /submit:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}