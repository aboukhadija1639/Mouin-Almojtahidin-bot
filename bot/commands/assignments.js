import { getAssignments } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleAssignments(ctx) {
  try {
    const assignments = await getAssignments();
    if (!assignments || assignments.length === 0) {
      await ctx.reply(
        `📝 *${escapeMarkdownV2('قائمة الواجبات')}*\n━━━━━━━━━━━━━━━━━━━━\n${escapeMarkdownV2('لا توجد واجبات حالياً.')}\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const now = new Date();
    let active = [], past = [];
    assignments.forEach(assignment => {
      const deadline = new Date(assignment.deadline);
      const formattedDeadline = deadline.toLocaleDateString('ar-SA') + ' - ' + deadline.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      const status = deadline > now ? `⏳ ${escapeMarkdownV2('المتبقي:')} ${daysLeft} ${escapeMarkdownV2('أيام')}` : '⏰ ' + escapeMarkdownV2('انتهى');
      const item = `*🆔 ${escapeMarkdownV2('الواجب رقم')} ${assignment.assignment_id}*\n` +
        `📋 ${escapeMarkdownV2('العنوان:')} ${escapeMarkdownV2(assignment.title)}\n` +
        `❓ ${escapeMarkdownV2('السؤال:')} ${escapeMarkdownV2(assignment.question)}\n` +
        `⏰ ${escapeMarkdownV2('الموعد النهائي:')} ${escapeMarkdownV2(formattedDeadline)}\n` +
        `${status}\n` +
        `✅ ${escapeMarkdownV2('للإجابة:')} /submit ${assignment.assignment_id} إجابتك`;
      if (deadline > now) active.push(item);
      else past.push(item);
    });
    let message = `📝 *${escapeMarkdownV2('قائمة الواجبات المتاحة')}*\n━━━━━━━━━━━━━━━━━━━━`;
    if (active.length > 0) {
      message += `\n🟢 *${escapeMarkdownV2('الواجبات النشطة:')}*\n${active.join('\n\n')}\n`;
    }
    if (past.length > 0) {
      message += `\n🔴 *${escapeMarkdownV2('الواجبات المنتهية:')}*\n${past.join('\n\n')}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 ${escapeMarkdownV2('إجمالي الواجبات:')} ${assignments.length}\n`;
    message += `🟢 ${escapeMarkdownV2('النشطة:')} ${active.length}\n`;
    message += `🔴 ${escapeMarkdownV2('المنتهية:')} ${past.length}\n`;
    message += `💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`;
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (error) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('./data/error.log', `[ASSIGNMENTS] ${new Date().toISOString()}\n${error.stack || error}\n`);
    } catch (e) {}
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}