import { getUserInfo, getUserAttendance, getUserSubmissions, getUserLanguage } from '../utils/database.js';
import { config } from '../../config.js';
import { escapeMarkdownV2, bold, code } from '../utils/escapeMarkdownV2.js';
import { success, error, info } from '../utils/responseTemplates.js';
import { logError } from '../middlewares/logger.js';

export async function handleProfile(ctx) {
  try {
    const userId = ctx.from.id;

    // Get user language
    const userLanguage = await getUserLanguage(userId) || 'ar';

    // Define bilingual messages
    const messages = {
      ar: {
        yourProfile: 'ملفك الشخصي',
        name: 'الاسم:',
        username: 'اسم المستخدم:',
        userId: 'رقم المستخدم:',
        joinDate: 'تاريخ الانضمام:',
        accountStatus: 'حالة الحساب:',
        verified: 'مفعل ✅',
        notVerified: 'غير مفعل ❌',
        statistics: 'الإحصائيات:',
        totalAttendance: 'إجمالي الحضور:',
        totalSubmissions: 'إجمالي الإرسالات:',
        reminders: 'التذكيرات:',
        enabled: 'مفعلة ✅',
        disabled: 'معطلة ❌',
        language: 'اللغة:',
        arabic: 'العربية',
        english: 'الإنجليزية',
        lessons: 'درس',
        assignments: 'واجب',
        noUsername: 'غير متوفر',
        profileError: 'حدث خطأ في جلب معلومات الملف الشخصي'
      },
      en: {
        yourProfile: 'Your Profile',
        name: 'Name:',
        username: 'Username:',
        userId: 'User ID:',
        joinDate: 'Join Date:',
        accountStatus: 'Account Status:',
        verified: 'Verified ✅',
        notVerified: 'Not Verified ❌',
        statistics: 'Statistics:',
        totalAttendance: 'Total Attendance:',
        totalSubmissions: 'Total Submissions:',
        reminders: 'Reminders:',
        enabled: 'Enabled ✅',
        disabled: 'Disabled ❌',
        language: 'Language:',
        arabic: 'Arabic',
        english: 'English',
        lessons: 'lessons',
        assignments: 'assignments',
        noUsername: 'Not available',
        profileError: 'An error occurred while fetching profile information'
      }
    };

    const msg = messages[userLanguage] || messages.ar;

    // Get user information
    const userResult = await getUserInfo(userId);
    if (!userResult.success || !userResult.data) {
      await ctx.reply(
        error(msg.profileError),
        { 
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }
      );
      return;
    }

    const user = userResult.data;

    // Get user statistics
    const [attendanceCount, submissionsCount] = await Promise.all([
      getUserAttendance(userId),
      getUserSubmissions(userId)
    ]);

    // Build profile message
    const profileMessage = 
      `👤 ${bold(msg.yourProfile)}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📝 ${bold(msg.name)} ${escapeMarkdownV2(user.first_name || 'غير متوفر')}\n` +
      `🏷️ ${bold(msg.username)} ${escapeMarkdownV2(user.username ? `@${user.username}` : msg.noUsername)}\n` +
      `🆔 ${bold(msg.userId)} ${code(String(userId))}\n` +
      `📅 ${bold(msg.joinDate)} ${escapeMarkdownV2(user.join_date ? new Date(user.join_date).toLocaleDateString('ar-SA') : 'غير متوفر')}\n\n` +
      `🔐 ${bold(msg.accountStatus)} ${user.is_verified ? msg.verified : msg.notVerified}\n` +
      `🌐 ${bold(msg.language)} ${userLanguage === 'ar' ? msg.arabic : msg.english}\n` +
      `🔔 ${bold(msg.reminders)} ${user.reminders_enabled ? msg.enabled : msg.disabled}\n\n` +
      `📊 ${bold(msg.statistics)}\n` +
      `📚 ${bold(msg.totalAttendance)} ${attendanceCount} ${msg.lessons}\n` +
      `📝 ${bold(msg.totalSubmissions)} ${submissionsCount} ${msg.assignments}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 ${escapeMarkdownV2('استخدم')} ${code('/settings')} ${escapeMarkdownV2('لتغيير الإعدادات')}`;

    await ctx.reply(
      profileMessage,
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );

  } catch (err) {
    logError(err, 'COMMAND_PROFILE');
    
    // Get user language for error message
    const userLanguage = await getUserLanguage(ctx.from?.id).catch(() => 'ar') || 'ar';
    
    const errorMessages = {
      ar: 'حدث خطأ، حاول مرة أخرى أو تواصل مع الدعم',
      en: 'An error occurred, try again or contact support'
    };

    await ctx.reply(
      error(errorMessages[userLanguage] || errorMessages.ar),
      { 
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true
      }
    );
  }
}