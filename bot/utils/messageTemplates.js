// bot/utils/messageTemplates.js

import { escapeMarkdownV2, bold, italic, code } from './escapeMarkdownV2.js';

// Generic wrappers
export const templates = {
  success: (title, details = '') => (
    `✅ ${bold(escapeMarkdownV2(title))}\n\n${details}`
  ),
  error: (title, reason = '', hint = '') => (
    `❌ ${bold(escapeMarkdownV2(title))}\n` +
    (reason ? `🔍 ${bold('السبب:')} ${escapeMarkdownV2(reason)}\n` : '') +
    (hint ? `💡 ${bold('الحل:')} ${escapeMarkdownV2(hint)}` : '')
  ),
  info: (title, body = '', extra = '') => (
    `ℹ️ ${bold(escapeMarkdownV2(title))}\n\n${escapeMarkdownV2(body)}${extra ? `\n\n📋 ${italic(escapeMarkdownV2(extra))}` : ''}`
  )
};

// Domain-specific builders
export const courseTemplates = {
  created: ({ name, description, id }) => templates.success(
    'تم إضافة الدورة بنجاح\!',
    `📚 ${bold('اسم الدورة:')} ${escapeMarkdownV2(name)}\n` +
    (description ? `📝 ${bold('الوصف:')} ${escapeMarkdownV2(description)}\n` : '') +
    (id ? `🆔 ${bold('المعرف:')} ${id}\n` : '') +
    `\n${italic('يمكنك الآن إدارة الدورة من خلال القائمة الرئيسية')} 🎯`
  ),
  updated: ({ name, field }) => templates.success(
    'تم تحديث الدورة',
    `📚 ${bold('الدورة:')} ${escapeMarkdownV2(name)}\n` +
    `✏️ ${bold('الحقل المحدث:')} ${escapeMarkdownV2(field)}`
  ),
  deleted: ({ name }) => templates.success(
    'تم حذف الدورة',
    `📚 ${bold('الدورة:')} ${escapeMarkdownV2(name)}`
  )
};

export const reminderTemplates = {
  created: ({ datetime, message }) => templates.success(
    'تم إضافة التذكير\!',
    `⏰ ${bold('الوقت:')} ${escapeMarkdownV2(datetime)}\n` +
    `💬 ${bold('الرسالة:')} ${escapeMarkdownV2(message)}`
  ),
  deleted: ({ id }) => templates.success(
    'تم حذف التذكير',
    `🆔 ${bold('معرف التذكير:')} ${escapeMarkdownV2(String(id))}`
  ),
  listHeader: () => `⏰ ${bold('تذكيراتك الحالية:')}`
};

export const assignmentTemplates = {
  created: ({ title, dueDate }) => templates.success(
    'تم إضافة الواجب\!',
    `📝 ${bold('العنوان:')} ${escapeMarkdownV2(title)}\n` +
    (dueDate ? `📅 ${bold('الموعد:')} ${escapeMarkdownV2(dueDate)}` : '')
  ),
  submitted: ({ message, correctAnswer, score }) => (
    `📝 ${bold('تم إرسال إجابتك بنجاح')}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${escapeMarkdownV2(message)}\n` +
    `✅ ${bold('الإجابة الصحيحة:')} ${escapeMarkdownV2(correctAnswer)}\n` +
    `📊 ${bold('نقاطك:')} ${escapeMarkdownV2(String(score))}/1\n` +
    `🎉 ${escapeMarkdownV2('شكرًا على المشاركة!')}`
  )
};

export const attendanceTemplates = {
  recorded: ({ lessonTitle, date, time }) => templates.success(
    'تم تسجيل الحضور',
    `✋ ${bold('الدرس:')} ${escapeMarkdownV2(lessonTitle)}\n` +
    `📅 ${bold('التاريخ:')} ${escapeMarkdownV2(date)} | ⏰ ${escapeMarkdownV2(time)}`
  )
};

export const profileTemplates = {
  header: (name) => `👤 ${bold(`ملف ${escapeMarkdownV2(name)}`)}`
};

export default {
  templates,
  courseTemplates,
  reminderTemplates,
  assignmentTemplates,
  attendanceTemplates,
  profileTemplates
};