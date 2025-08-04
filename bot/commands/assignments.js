import { getAllAssignments } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleAssignments(ctx) {
  try {
    // Get all assignments from database
    const assignments = await getAllAssignments();

    if (assignments.length === 0) {
      await ctx.reply(
        `📝 *قائمة الواجبات*\\n\\n` +
        `لا توجد واجبات مضافة حالياً\\.\n\n` +
        `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    // Build assignments message
    let message = `📝 *قائمة الواجبات المتاحة*\\n\\n`;
    
    let activeAssignments = [];
    let expiredAssignments = [];
    const now = new Date();

    assignments.forEach((assignment) => {
      // Escape special characters for MarkdownV2
      const escapedTitle = assignment.title.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
      const escapedQuestion = assignment.question.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
      
      let assignmentInfo = `🆔 *الواجب رقم ${assignment.assignment_id}*\\n`;
      assignmentInfo += `📋 العنوان: ${escapedTitle}\\n`;
      assignmentInfo += `❓ السؤال: ${escapedQuestion}\\n`;
      
      if (assignment.deadline) {
        const deadlineDate = new Date(assignment.deadline);
        const formattedDeadline = deadlineDate.toLocaleDateString('ar-SA');
        const formattedTime = deadlineDate.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        assignmentInfo += `⏰ الموعد النهائي: ${formattedDeadline} \\- ${formattedTime}\\n`;
        
        if (deadlineDate > now) {
          const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
          assignmentInfo += `⏳ المتبقي: ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}\\n`;
          assignmentInfo += `\\n✅ *للإجابة:* \`/submit ${assignment.assignment_id} إجابتك\`\\n`;
          activeAssignments.push(assignmentInfo);
        } else {
          assignmentInfo += `❌ *انتهى الموعد النهائي*\\n`;
          expiredAssignments.push(assignmentInfo);
        }
      } else {
        assignmentInfo += `⏰ بدون موعد نهائي\\n`;
        assignmentInfo += `\\n✅ *للإجابة:* \`/submit ${assignment.assignment_id} إجابتك\`\\n`;
        activeAssignments.push(assignmentInfo);
      }
    });

    // Add active assignments
    if (activeAssignments.length > 0) {
      message += `🟢 *الواجبات النشطة:*\\n\\n`;
      message += activeAssignments.join('\\n━━━━━━━━━━━━━━━━━━━━\\n\\n');
      message += `\\n`;
    }

    // Add expired assignments
    if (expiredAssignments.length > 0) {
      message += `🔴 *الواجبات المنتهية الصلاحية:*\\n\\n`;
      message += expiredAssignments.join('\\n━━━━━━━━━━━━━━━━━━━━\\n\\n');
      message += `\\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\\n\\n`;
    message += `📊 إجمالي الواجبات: ${assignments.length}\\n`;
    message += `🟢 النشطة: ${activeAssignments.length}\\n`;
    message += `🔴 المنتهية: ${expiredAssignments.length}\\n\\n`;
    message += `💡 *مثال للإجابة:* \`/submit 1 هذه إجابتي\`\\n\\n`;
    message += `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /assignments:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}