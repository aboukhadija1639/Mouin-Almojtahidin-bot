import { updateUserSettings, getUserSettings, updateUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

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
          `❌ ${bold('لا يمكن تحميل إعداداتك')}\n` +
          `${escapeMarkdownV2('تأكد من أنك بدأت البوت باستخدام')} ${code('/start')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const remindersStatus = settings.reminders_enabled ? '✅ مفعلة' : '❌ معطلة';
      const languageStatus = settings.language === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English';

      await ctx.reply(
        `⚙️ ${bold('إعداداتك الحالية')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔔 ${bold('التذكيرات:')} ${remindersStatus}\n` +
        `🌐 ${bold('اللغة:')} ${languageStatus}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🛠️ ${bold('لتغيير الإعدادات:')}\n\n` +
        `• ${code('/settings reminders on/off')} للتذكيرات\n` +
        `• ${code('/settings language ar/en')} للغة\n\n` +
        `💡 يمكنك إضافة تذكيرات خاصة باستخدام ${code('/addreminder')}\n\n` +
        `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const settingType = args[1]?.toLowerCase();
    const settingValue = args[2]?.toLowerCase();

    if (settingType === 'reminders') {
      if (!['on', 'off'].includes(settingValue)) {
        await ctx.reply(
          `❌ ${bold('قيمة غير صحيحة')}\n\n` +
          `📝 ${bold('الاستخدام الصحيح:')}\n` +
          `• ${code('/settings reminders on')}\n` +
          `• ${code('/settings reminders off')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const newValue = settingValue === 'on';
      const success = await updateUserSettings(userId, { reminders_enabled: newValue });

      if (success) {
        const status = newValue ? '✅ تم تفعيل التذكيرات' : '🔕 تم إيقاف التذكيرات';
        await ctx.reply(
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n${status}\n\n` +
          `📝 يمكنك عرض إعداداتك باستخدام ${code('/settings')}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ ${bold('حدث خطأ أثناء تحديث الإعدادات')}\n\n` +
          `يرجى المحاولة لاحقًا أو التواصل مع الدعم: ${escapeMarkdownV2(config.admin.supportChannel)}`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      return;
    }

    if (settingType === 'language') {
      if (!['ar', 'en'].includes(settingValue)) {
        await ctx.reply(
          `❌ ${bold('قيمة غير صحيحة')}\n\n` +
          `📝 ${bold('الاستخدام الصحيح:')}\n` +
          `• ${code('/settings language ar')} للعربية\n` +
          `• ${code('/settings language en')} للإنجليزية`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const success = await updateUserLanguage(userId, settingValue);

      if (success) {
        const languageName = settingValue === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English';
        await ctx.reply(
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n` +
          `🌐 تم تغيير اللغة إلى: ${languageName}\n\n` +
          `💡 ${italic('ملاحظة: هذه الميزة قيد التطوير وستؤثر على الرسائل المستقبلية')}\n\n` +
          `📝 يمكنك عرض إعداداتك باستخدام ${code('/settings')}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ ${bold('حدث خطأ أثناء تحديث الإعدادات')}\n\n` +
          `يرجى المحاولة لاحقًا أو التواصل مع الدعم: ${escapeMarkdownV2(config.admin.supportChannel)}`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      return;
    }

    // إعداد غير معروف
    await ctx.reply(
      `❌ ${bold('نوع الإعداد غير معروف')}\n\n` +
      `📝 ${bold('الإعدادات المدعومة:')}\n` +
      `• ${code('reminders')} \\- تفعيل/إيقاف التذكيرات\n` +
      `• ${code('language')} \\- تغيير اللغة\n\n` +
      `💡 ${bold('أمثلة:')}\n` +
      `• ${code('/settings reminders on/off')}\n` +
      `• ${code('/settings language ar/en')}\n\n` +
      `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ خطأ في أمر /settings:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `يرجى المحاولة لاحقًا أو التواصل مع ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}
