import { addAnnouncement, getVerifiedUsersWithReminders } from '../utils/database.js';
import { config } from '../../config.js';

export async function handlePublish(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        `🚫 *غير مسموح*\n\n` +
        `هذا الأمر مخصص للمدراء فقط.\n\n` +
        `للمساعدة، تواصل مع ${config.admin.supportChannel}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Extract announcement content
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `📢 *كيفية نشر إعلان*\n\n` +
        `الصيغة الصحيحة: \`/publish نص_الإعلان\`\n\n` +
        `مثال: \`/publish مرحباً بكم في الدرس الجديد\`\n\n` +
        `💡 سيتم إرسال الإعلان للمجموعة وللمستخدمين المفعلين.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Get announcement content (everything after /publish)
    const announcementContent = messageText.substring(messageText.indexOf(' ') + 1);

    // Save announcement to database
    const announcementId = await addAnnouncement(announcementContent, true);
    
    if (!announcementId) {
      await ctx.reply(
        `❌ *فشل في حفظ الإعلان*\n\n` +
        `حدث خطأ تقني، حاول مرة أخرى.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Format announcement message
    const announcementMessage = `📢 *إعلان جديد*\n\n${announcementContent}\n\n━━━━━━━━━━━━━━━━━━━━\n🤖 بوت معين المجتهدين`;

    let successCount = 0;
    let failCount = 0;

    // Send to main group if configured
    if (config.admin.groupId) {
      try {
        await ctx.telegram.sendMessage(config.admin.groupId, announcementMessage, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
        successCount++;
      } catch (groupError) {
        console.error('خطأ في إرسال الإعلان للمجموعة:', groupError);
        failCount++;
      }
    }

    // Send to verified users with reminders enabled
    const verifiedUsers = await getVerifiedUsersWithReminders();
    
    for (const userIdToNotify of verifiedUsers) {
      // Skip sending to the admin who published
      if (userIdToNotify === userId) continue;
      
      try {
        await ctx.telegram.sendMessage(userIdToNotify, announcementMessage, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
        successCount++;
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (userError) {
        console.error(`خطأ في إرسال الإعلان للمستخدم ${userIdToNotify}:`, userError);
        failCount++;
      }
    }

    // Send confirmation to admin
    let confirmationMessage = `✅ *تم نشر الإعلان بنجاح*\n\n`;
    confirmationMessage += `📊 *تفاصيل الإرسال:*\n`;
    confirmationMessage += `• تم الإرسال بنجاح: ${successCount}\n`;
    if (failCount > 0) {
      confirmationMessage += `• فشل في الإرسال: ${failCount}\n`;
    }
    confirmationMessage += `\n📝 *محتوى الإعلان:*\n${announcementContent}`;

    await ctx.reply(confirmationMessage, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /publish:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}