import { toggleUserReminders, getUserInfo } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleReminders(ctx) {
  try {
    const userId = ctx.from.id;

    // Get current user info
    const userInfo = await getUserInfo(userId);
    
    if (!userInfo) {
      await ctx.reply(
        `❌ *لم يتم العثور على ملفك الشخصي*\\n\\n` +
        `يرجى استخدام /start لتسجيل حسابك أولاً\\.\n\n` +
        `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    if (!userInfo.is_verified) {
      await ctx.reply(
        `🚫 *غير مسموح*\\n\\n` +
        `يجب تفعيل حسابك أولاً باستخدام /verify\\.\n\n` +
        `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    // Toggle reminders
    const result = await toggleUserReminders(userId);
    
    if (!result.success) {
      await ctx.reply(
        `❌ *فشل في تحديث التذكيرات*\\n\\n` +
        `${result.message}\\n\\n` +
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true 
        }
      );
      return;
    }

    // Build success message
    const statusIcon = result.remindersEnabled ? '🔔' : '🔕';
    const statusText = result.remindersEnabled ? 'مفعلة' : 'معطلة';
    const actionText = result.remindersEnabled ? 'تفعيل' : 'إيقاف';
    
    let message = `${statusIcon} *تم ${actionText} التذكيرات بنجاح*\\n\\n`;
    
    message += `📊 *حالة التذكيرات الحالية:*\\n`;
    message += `• الحالة: ${statusIcon} ${statusText}\\n\\n`;
    
    if (result.remindersEnabled) {
      message += `✅ *ستتلقى الآن تذكيرات بـ:*\\n`;
      message += `• الدروس القادمة \\(قبل 24 ساعة وساعة واحدة\\)\\n`;
      message += `• الإعلانات المهمة\\n`;
      message += `• مواعيد تسليم الواجبات\\n\\n`;
      message += `💡 *ملاحظة:* التذكيرات ستُرسل كرسائل خاصة ومذكورات في المجموعة\\n\\n`;
    } else {
      message += `❌ *لن تتلقى الآن:*\\n`;
      message += `• تذكيرات الدروس\\n`;
      message += `• الإعلانات التلقائية\\n`;
      message += `• تذكيرات الواجبات\\n\\n`;
      message += `⚠️ *ملاحظة:* يمكنك تفعيل التذكيرات مرة أخرى باستخدام نفس الأمر\\n\\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━\\n\\n`;
    message += `🔄 استخدم /reminders مرة أخرى لتبديل الحالة\\n`;
    message += `👤 استخدم /profile لعرض ملفك الشخصي\\n\\n`;
    message += `💡 للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /reminders:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}