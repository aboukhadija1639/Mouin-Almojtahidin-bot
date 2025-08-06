import { updateUserSettings, getUserSettings, updateUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handleSettings(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;
    const args = messageText.split(' ');

    // If no settings provided, show current settings
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
      const frequencyStatus = getFrequencyDisplay(settings.notification_frequency || 'daily');

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔔 تبديل التذكيرات', callback_data: 'toggle_reminders' },
            { text: '🌐 تغيير اللغة', callback_data: 'change_language' }
          ],
          [
            { text: '⏰ تكرار الإشعارات', callback_data: 'change_frequency' }
          ],
          [
            { text: '📋 المساعدة', callback_data: 'settings_help' }
          ]
        ]
      };

      await ctx.reply(
        `⚙️ ${bold('إعداداتك الحالية')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔔 ${bold('التذكيرات:')} ${remindersStatus}\n` +
        `🌐 ${bold('اللغة:')} ${languageStatus}\n` +
        `⏰ ${bold('تكرار الإشعارات:')} ${frequencyStatus}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🛠️ ${bold('اختر من الأزرار أدناه لتغيير الإعدادات:')}\n\n` +
        `💡 يمكنك إضافة تذكيرات خاصة باستخدام ${code('/addreminder')}\n\n` +
        `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
        { 
          parse_mode: 'MarkdownV2',
          reply_markup: keyboard
        }
      );
      return;
    }

    // Handle command-line settings
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

    if (settingType === 'frequency') {
      if (!['daily', 'weekly', 'off'].includes(settingValue)) {
        await ctx.reply(
          `❌ ${bold('قيمة غير صحيحة')}\n\n` +
          `📝 ${bold('الاستخدام الصحيح:')}\n` +
          `• ${code('/settings frequency daily')} يومياً\n` +
          `• ${code('/settings frequency weekly')} أسبوعياً\n` +
          `• ${code('/settings frequency off')} إيقاف`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const success = await updateUserSettings(userId, { notification_frequency: settingValue });

      if (success) {
        const frequencyName = getFrequencyDisplay(settingValue);
        await ctx.reply(
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n` +
          `⏰ تم تغيير تكرار الإشعارات إلى: ${frequencyName}\n\n` +
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

    // Unknown setting
    await ctx.reply(
      `❌ ${bold('نوع الإعداد غير معروف')}\n\n` +
      `📝 ${bold('الإعدادات المدعومة:')}\n` +
      `• ${code('reminders')} \\- تفعيل/إيقاف التذكيرات\n` +
      `• ${code('language')} \\- تغيير اللغة\n` +
      `• ${code('frequency')} \\- تكرار الإشعارات\n\n` +
      `💡 ${bold('أمثلة:')}\n` +
      `• ${code('/settings reminders on/off')}\n` +
      `• ${code('/settings language ar/en')}\n` +
      `• ${code('/settings frequency daily/weekly/off')}\n\n` +
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

// Callback query handlers
export async function handleToggleReminders(ctx) {
  try {
    const userId = ctx.from.id;
    const settings = await getUserSettings(userId);
    const newValue = !settings.reminders_enabled;
    
    const success = await updateUserSettings(userId, { reminders_enabled: newValue });
    
    if (success) {
      const status = newValue ? '✅ تم تفعيل التذكيرات' : '🔕 تم إيقاف التذكيرات';
      await ctx.answerCbQuery(status);
      
      // Update the message with new settings
      await handleSettings(ctx);
    } else {
      await ctx.answerCbQuery('❌ فشل في تحديث الإعدادات');
    }
  } catch (error) {
    console.error('خطأ في تبديل التذكيرات:', error);
    await ctx.answerCbQuery('❌ حدث خطأ');
  }
}

export async function handleChangeLanguage(ctx) {
  try {
    const userId = ctx.from.id;
    const settings = await getUserSettings(userId);
    const newLanguage = settings.language === 'ar' ? 'en' : 'ar';
    
    const success = await updateUserLanguage(userId, newLanguage);
    
    if (success) {
      const languageName = newLanguage === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English';
      await ctx.answerCbQuery(`✅ تم تغيير اللغة إلى: ${languageName}`);
      
      // Update the message with new settings
      await handleSettings(ctx);
    } else {
      await ctx.answerCbQuery('❌ فشل في تحديث اللغة');
    }
  } catch (error) {
    console.error('خطأ في تغيير اللغة:', error);
    await ctx.answerCbQuery('❌ حدث خطأ');
  }
}

export async function handleChangeFrequency(ctx) {
  try {
    const userId = ctx.from.id;
    const settings = await getUserSettings(userId);
    const currentFreq = settings.notification_frequency || 'daily';
    
    // Cycle through frequencies: daily -> weekly -> off -> daily
    const frequencies = ['daily', 'weekly', 'off'];
    const currentIndex = frequencies.indexOf(currentFreq);
    const newIndex = (currentIndex + 1) % frequencies.length;
    const newFrequency = frequencies[newIndex];
    
    const success = await updateUserSettings(userId, { notification_frequency: newFrequency });
    
    if (success) {
      const frequencyName = getFrequencyDisplay(newFrequency);
      await ctx.answerCbQuery(`✅ تم تغيير التكرار إلى: ${frequencyName}`);
      
      // Update the message with new settings
      await handleSettings(ctx);
    } else {
      await ctx.answerCbQuery('❌ فشل في تحديث التكرار');
    }
  } catch (error) {
    console.error('خطأ في تغيير التكرار:', error);
    await ctx.answerCbQuery('❌ حدث خطأ');
  }
}

export async function handleSettingsHelp(ctx) {
  try {
    await ctx.answerCbQuery('📋 عرض المساعدة');
    
    await ctx.reply(
      `📋 ${bold('دليل إعدادات البوت')}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔔 ${bold('التذكيرات:')}\n` +
      `• تفعيل/إيقاف التذكيرات التلقائية\n` +
      `• لا تؤثر على التذكيرات المخصصة\n\n` +
      `🌐 ${bold('اللغة:')}\n` +
      `• تغيير لغة واجهة البوت\n` +
      `• العربية أو الإنجليزية\n\n` +
      `⏰ ${bold('تكرار الإشعارات:')}\n` +
      `• يومياً: إشعارات يومية\n` +
      `• أسبوعياً: إشعارات أسبوعية\n` +
      `• إيقاف: بدون إشعارات\n\n` +
      `💡 ${bold('نصائح:')}\n` +
      `• استخدم ${code('/addreminder')} لإضافة تذكيرات خاصة\n` +
      `• يمكنك تغيير الإعدادات في أي وقت\n` +
      `• الإعدادات تُحفظ تلقائياً\n\n` +
      `📞 للمساعدة: ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (error) {
    console.error('خطأ في عرض المساعدة:', error);
    await ctx.answerCbQuery('❌ حدث خطأ');
  }
}

// Helper function to get frequency display text
function getFrequencyDisplay(frequency) {
  const displays = {
    daily: '📅 يومياً',
    weekly: '📆 أسبوعياً',
    off: '🔕 إيقاف'
  };
  return displays[frequency] || displays.daily;
}
