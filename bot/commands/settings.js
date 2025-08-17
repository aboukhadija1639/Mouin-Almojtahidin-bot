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
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `🔔 ${bold('التذكيرات:')} ${escapeMarkdownV2(remindersStatus)}\n` +
        `🌐 ${bold('اللغة:')} ${escapeMarkdownV2(languageStatus)}\n` +
        `⏰ ${bold('تكرار الإشعارات:')} ${escapeMarkdownV2(frequencyStatus)}\n\n` +
        `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
        `🛠️ ${bold('اختر من الأزرار أدناه لتغيير الإعدادات:')}\n\n` +
        `💡 ${escapeMarkdownV2('يمكنك إضافة تذكيرات خاصة باستخدام')} ${code('/addreminder')}\n\n` +
        `${escapeMarkdownV2('📞 للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n${escapeMarkdownV2(status)}\n\n` +
          `📝 ${escapeMarkdownV2('يمكنك عرض إعداداتك باستخدام')} ${code('/settings')}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ ${bold('حدث خطأ أثناء تحديث الإعدادات')}\n\n` +
          `${escapeMarkdownV2('يرجى المحاولة لاحقًا أو التواصل مع الدعم:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
          `• ${code('/settings language ar')} ${escapeMarkdownV2('للعربية')}\n` +
          `• ${code('/settings language en')} ${escapeMarkdownV2('للإنجليزية')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const success = await updateUserLanguage(userId, settingValue);

      if (success) {
        const languageName = settingValue === 'ar' ? '🇸🇦 العربية' : '🇺🇸 English';
        await ctx.reply(
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n` +
          `🌐 ${escapeMarkdownV2('تم تغيير اللغة إلى:')} ${escapeMarkdownV2(languageName)}\n\n` +
          `💡 ${italic('ملاحظة: هذه الميزة قيد التطوير وستؤثر على الرسائل المستقبلية')}\n\n` +
          `📝 ${escapeMarkdownV2('يمكنك عرض إعداداتك باستخدام')} ${code('/settings')}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ ${bold('حدث خطأ أثناء تحديث الإعدادات')}\n\n` +
          `${escapeMarkdownV2('يرجى المحاولة لاحقًا أو التواصل مع الدعم:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
          `• ${code('/settings frequency daily')} ${escapeMarkdownV2('ليومياً')}\n` +
          `• ${code('/settings frequency weekly')} ${escapeMarkdownV2('لأسبوعياً')}\n` +
          `• ${code('/settings frequency off')} ${escapeMarkdownV2('لإيقاف')}`,
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      const success = await updateUserSettings(userId, { notification_frequency: settingValue });

      if (success) {
        const frequencyName = getFrequencyDisplay(settingValue);
        await ctx.reply(
          `✅ ${bold('تم تحديث إعداداتك بنجاح')}\n\n` +
          `⏰ ${escapeMarkdownV2('تم تغيير التكرار إلى:')} ${escapeMarkdownV2(frequencyName)}\n\n` +
          `📝 ${escapeMarkdownV2('يمكنك عرض إعداداتك باستخدام')} ${code('/settings')}`,
          { parse_mode: 'MarkdownV2' }
        );
      } else {
        await ctx.reply(
          `❌ ${bold('حدث خطأ أثناء تحديث الإعدادات')}\n\n` +
          `${escapeMarkdownV2('يرجى المحاولة لاحقًا أو التواصل مع الدعم:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
          { parse_mode: 'MarkdownV2' }
        );
      }

      return;
    }

    // Unknown setting
    await ctx.reply(
      `❌ ${bold('نوع الإعداد غير معروف')}\n\n` +
      `📝 ${bold('الإعدادات المدعومة:')}\n` +
      `• ${code('reminders')} ${escapeMarkdownV2('- تفعيل/إيقاف التذكيرات')}\n` +
      `• ${code('language')} ${escapeMarkdownV2('- تغيير اللغة')}\n` +
      `• ${code('frequency')} ${escapeMarkdownV2('- تكرار الإشعارات')}\n\n` +
      `💡 ${bold('أمثلة:')}\n` +
      `• ${code('/settings reminders on/off')}\n` +
      `• ${code('/settings language ar/en')}\n` +
      `• ${code('/settings frequency daily/weekly/off')}\n\n` +
      `${escapeMarkdownV2('📞 للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('❌ خطأ في أمر /settings:', error);
    await ctx.reply(
      `❌ ${bold('حدث خطأ')}\n\n` +
      `${escapeMarkdownV2('يرجى المحاولة لاحقًا أو التواصل مع')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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
      await ctx.answerCbQuery(escapeMarkdownV2(status));
      
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
      await ctx.answerCbQuery(`✅ ${escapeMarkdownV2('تم تغيير اللغة إلى:')} ${escapeMarkdownV2(languageName)}`);
      
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
      await ctx.answerCbQuery(`✅ ${escapeMarkdownV2('تم تغيير التكرار إلى:')} ${escapeMarkdownV2(frequencyName)}`);
      
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
      `${escapeMarkdownV2('━━━━━━━━━━━━━━━━━━━━')}\n\n` +
      `🔔 ${bold('التذكيرات:')}\n` +
      `${escapeMarkdownV2('• تفعيل/إيقاف التذكيرات التلقائية')}\n` +
      `${escapeMarkdownV2('• لا تؤثر على التذكيرات المخصصة')}\n\n` +
      `🌐 ${bold('اللغة:')}\n` +
      `${escapeMarkdownV2('• تغيير لغة واجهة البوت')}\n` +
      `${escapeMarkdownV2('• العربية أو الإنجليزية')}\n\n` +
      `⏰ ${bold('تكرار الإشعارات:')}\n` +
      `${escapeMarkdownV2('• يومياً: إشعارات يومية')}\n` +
      `${escapeMarkdownV2('• أسبوعياً: إشعارات أسبوعية')}\n` +
      `${escapeMarkdownV2('• إيقاف: بدون إشعارات')}\n\n` +
      `💡 ${bold('نصائح:')}\n` +
      `${escapeMarkdownV2('• استخدم')} ${code('/addreminder')} ${escapeMarkdownV2('لإضافة تذكيرات خاصة')}\n` +
      `${escapeMarkdownV2('• يمكنك تغيير الإعدادات في أي وقت')}\n` +
      `${escapeMarkdownV2('• الإعدادات تُحفظ تلقائياً')}\n\n` +
      `${escapeMarkdownV2('📞 للمساعدة:')} ${escapeMarkdownV2(config.admin.supportChannel)}`,
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