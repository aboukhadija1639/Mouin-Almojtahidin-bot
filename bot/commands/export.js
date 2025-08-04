import { exportAttendanceData, exportAssignmentsData } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleExport(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\\n\\n` +
        `هذا الأمر مخصص للمدراء فقط\\.\\n\\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `📊 *تصدير البيانات*\\n\\n` +
        `📝 *الصيغة الصحيحة:*\\n` +
        `\`/export نوع_البيانات\`\\n\\n` +
        `📋 *الأنواع المتاحة:*\\n` +
        `• \`attendance\` \\- بيانات الحضور\\n` +
        `• \`assignments\` \\- بيانات الواجبات\\n\\n` +
        `💡 *أمثلة:*\\n` +
        `• \`/export attendance\`\\n` +
        `• \`/export assignments\`\\n\\n` +
        `📄 سيتم إرسال البيانات بتنسيق CSV\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const exportType = args[1].toLowerCase();

    // Validate export type
    if (!['attendance', 'assignments'].includes(exportType)) {
      await ctx.reply(
        `❌ *نوع البيانات غير صحيح*\\n\\n` +
        `📋 *الأنواع المتاحة:*\\n` +
        `• \`attendance\` \\- بيانات الحضور\\n` +
        `• \`assignments\` \\- بيانات الواجبات\\n\\n` +
        `💡 مثال: \`/export attendance\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Get data based on type
    let data, filename, csvContent;

    if (exportType === 'attendance') {
      data = await exportAttendanceData();
      filename = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Create CSV content for attendance
      csvContent = 'User ID,Username,First Name,Lesson Title,Date,Time,Attended At\n';
      data.forEach(record => {
        const row = [
          record.user_id || '',
          `"${(record.username || '').replace(/"/g, '""')}"`,
          `"${(record.first_name || '').replace(/"/g, '""')}"`,
          `"${(record.lesson_title || '').replace(/"/g, '""')}"`,
          record.date || '',
          record.time || '',
          record.attended_at || ''
        ].join(',');
        csvContent += row + '\n';
      });
    } else if (exportType === 'assignments') {
      data = await exportAssignmentsData();
      filename = `assignments_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Create CSV content for assignments
      csvContent = 'User ID,Username,First Name,Assignment Title,Answer,Submitted At,Score\n';
      data.forEach(record => {
        const row = [
          record.user_id || '',
          `"${(record.username || '').replace(/"/g, '""')}"`,
          `"${(record.first_name || '').replace(/"/g, '""')}"`,
          `"${(record.assignment_title || '').replace(/"/g, '""')}"`,
          `"${(record.answer || '').replace(/"/g, '""')}"`,
          record.submitted_at || '',
          record.score || ''
        ].join(',');
        csvContent += row + '\n';
      });
    }

    // Check if data exists
    if (!data || data.length === 0) {
      const escapedType = escapeMarkdownV2(exportType);
      await ctx.reply(
        `📭 *لا توجد بيانات للتصدير*\\n\\n` +
        `لا توجد بيانات من نوع \`${escapedType}\` للتصدير\\.\\n\\n` +
        `💡 تأكد من وجود بيانات في النظام أولاً\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Create file buffer
    const buffer = Buffer.from(csvContent, 'utf-8');
    
    // Send file
    const escapedFilename = escapeMarkdownV2(filename);
    const escapedCount = escapeMarkdownV2(data.length.toString());
    
    await ctx.replyWithDocument(
      { source: buffer, filename: filename },
      {
        caption: `📊 *تم تصدير البيانات بنجاح*\\n\\n` +
          `📄 *اسم الملف:* ${escapedFilename}\\n` +
          `📊 *عدد السجلات:* ${escapedCount}\\n` +
          `📅 *تاريخ التصدير:* ${escapeMarkdownV2(new Date().toLocaleDateString('ar-SA'))}\\n\\n` +
          `💡 يمكنك فتح الملف في Excel أو Google Sheets\\.`,
        parse_mode: 'MarkdownV2'
      }
    );

  } catch (error) {
    console.error('خطأ في أمر /export:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}