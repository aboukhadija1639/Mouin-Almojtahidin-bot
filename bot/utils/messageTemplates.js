// bot/utils/messageTemplates.js

import { escapeMarkdownV2, bold, italic, code } from './escapeMarkdownV2.js';

/**
 * 🎨 Professional Message Templates for Enhanced User Experience
 * Provides consistent, emoji-rich, Arabic RTL formatted messages
 */

// ✨ General Templates
export const templates = {
  /**
   * 🎉 Success message template
   */
  success: (title, description = '', nextStep = '') => {
    let message = `✅ ${bold(escapeMarkdownV2(title))}\n`;
    
    if (description) {
      message += `\n${escapeMarkdownV2(description)}\n`;
    }
    
    if (nextStep) {
      message += `\n${italic(escapeMarkdownV2(nextStep))} 🎯`;
    }
    
    return message;
  },

  /**
   * ❌ Error message template
   */
  error: (title, description = '', solution = '') => {
    let message = `❌ ${bold(escapeMarkdownV2(title))}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (description) {
      message += `🔍 ${bold('التفاصيل:')} ${escapeMarkdownV2(description)}\n\n`;
    }
    
    if (solution) {
      message += `💡 ${bold('الحل المقترح:')} ${escapeMarkdownV2(solution)}`;
    }
    
    return message;
  },

  /**
   * ℹ️ Information message template
   */
  info: (title, content, tip = '') => {
    let message = `ℹ️ ${bold(escapeMarkdownV2(title))}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${escapeMarkdownV2(content)}\n`;
    
    if (tip) {
      message += `\n💡 ${italic(escapeMarkdownV2(tip))}`;
    }
    
    return message;
  },

  /**
   * 🚫 Permission denied template
   */
  accessDenied: (reason = 'هذا الأمر مخصص للمدراء فقط', supportChannel = '') => {
    let message = `🚫 ${bold('غير مسموح')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${escapeMarkdownV2(reason)}\n\n`;
    
    if (supportChannel) {
      message += `📞 ${bold('للمساعدة:')} ${escapeMarkdownV2(supportChannel)}`;
    }
    
    return message;
  },

  /**
   * 🔄 Loading/processing template
   */
  processing: (action = 'جاري المعالجة') => {
    return `🔄 ${bold(escapeMarkdownV2(action))}\n${italic('يرجى الانتظار...')} ⏳`;
  }
};

// 📚 Course Templates
export const courseTemplates = {
  /**
   * Course created successfully
   */
  created: ({ name, description, id }) => {
    let message = `✅ ${bold('تم إضافة الدورة بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📚 ${bold('اسم الدورة:')} ${escapeMarkdownV2(name)}\n`;
    
    if (description) {
      message += `📝 ${bold('الوصف:')} ${escapeMarkdownV2(description)}\n`;
    }
    
    if (id) {
      message += `🆔 ${bold('المعرف:')} ${code(id)}\n`;
    }
    
    message += `\n${italic('يمكنك الآن إدارة الدورة من خلال القائمة الرئيسية')} 🎯`;
    
    return message;
  },

  /**
   * Course updated successfully
   */
  updated: ({ id, field, oldValue, newValue }) => {
    let message = `✅ ${bold('تم تحديث الدورة بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم الدورة:')} ${code(id)}\n`;
    message += `🔄 ${bold('الحقل المحدث:')} ${escapeMarkdownV2(field)}\n`;
    message += `📝 ${bold('القيمة الجديدة:')} ${escapeMarkdownV2(newValue)}\n`;
    
    if (oldValue) {
      message += `📋 ${bold('القيمة السابقة:')} ${escapeMarkdownV2(oldValue)}\n`;
    }
    
    message += `\n${italic('تم حفظ التغييرات بنجاح')} ✨`;
    
    return message;
  },

  /**
   * Course deleted successfully
   */
  deleted: ({ id, name }) => {
    let message = `✅ ${bold('تم حذف الدورة بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم الدورة المحذوفة:')} ${code(id)}\n`;
    message += `📚 ${bold('اسم الدورة:')} ${escapeMarkdownV2(name)}\n`;
    message += `\n${italic('تم حذف جميع البيانات المرتبطة بالدورة')} 🗑️`;
    
    return message;
  },

  /**
   * Course list display
   */
  list: (courses) => {
    let message = `📚 ${bold('قائمة الدورات المتاحة')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (courses.length === 0) {
      message += `${italic('لا توجد دورات متاحة حالياً')} 📭\n\n`;
      message += `💡 ${bold('للبدء:')} تواصل مع المدير لإضافة دورات جديدة`;
    } else {
      courses.forEach((course, index) => {
        message += `${index + 1}\\. 📖 ${bold(escapeMarkdownV2(course.name))}\n`;
        if (course.description) {
          message += `   📝 ${escapeMarkdownV2(course.description)}\n`;
        }
        if (course.id) {
          message += `   🆔 ${code(course.id)}\n`;
        }
        message += `\n`;
      });
      
      message += `🎯 ${italic('اختر دورة للبدء في التعلم!')}`;
    }
    
    return message;
  }
};

// ⏰ Reminder Templates
export const reminderTemplates = {
  /**
   * Reminder created successfully
   */
  created: ({ datetime, message: reminderMessage, id }) => {
    let message = `✅ ${bold('تم إضافة التذكير!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `⏰ ${bold('الوقت:')} ${code(datetime)}\n`;
    message += `💬 ${bold('الرسالة:')} ${escapeMarkdownV2(reminderMessage)}\n`;
    
    if (id) {
      message += `🆔 ${bold('رقم التذكير:')} ${code(id)}\n`;
    }
    
    message += `\n${italic('سيتم إرسال التذكير في الوقت المحدد')} ⏳`;
    
    return message;
  },

  /**
   * Reminder notification
   */
  notification: ({ message: reminderMessage, course, urgent = false }) => {
    const emoji = urgent ? '🚨' : '⏰';
    let message = `${emoji} ${bold('تذكير مهم!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💬 ${escapeMarkdownV2(reminderMessage)}\n`;
    
    if (course) {
      message += `📚 ${bold('الدورة:')} ${escapeMarkdownV2(course)}\n`;
    }
    
    message += `\n🕐 ${italic('الوقت الحالي:')} ${new Date().toLocaleString('ar-SA')}\n`;
    message += `💡 ${italic('لا تنس المتابعة!')} 🎯`;
    
    return message;
  },

  /**
   * Reminder updated
   */
  updated: ({ id, field, newValue }) => {
    let message = `✅ ${bold('تم تحديث التذكير!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم التذكير:')} ${code(id)}\n`;
    message += `🔄 ${bold('الحقل المحدث:')} ${escapeMarkdownV2(field)}\n`;
    message += `📝 ${bold('القيمة الجديدة:')} ${escapeMarkdownV2(newValue)}`;
    
    return message;
  },

  /**
   * Reminder deleted
   */
  deleted: ({ id, message: reminderMessage }) => {
    let message = `✅ ${bold('تم حذف التذكير!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم التذكير المحذوف:')} ${code(id)}\n`;
    message += `💬 ${bold('نص التذكير:')} ${escapeMarkdownV2(reminderMessage)}`;
    
    return message;
  }
};

// 📝 Assignment Templates
export const assignmentTemplates = {
  /**
   * Assignment created successfully
   */
  created: ({ id, courseId, title, question, deadline }) => {
    let message = `✅ ${bold('تم إضافة الواجب بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم الواجب:')} ${code(id)}\n`;
    message += `📚 ${bold('رقم الدورة:')} ${code(courseId)}\n`;
    message += `📝 ${bold('العنوان:')} ${escapeMarkdownV2(title)}\n`;
    message += `❓ ${bold('السؤال:')} ${escapeMarkdownV2(question)}\n`;
    message += `📅 ${bold('الموعد النهائي:')} ${code(deadline)}\n`;
    message += `\n🎯 ${italic('الآن يمكن للطلاب تقديم إجاباتهم!')}`;
    
    return message;
  },

  /**
   * Assignment answer submitted
   */
  submitted: ({ message: feedbackMessage, correctAnswer, score, isCorrect }) => {
    const emoji = isCorrect ? '🎉' : '💪';
    const title = isCorrect ? 'إجابة ممتازة!' : 'شكراً على المحاولة!';
    
    let message = `📝 ${bold('تم إرسال إجابتك بنجاح')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (feedbackMessage) {
      message += `${feedbackMessage}\n\n`;
    }
    
    message += `✅ ${bold('الإجابة الصحيحة:')} ${escapeMarkdownV2(correctAnswer)}\n`;
    message += `📊 ${bold('نقاطك:')} ${code(`${score}/1`)}\n\n`;
    message += `${emoji} ${bold(title)}\n`;
    message += `${italic('شكرًا على المشاركة!')} 🙏`;
    
    return message;
  },

  /**
   * Assignment updated
   */
  updated: ({ id, field, newValue }) => {
    let message = `✅ ${bold('تم تحديث الواجب بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم الواجب:')} ${code(id)}\n`;
    message += `🔄 ${bold('الحقل المحدث:')} ${escapeMarkdownV2(field)}\n`;
    message += `📝 ${bold('القيمة الجديدة:')} ${escapeMarkdownV2(newValue)}`;
    
    return message;
  },

  /**
   * Assignment deleted
   */
  deleted: ({ id, title }) => {
    let message = `✅ ${bold('تم حذف الواجب بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 ${bold('رقم الواجب المحذوف:')} ${code(id)}\n`;
    message += `📝 ${bold('عنوان الواجب:')} ${escapeMarkdownV2(title)}\n`;
    message += `\n${italic('تم حذف جميع الإجابات المرتبطة بالواجب')} 🗑️`;
    
    return message;
  }
};

// ✋ Attendance Templates
export const attendanceTemplates = {
  /**
   * Attendance recorded successfully
   */
  recorded: ({ studentName, courseId, courseName, date, status }) => {
    const emoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : '⚠️';
    const statusText = status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : 'متأخر';
    
    let message = `${emoji} ${bold('تم تسجيل الحضور!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 ${bold('الطالب:')} ${escapeMarkdownV2(studentName)}\n`;
    message += `📚 ${bold('الدورة:')} ${escapeMarkdownV2(courseName)} ${code(`(${courseId})`)}\n`;
    message += `📅 ${bold('التاريخ:')} ${code(date)}\n`;
    message += `📊 ${bold('الحالة:')} ${bold(statusText)}\n`;
    message += `\n${italic('تم حفظ السجل بنجاح')} 📝`;
    
    return message;
  },

  /**
   * Attendance report
   */
  report: ({ courseName, attendanceData, totalStudents, presentCount }) => {
    let message = `📊 ${bold('تقرير الحضور')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📚 ${bold('الدورة:')} ${escapeMarkdownV2(courseName)}\n`;
    message += `👥 ${bold('إجمالي الطلاب:')} ${code(totalStudents)}\n`;
    message += `✅ ${bold('الحاضرون:')} ${code(presentCount)}\n`;
    message += `❌ ${bold('الغائبون:')} ${code(totalStudents - presentCount)}\n`;
    message += `📈 ${bold('نسبة الحضور:')} ${code(`${Math.round((presentCount / totalStudents) * 100)}%`)}\n`;
    message += `\n${italic('يمكنك عرض التفاصيل الكاملة من لوحة التحكم')} 🎯`;
    
    return message;
  }
};

// 🎉 Welcome & Help Templates
export const welcomeTemplates = {
  /**
   * Welcome new user
   */
  newUser: (userName, botName) => {
    let message = `🎉 ${bold('أهلاً وسهلاً!')} ${escapeMarkdownV2(userName)}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👋 مرحباً بك في ${bold(escapeMarkdownV2(botName))}\n`;
    message += `📚 ${bold('ما يمكنك فعله:')}\n`;
    message += `• 📖 استعراض الدورات المتاحة\n`;
    message += `• ⏰ إضافة تذكيرات شخصية\n`;
    message += `• 📝 حل الواجبات والاختبارات\n`;
    message += `• ✋ تسجيل الحضور\n`;
    message += `• ⚙️ تخصيص الإعدادات\n\n`;
    message += `🚀 ${italic('استخدم')} ${code('/help')} ${italic('لعرض جميع الأوامر المتاحة')}\n`;
    message += `💡 ${italic('أو اختر من القائمة أدناه للبدء!')} 🎯`;
    
    return message;
  },

  /**
   * Welcome back returning user
   */
  returningUser: (userName, lastSeen) => {
    let message = `🏠 ${bold('مرحباً بعودتك!')} ${escapeMarkdownV2(userName)}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (lastSeen) {
      message += `🕐 ${bold('آخر زيارة:')} ${escapeMarkdownV2(lastSeen)}\n\n`;
    }
    
    message += `📚 ${italic('ما الجديد اليوم؟')}\n`;
    message += `• ✨ تحديثات جديدة في الدورات\n`;
    message += `• 📝 واجبات جديدة في انتظارك\n`;
    message += `• ⏰ تذكيرات مهمة\n\n`;
    message += `🎯 ${italic('استخدم القائمة أدناه للمتابعة!')}`;
    
    return message;
  },

  /**
   * Help message
   */
  help: () => {
    let message = `📖 ${bold('دليل الاستخدام')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 ${bold('الأوامر العامة:')}\n`;
    message += `• ${code('/start')} \\- البدء أو العودة للقائمة الرئيسية\n`;
    message += `• ${code('/help')} \\- عرض هذا الدليل\n`;
    message += `• ${code('/profile')} \\- عرض ملفك الشخصي\n`;
    message += `• ${code('/settings')} \\- إعدادات البوت\n\n`;
    
    message += `📚 ${bold('الدورات والتعلم:')}\n`;
    message += `• ${code('/courses')} \\- استعراض الدورات المتاحة\n`;
    message += `• ${code('/submit [id] [answer]')} \\- إرسال إجابة واجب\n\n`;
    
    message += `⏰ ${bold('التذكيرات:')}\n`;
    message += `• ${code('/addreminder [time] [message]')} \\- إضافة تذكير\n`;
    message += `• ${code('/reminders')} \\- عرض تذكيراتك\n\n`;
    
    message += `✋ ${bold('الحضور:')}\n`;
    message += `• ${code('/attendance')} \\- تسجيل أو عرض الحضور\n\n`;
    
    message += `📊 ${bold('الإحصائيات:')}\n`;
    message += `• ${code('/stats')} \\- عرض إحصائياتك\n\n`;
    
    message += `💡 ${italic('تلميح: يمكنك استخدام الأزرار في القائمة بدلاً من كتابة الأوامر!')}`;
    
    return message;
  }
};

// 📢 Announcement Templates
export const announcementTemplates = {
  /**
   * New announcement published
   */
  published: ({ content, successCount, failCount }) => {
    let message = `✅ ${bold('تم نشر الإعلان بنجاح!')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 ${bold('تفاصيل الإرسال:')}\n`;
    message += `• 📤 تم الإرسال بنجاح: ${code(successCount)}\n`;
    
    if (failCount > 0) {
      message += `• ❌ فشل في الإرسال: ${code(failCount)}\n`;
    }
    
    message += `\n📝 ${bold('محتوى الإعلان:')}\n`;
    message += `${escapeMarkdownV2(content)}\n\n`;
    message += `🎯 ${italic('تم إرسال الإعلان لجميع المستخدمين المفعلين')}`;
    
    return message;
  },

  /**
   * Announcement to users
   */
  toUsers: (content) => {
    let message = `📢 ${bold('إعلان جديد')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${escapeMarkdownV2(content)}\n\n`;
    message += `🤖 ${italic('بوت معين المجتهدين')}`;
    
    return message;
  }
};

// 🛠️ System Templates
export const systemTemplates = {
  /**
   * Maintenance message
   */
  maintenance: (estimatedTime = '') => {
    let message = `🛠️ ${bold('البوت قيد الصيانة')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${italic('نعتذر عن الإزعاج، نحن نعمل على تحسين الخدمة')}\n\n`;
    
    if (estimatedTime) {
      message += `⏰ ${bold('الوقت المقدر للانتهاء:')} ${escapeMarkdownV2(estimatedTime)}\n\n`;
    }
    
    message += `💡 ${italic('سيعود البوت للعمل قريباً، شكراً لصبركم')} 🙏`;
    
    return message;
  },

  /**
   * Feature unavailable
   */
  featureUnavailable: (featureName, reason = '') => {
    let message = `⚠️ ${bold('الميزة غير متاحة حالياً')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🔧 ${bold('الميزة:')} ${escapeMarkdownV2(featureName)}\n`;
    
    if (reason) {
      message += `📋 ${bold('السبب:')} ${escapeMarkdownV2(reason)}\n`;
    }
    
    message += `\n💡 ${italic('يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني')}`;
    
    return message;
  }
};

/**
 * 🎨 Helper function to create consistent formatting
 */
export function createFormattedMessage(title, content, footer = '', type = 'info') {
  const emojis = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    loading: '🔄'
  };
  
  let message = `${emojis[type] || 'ℹ️'} ${bold(escapeMarkdownV2(title))}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `${escapeMarkdownV2(content)}\n`;
  
  if (footer) {
    message += `\n${italic(escapeMarkdownV2(footer))}`;
  }
  
  return message;
}