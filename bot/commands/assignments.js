import { getAssignments } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold } from '../utils/escapeMarkdownV2.js';

export async function handleAssignments(ctx) {
  try {
    const result = await getAssignments();
    if (!result.success || !result.data || result.data.length === 0) {
      await ctx.reply(
        `📝 ${bold('قائمة الواجبات')}\n${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n${escapeMarkdownV2('لا توجد واجبات حالياً.')}\n💡 ${escapeMarkdownV2('للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    const assignments = result.data;
    const now = new Date();
    let active = [], past = [];
    assignments.forEach(assignment => {
      const deadline = new Date(assignment.deadline || assignment.due_date);
      const formattedDeadline = deadline.toLocaleDateString('ar-SA') + ' - ' + deadline.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      const status = deadline > now ? `⏳ ${escapeMarkdownV2('المتبقي:')} ${daysLeft} ${escapeMarkdownV2('أيام')}` : '⏰ ' + escapeMarkdownV2('انتهى');
      const item = `${bold(`🆔 الواجب رقم ${assignment.assignment_id}`)}\n` +
        `${escapeMarkdownV2('📋 العنوان:')} ${escapeMarkdownV2(assignment.title)}\n` +
        `${escapeMarkdownV2('❓ السؤال:')} ${escapeMarkdownV2(assignment.question)}\n` +
        `${escapeMarkdownV2('⏰ الموعد النهائي:')} ${escapeMarkdownV2(formattedDeadline)}\n` +
        `${status}\n` +
        `${escapeMarkdownV2('✅ للإجابة:')} /submit ${assignment.assignment_id} إجابتك`;
      if (deadline > now) active.push(item);
      else past.push(item);
    });
    let message = `📝 ${bold('قائمة الواجبات المتاحة')}\n${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}`;
    if (active.length > 0) {
      message += `\n🟢 ${bold('الواجبات النشطة:')}\n${active.join('\n')}\n`;
    }
    if (past.length > 0) {
      message += `\n🔴 ${bold('الواجبات المنتهية:')}\n${past.join('\n')}\n`;
    }
    message += `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n`;
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
    await ctx.reply(`❌ ${escapeMarkdownV2('حدث خطأ، حاول مرة أخرى أو تواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`, { parse_mode: 'MarkdownV2' });
  }
}