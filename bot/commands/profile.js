import { getUserInfo, getUserAttendance, getUserSubmissions } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleProfile(ctx) {
  try {
    const userId = ctx.from.id;

    // Get user information from database
    const userInfo = await getUserInfo(userId);
    
    if (!userInfo) {
      await ctx.reply(
        `❌ *لم يتم العثور على ملفك الشخصي*\n\n` +
        `يرجى استخدام /start لتسجيل حسابك أولاً.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get attendance and submission counts
    const attendanceCount = await getUserAttendance(userId);
    const submissionsCount = await getUserSubmissions(userId);

    // Format join date
    const joinDate = new Date(userInfo.join_date).toLocaleDateString('ar-SA');

    // Build profile message
    let message = `👤 *ملفك الشخصي*\n\n`;
    
    message += `📝 *المعلومات الأساسية:*\n`;
    message += `• الاسم: ${userInfo.first_name}\n`;
    message += `• المعرف: ${userInfo.username ? '@' + userInfo.username : 'غير محدد'}\n`;
    message += `• رقم المستخدم: \`${userInfo.user_id}\`\n`;
    message += `• تاريخ الانضمام: ${joinDate}\n\n`;
    
    message += `✅ *حالة الحساب:*\n`;
    message += `• التفعيل: ${userInfo.is_verified ? '✅ مفعل' : '❌ غير مفعل'}\n`;
    message += `• التذكيرات: ${userInfo.reminders_enabled ? '🔔 مفعلة' : '🔕 معطلة'}\n\n`;
    
    message += `📊 *الإحصائيات:*\n`;
    message += `• عدد الحضور: ${attendanceCount} درس\n`;
    message += `• الواجبات المرسلة: ${submissionsCount} واجب\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `💡 للمساعدة: ${config.admin.supportChannel}`;

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /profile:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}