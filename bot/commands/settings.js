import { updateUserSettings, getUserSettings } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleSettings(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse command arguments
    const args = messageText.split(' ');
    
    if (args.length < 2) {
      // Show current settings
      const settings = await getUserSettings(userId);
      
      if (!settings) {
        await ctx.reply(
          `❌ *خطأ في تحميل الإعدادات*\\n\\n` +
          `لا يمكن تحميل إعداداتك الحالية\\.\\n` +
          `تأكد من أنك مسجل في البوت أولاً\\.`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const remindersStatus = settings.reminders_enabled ? '✅ مفعلة' : '❌ معطلة';
      const escapedStatus = escapeMarkdownV2(remindersStatus);
      
      await ctx.reply(
        `⚙️ *إعداداتك الشخصية*\\n\\n` +
        `🔔 *التذكيرات:* ${escapedStatus}\\n\\n` +
        `📝 *كيفية التغيير:*\\n` +
        `• \`/settings reminders on\` \\- تفعيل التذكيرات\\n` +
        `• \`/settings reminders off\` \\- إيقاف التذكيرات\\n\\n` +
        `💡 *معلومات:*\\n` +
        `• التذكيرات تشمل إشعارات الدروس والواجبات\\n` +
        `• يمكنك إضافة تذكيرات مخصصة باستخدام \`/addreminder\`\\n\\n` +
        `🔧 *أوامر أخرى:*\\n` +
        `• \`/profile\` \\- عرض ملفك الشخصي\\n` +
        `• \`/help\` \\- دليل المساعدة`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const settingType = args[1].toLowerCase();
    const settingValue = args[2]?.toLowerCase();

    // Handle reminders setting
    if (settingType === 'reminders') {
      if (!settingValue || !['on', 'off'].includes(settingValue)) {
        await ctx.reply(
          `❌ *قيمة غير صحيحة*\\n\\n` +
          `📝 *القيم المتاحة:*\\n` +
          `• \`on\` \\- تفعيل التذكيرات\\n` +
          `• \`off\` \\- إيقاف التذكيرات\\n\\n` +
          `💡 مثال: \`/settings reminders on\``,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const newValue = settingValue === 'on';
      const success = await updateUserSettings(userId, { reminders_enabled: newValue });
      
      if (success) {
        const status = newValue ? '✅ مفعلة' : '❌ معطلة';
        const escapedStatus = escapeMarkdownV2(status);
        
        await ctx.reply(
          `✅ *تم تحديث الإعدادات بنجاح*\\n\\n` +
          `🔔 *التذكيرات:* ${escapedStatus}\\n\\n` +
          `${newValue ? 
            '🔔 ستستلم تذكيرات للدروس والواجبات\\.' : 
            '🔕 لن تستلم تذكيرات للدروس والواجبات\\.'
          }\\n\\n` +
          `💡 يمكنك تغيير الإعدادات في أي وقت باستخدام \`/settings\``,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ *فشل في تحديث الإعدادات*\\n\\n` +
          `حدث خطأ تقني أثناء تحديث الإعدادات\\.\\n` +
          `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
          { parse_mode: 'MarkdownV2' }
        );
      }
      return;
    }

    // Unknown setting type
    await ctx.reply(
      `❌ *نوع إعداد غير معروف*\\n\\n` +
      `📝 *الإعدادات المتاحة:*\\n` +
      `• \`reminders\` \\- التذكيرات \\(on/off\\)\\n\\n` +
      `💡 *أمثلة:*\\n` +
      `• \`/settings reminders on\`\\n` +
      `• \`/settings reminders off\`\\n\\n` +
      `🔧 استخدم \`/settings\` لعرض إعداداتك الحالية\\.`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('خطأ في أمر /settings:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}