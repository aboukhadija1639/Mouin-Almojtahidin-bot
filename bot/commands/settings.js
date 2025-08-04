import { updateUserSettings, getUserSettings } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';

export async function handleSettings(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const args = messageText.split(' ');

    // إذا لم تُرسل إعدادات، عرض الإعداد الحالي
    if (args.length < 2) {
      const settings = await getUserSettings(userId);

      if (!settings) {
        await ctx.reply(
          `❌ *${escapeMarkdownV2('لا يمكن تحميل إعداداتك')}*\n` +
          `${escapeMarkdownV2('تأكد من أنك بدأت البوت باستخدام /start')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const remindersStatus = settings.reminders_enabled ? '✅ مفعلة' : '❌ معطلة';

      await ctx.reply(
        `⚙️ *${escapeMarkdownV2('إعداداتك')}*\n` +
        `🔔 *التذكيرات:* ${remindersStatus}\n\n` +
        `🛠️ لتغيير التذكيرات:\n` +
        `• \`/settings reminders on\` لتفعيل التذكيرات\n` +
        `• \`/settings reminders off\` لإيقاف التذكيرات\n\n` +
        `💡 يمكنك إضافة تذكيرات خاصة باستخدام \`/addreminder\``,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const settingType = args[1]?.toLowerCase();
    const settingValue = args[2]?.toLowerCase();

    if (settingType === 'reminders') {
      if (!['on', 'off'].includes(settingValue)) {
        await ctx.reply(
          `❌ *قيمة غير صحيحة*\n` +
          `📝 استخدم:\n` +
          `• \`/settings reminders on\`\n` +
          `• \`/settings reminders off\``,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const newValue = settingValue === 'on';
      const success = await updateUserSettings(userId, { reminders_enabled: newValue });

      if (success) {
        const status = newValue ? '✅ تم تفعيل التذكيرات' : '🔕 تم إيقاف التذكيرات';
        await ctx.reply(
          `✅ *${escapeMarkdownV2('تم تحديث إعداداتك بنجاح')}*\n${status}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ *${escapeMarkdownV2('حدث خطأ أثناء تحديث الإعدادات')}*\n` +
          `يرجى المحاولة لاحقًا أو التواصل مع الدعم: ${escapeMarkdownV2(config.admin.supportChannel)}`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      return;
    }

    // إعداد غير معروف
    await ctx.reply(
      `❌ *${escapeMarkdownV2('نوع الإعداد غير معروف')}*\n\n` +
      `📝 الإعدادات المدعومة:\n• \`reminders\`\n` +
      `💡 أمثلة:\n` +
      `• \`/settings reminders on\`\n` +
      `• \`/settings reminders off\``,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ خطأ في أمر /settings:', error);
    await ctx.reply(
      `❌ ${escapeMarkdownV2('حدث خطأ، يرجى المحاولة لاحقًا أو التواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}
