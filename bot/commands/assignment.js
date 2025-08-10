import { addAssignment, updateAssignment, deleteAssignment, getAssignment, submitAnswer, getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

// Handle add assignment command (admin only)
export async function handleAddAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define bilingual messages
    const messages = {
      ar: {
        howToAddAssignment: 'كيفية إضافة واجب',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        incorrectCourseId: 'رقم الكورس غير صحيح',
        enterValidCourseId: 'يرجى إدخال رقم صحيح للكورس.',
        incorrectTitle: 'عنوان الواجب غير صحيح',
        titleLengthRange: 'يجب أن يكون العنوان بين 3 و 100 حرف.',
        currentTitle: 'العنوان الحالي:',
        characters: 'حرف',
        incorrectQuestion: 'سؤال الواجب غير صحيح',
        questionLengthRange: 'يجب أن يكون السؤال بين 10 و 500 حرف.',
        currentQuestion: 'السؤال الحالي:',
        incorrectAnswer: 'الإجابة الصحيحة غير صحيحة',
        answerLengthRange: 'يجب أن تكون الإجابة بين 2 و 200 حرف.',
        currentAnswer: 'الإجابة الحالية:',
        incorrectDeadline: 'تاريخ الموعد النهائي غير صحيح',
        deadlineFormat: 'يجب أن يكون التاريخ بصيغة: YYYY-MM-DD',
        deadlineExample: 'مثال: 2024-12-31',
        deadlineInPast: 'الموعد النهائي يجب أن يكون في المستقبل',
        currentDate: 'التاريخ الحالي:',
        deadlineEntered: 'الموعد المدخل:',
        assignmentAddedSuccessfully: 'تم إضافة الواجب بنجاح!',
        assignmentId: 'رقم الواجب:',
        course: 'الكورس:',
        title: 'العنوان:',
        question: 'السؤال:',
        deadline: 'الموعد النهائي:',
        studentsNotified: 'سيتم إشعار الطلاب المفعلين.',
        assignmentAddFailed: 'فشل في إضافة الواجب',
        technicalError: 'حدث خطأ تقني، حاول مرة أخرى.'
      },
      en: {
        howToAddAssignment: 'How to Add Assignment',
        correctFormat: 'Correct format:',
        example: 'Example:',
        incorrectCourseId: 'Incorrect course ID',
        enterValidCourseId: 'Please enter a valid course ID.',
        incorrectTitle: 'Incorrect assignment title',
        titleLengthRange: 'Title must be between 3 and 100 characters.',
        currentTitle: 'Current title:',
        characters: 'characters',
        incorrectQuestion: 'Incorrect assignment question',
        questionLengthRange: 'Question must be between 10 and 500 characters.',
        currentQuestion: 'Current question:',
        incorrectAnswer: 'Incorrect correct answer',
        answerLengthRange: 'Answer must be between 2 and 200 characters.',
        currentAnswer: 'Current answer:',
        incorrectDeadline: 'Incorrect deadline date',
        deadlineFormat: 'Date must be in format: YYYY-MM-DD',
        deadlineExample: 'Example: 2024-12-31',
        deadlineInPast: 'Deadline must be in the future',
        currentDate: 'Current date:',
        deadlineEntered: 'Entered deadline:',
        assignmentAddedSuccessfully: 'Assignment added successfully!',
        assignmentId: 'Assignment ID:',
        course: 'Course:',
        title: 'Title:',
        question: 'Question:',
        deadline: 'Deadline:',
        studentsNotified: 'Activated students will be notified.',
        assignmentAddFailed: 'Failed to add assignment',
        technicalError: 'A technical error occurred, try again.'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 6) {
      await ctx.reply(
        info(
          `📝 ${bold(msg.howToAddAssignment)}\n` +
          `${escapeMarkdownV2(msg.correctFormat)}\n` +
          `${code('/addassignment رقم_الكورس العنوان السؤال الإجابة_الصحيحة الموعد_النهائي')}\n` +
          `${escapeMarkdownV2(msg.example)}\n` +
          `${code('/addassignment 1 "اختبار الوحدة الأولى" "ما هو تعريف البرمجة؟" "البرمجة هي عملية كتابة التعليمات" "2024-01-20"')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const courseId = parseInt(args[1], 10);
    const title = args[2];
    const question = args[3];
    const correctAnswer = args[4];
    const deadline = args[5];

    // Validate course ID
    if (isNaN(courseId) || courseId <= 0) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectCourseId)}\n` +
          `${escapeMarkdownV2(msg.enterValidCourseId)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate title length
    if (!title || title.length < 3 || title.length > 100) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectTitle)}\n` +
          `${escapeMarkdownV2(msg.titleLengthRange)}\n` +
          `${escapeMarkdownV2(msg.currentTitle)} ${title?.length || 0} ${escapeMarkdownV2(msg.characters)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate question length
    if (!question || question.length < 10 || question.length > 500) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectQuestion)}\n` +
          `${escapeMarkdownV2(msg.questionLengthRange)}\n` +
          `${escapeMarkdownV2(msg.currentQuestion)} ${question?.length || 0} ${escapeMarkdownV2(msg.characters)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate correct answer length
    if (!correctAnswer || correctAnswer.length < 2 || correctAnswer.length > 200) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectAnswer)}\n` +
          `${escapeMarkdownV2(msg.answerLengthRange)}\n` +
          `${escapeMarkdownV2(msg.currentAnswer)} ${correctAnswer?.length || 0} ${escapeMarkdownV2(msg.characters)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate deadline format (YYYY-MM-DD)
    const deadlineRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!deadline || !deadlineRegex.test(deadline)) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectDeadline)}\n` +
          `${escapeMarkdownV2(msg.deadlineFormat)}\n` +
          `${escapeMarkdownV2(msg.deadlineExample)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate that deadline is in the future
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate <= today) {
      await ctx.reply(
        error(
          `${bold(msg.deadlineInPast)}\n` +
          `${escapeMarkdownV2(msg.currentDate)} ${escapeMarkdownV2(today.toLocaleDateString())}\n` +
          `${escapeMarkdownV2(msg.deadlineEntered)} ${escapeMarkdownV2(deadline)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Add assignment to database
    const assignmentId = await addAssignment(courseId, title, question, correctAnswer, deadline);
    
    if (assignmentId) {
      await ctx.reply(
        success(
          `🎉 ${bold(msg.assignmentAddedSuccessfully)}\n\n` +
          `🆔 ${bold(msg.assignmentId)} ${assignmentId}\n` +
          `📚 ${bold(msg.course)} ${courseId}\n` +
          `📝 ${bold(msg.title)} ${escapeMarkdownV2(title)}\n` +
          `❓ ${bold(msg.question)} ${escapeMarkdownV2(question)}\n` +
          `📅 ${bold(msg.deadline)} ${escapeMarkdownV2(deadline)}\n\n` +
          `✅ ${escapeMarkdownV2(msg.studentsNotified)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    } else {
      await ctx.reply(
        error(
          `${bold(msg.assignmentAddFailed)}\n` +
          `${escapeMarkdownV2(msg.technicalError)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }

  } catch (err) {
    logError(err, 'COMMAND_ADD_ASSIGNMENT');
    
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

// Handle update assignment command (admin only)
export async function handleUpdateAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    const messages = {
      ar: {
        howToUpdateAssignment: 'كيفية تحديث واجب',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        availableFields: 'الحقول المتاحة للتحديث: title, question, correct_answer, due_date',
        incorrectAssignmentId: 'رقم الواجب غير صحيح',
        enterValidAssignmentId: 'يرجى إدخال رقم صحيح للواجب.',
        invalidField: 'حقل غير صالح',
        validFields: 'الحقول الصالحة:',
        assignmentNotFound: 'الواجب غير موجود',
        assignmentNotFoundMessage: 'لم يتم العثور على واجب برقم',
        assignmentUpdatedSuccessfully: 'تم تحديث الواجب بنجاح!',
        field: 'الحقل:',
        newValue: 'القيمة الجديدة:',
        assignmentUpdateFailed: 'فشل في تحديث الواجب',
        technicalError: 'حدث خطأ تقني، حاول مرة أخرى.'
      },
      en: {
        howToUpdateAssignment: 'How to Update Assignment',
        correctFormat: 'Correct format:',
        example: 'Example:',
        availableFields: 'Available fields to update: title, question, correct_answer, due_date',
        incorrectAssignmentId: 'Incorrect assignment ID',
        enterValidAssignmentId: 'Please enter a valid assignment ID.',
        invalidField: 'Invalid field',
        validFields: 'Valid fields:',
        assignmentNotFound: 'Assignment not found',
        assignmentNotFoundMessage: 'No assignment found with ID',
        assignmentUpdatedSuccessfully: 'Assignment updated successfully!',
        field: 'Field:',
        newValue: 'New value:',
        assignmentUpdateFailed: 'Failed to update assignment',
        technicalError: 'A technical error occurred, try again.'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 4) {
      await ctx.reply(
        info(
          `📝 ${bold(msg.howToUpdateAssignment)}\n` +
          `${escapeMarkdownV2(msg.correctFormat)}\n` +
          `${code('/updateassignment رقم_الواجب الحقل القيمة_الجديدة')}\n` +
          `${escapeMarkdownV2(msg.example)}\n` +
          `${code('/updateassignment 1 title "عنوان جديد"')}\n\n` +
          `${escapeMarkdownV2(msg.availableFields)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const assignmentId = parseInt(args[1], 10);
    const field = args[2];
    const newValue = args.slice(3).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectAssignmentId)}\n` +
          `${escapeMarkdownV2(msg.enterValidAssignmentId)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate field
    const validFields = ['title', 'question', 'correct_answer', 'due_date'];
    if (!validFields.includes(field)) {
      await ctx.reply(
        error(
          `${bold(msg.invalidField)}\n` +
          `${escapeMarkdownV2(msg.validFields)} ${validFields.join(', ')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Check if assignment exists
    const assignment = await getAssignment(assignmentId);
    if (!assignment) {
      await ctx.reply(
        error(
          `${bold(msg.assignmentNotFound)}\n` +
          `${escapeMarkdownV2(`${msg.assignmentNotFoundMessage} ${assignmentId}.`)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Update assignment
    const updateSuccess = await updateAssignment(assignmentId, field, newValue);
    
    if (updateSuccess) {
      await ctx.reply(
        success(
          `✅ ${bold(msg.assignmentUpdatedSuccessfully)}\n\n` +
          `🆔 ${bold(msg.assignmentId)} ${assignmentId}\n` +
          `📝 ${bold(msg.field)} ${escapeMarkdownV2(field)}\n` +
          `🆕 ${bold(msg.newValue)} ${escapeMarkdownV2(newValue)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    } else {
      await ctx.reply(
        error(
          `${bold(msg.assignmentUpdateFailed)}\n` +
          `${escapeMarkdownV2(msg.technicalError)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }

  } catch (err) {
    logError(err, 'COMMAND_UPDATE_ASSIGNMENT');
    
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

// Handle delete assignment command (admin only)
export async function handleDeleteAssignment(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    const messages = {
      ar: {
        howToDeleteAssignment: 'كيفية حذف واجب',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        incorrectAssignmentId: 'رقم الواجب غير صحيح',
        enterValidAssignmentId: 'يرجى إدخال رقم صحيح للواجب.',
        assignmentDeletedSuccessfully: 'تم حذف الواجب بنجاح!',
        assignmentId: 'رقم الواجب المحذوف:',
        submissionsDeleted: 'تم حذف جميع الإرسالات المرتبطة بهذا الواجب.',
        assignmentDeleteFailed: 'فشل في حذف الواجب',
        assignmentNotFound: 'الواجب غير موجود أو تم حذفه مسبقاً.',
        technicalError: 'حدث خطأ تقني، حاول مرة أخرى.'
      },
      en: {
        howToDeleteAssignment: 'How to Delete Assignment',
        correctFormat: 'Correct format:',
        example: 'Example:',
        incorrectAssignmentId: 'Incorrect assignment ID',
        enterValidAssignmentId: 'Please enter a valid assignment ID.',
        assignmentDeletedSuccessfully: 'Assignment deleted successfully!',
        assignmentId: 'Deleted assignment ID:',
        submissionsDeleted: 'All submissions related to this assignment have been deleted.',
        assignmentDeleteFailed: 'Failed to delete assignment',
        assignmentNotFound: 'Assignment not found or already deleted.',
        technicalError: 'A technical error occurred, try again.'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        info(
          `🗑️ ${bold(msg.howToDeleteAssignment)}\n` +
          `${escapeMarkdownV2(msg.correctFormat)}\n` +
          `${code('/deleteassignment رقم_الواجب')}\n` +
          `${escapeMarkdownV2(msg.example)}\n` +
          `${code('/deleteassignment 1')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const assignmentId = parseInt(args[1], 10);

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectAssignmentId)}\n` +
          `${escapeMarkdownV2(msg.enterValidAssignmentId)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Delete assignment
    const deleteResult = await deleteAssignment(assignmentId);
    
    if (deleteResult.success) {
      await ctx.reply(
        success(
          `🗑️ ${bold(msg.assignmentDeletedSuccessfully)}\n\n` +
          `🆔 ${bold(msg.assignmentId)} ${assignmentId}\n\n` +
          `📝 ${escapeMarkdownV2(msg.submissionsDeleted)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    } else {
      await ctx.reply(
        error(
          `${bold(msg.assignmentDeleteFailed)}\n` +
          `${escapeMarkdownV2(msg.assignmentNotFound)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }

  } catch (err) {
    logError(err, 'COMMAND_DELETE_ASSIGNMENT');
    
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

// Handle submit answer command
export async function handleSubmit(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    const messages = {
      ar: {
        howToSubmit: 'كيفية إرسال إجابة واجب',
        correctFormat: 'الصيغة الصحيحة:',
        example: 'مثال:',
        incorrectAssignmentId: 'رقم الواجب غير صحيح',
        enterValidAssignmentId: 'يرجى إدخال رقم صحيح للواجب.',
        answerRequired: 'الإجابة مطلوبة',
        enterYourAnswer: 'يرجى إدخال إجابتك.',
        submissionSuccessful: 'تم إرسال إجابتك بنجاح!',
        assignmentId: 'رقم الواجب:',
        yourAnswer: 'إجابتك:',
        result: 'النتيجة:',
        correctAnswer: 'الإجابة الصحيحة:',
        submissionFailed: 'فشل في إرسال الإجابة',
        checkAssignmentId: 'تأكد من رقم الواجب وحاول مرة أخرى.'
      },
      en: {
        howToSubmit: 'How to Submit Assignment Answer',
        correctFormat: 'Correct format:',
        example: 'Example:',
        incorrectAssignmentId: 'Incorrect assignment ID',
        enterValidAssignmentId: 'Please enter a valid assignment ID.',
        answerRequired: 'Answer required',
        enterYourAnswer: 'Please enter your answer.',
        submissionSuccessful: 'Your answer has been submitted successfully!',
        assignmentId: 'Assignment ID:',
        yourAnswer: 'Your answer:',
        result: 'Result:',
        correctAnswer: 'Correct answer:',
        submissionFailed: 'Failed to submit answer',
        checkAssignmentId: 'Check assignment ID and try again.'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        info(
          `📤 ${bold(msg.howToSubmit)}\n` +
          `${escapeMarkdownV2(msg.correctFormat)}\n` +
          `${code('/submit رقم_الواجب الإجابة')}\n` +
          `${escapeMarkdownV2(msg.example)}\n` +
          `${code('/submit 1 "إجابتي على السؤال"')}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const assignmentId = parseInt(args[1], 10);
    const answer = args.slice(2).join(' ');

    // Validate assignment ID
    if (isNaN(assignmentId) || assignmentId <= 0) {
      await ctx.reply(
        error(
          `${bold(msg.incorrectAssignmentId)}\n` +
          `${escapeMarkdownV2(msg.enterValidAssignmentId)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Validate answer
    if (!answer || answer.trim().length === 0) {
      await ctx.reply(
        error(
          `${bold(msg.answerRequired)}\n` +
          `${escapeMarkdownV2(msg.enterYourAnswer)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    // Submit answer
    const submitResult = await submitAnswer(userId, assignmentId, answer.trim());
    
    if (submitResult.success) {
      const resultEmoji = submitResult.score === 1 ? '✅' : '❌';
      await ctx.reply(
        success(
          `📤 ${bold(msg.submissionSuccessful)}\n\n` +
          `🆔 ${bold(msg.assignmentId)} ${assignmentId}\n` +
          `💬 ${bold(msg.yourAnswer)} ${escapeMarkdownV2(answer.trim())}\n` +
          `${resultEmoji} ${bold(msg.result)} ${escapeMarkdownV2(submitResult.message)}\n` +
          `✅ ${bold(msg.correctAnswer)} ${escapeMarkdownV2(submitResult.correctAnswer)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    } else {
      await ctx.reply(
        error(
          `${bold(msg.submissionFailed)}\n` +
          `${escapeMarkdownV2(submitResult.message || msg.checkAssignmentId)}`
        ),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
    }

  } catch (err) {
    logError(err, 'COMMAND_SUBMIT');
    
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