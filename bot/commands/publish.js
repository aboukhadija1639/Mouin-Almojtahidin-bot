import { addAnnouncement, getVerifiedUsersWithReminders } from '../utils/database.js';
import { config } from '../../config.js';
import { templates, announcementTemplates } from '../utils/messageTemplates.js';
import { escapeMarkdownV2, bold, italic, code } from '../utils/escapeMarkdownV2.js';

export async function handlePublish(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        templates.accessDenied('هذا الأمر مخصص للمدراء فقط', config.admin.supportChannel),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Extract announcement content
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        templates.info(
          'كيفية نشر إعلان',
          `الصيغة الصحيحة: ${code('/publish نص_الإعلان')}\n\nمثال: ${code('/publish مرحباً بكم في الدرس الجديد')}`,
          'سيتم إرسال الإعلان للمجموعة وللمستخدمين المفعلين'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Get announcement content (everything after /publish)
    const announcementContent = messageText.substring(messageText.indexOf(' ') + 1);

    // Validate announcement content
    if (!announcementContent || announcementContent.trim().length === 0) {
      await ctx.reply(
        templates.error(
          'نص الإعلان فارغ',
          'يرجى إضافة محتوى للإعلان',
          `مثال: ${code('/publish مرحباً بكم في الدرس الجديد')}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Validate announcement length
    if (announcementContent.length > 1000) {
      await ctx.reply(
        templates.error(
          'نص الإعلان طويل جداً',
          `يجب أن يكون نص الإعلان أقل من 1000 حرف. النص الحالي: ${announcementContent.length} حرف`,
          'اجعل الإعلان مختصراً وواضحاً'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Save announcement to database
    const announcementId = await addAnnouncement(announcementContent, true);
    
    if (!announcementId) {
      await ctx.reply(
        templates.error(
          'فشل في حفظ الإعلان',
          'حدث خطأ تقني أثناء حفظ الإعلان',
          'حاول مرة أخرى أو تواصل مع الدعم الفني'
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Format announcement message using professional template
    const announcementMessage = announcementTemplates.toUsers(announcementContent);

    let successCount = 0;
    let failCount = 0;

    // Send to main group if configured
    if (config.admin.groupId) {
      try {
        await ctx.telegram.sendMessage(config.admin.groupId, announcementMessage, { 
          parse_mode: 'MarkdownV2',
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
          parse_mode: 'MarkdownV2',
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

    // Send professional confirmation to admin
    await ctx.reply(
      announcementTemplates.published({
        content: announcementContent,
        successCount: successCount,
        failCount: failCount
      }),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true 
      }
    );

  } catch (error) {
    console.error('خطأ في أمر /publish:', error);
    await ctx.reply(
      templates.error(
        'حدث خطأ غير متوقع',
        'تعذر معالجة طلبك في الوقت الحالي',
        `حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}