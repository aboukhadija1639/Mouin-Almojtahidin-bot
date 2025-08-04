import dotenv from 'dotenv';

dotenv.config();

// Validate and parse environment variables
function validateEnvVar(name, value, required = true, defaultValue = '') {
  if (required && (!value || value.trim() === '')) {
    console.error(`❌ متغير البيئة ${name} مطلوب ولكنه غير موجود`);
    if (required) {
      process.exit(1);
    }
  }
  return value || defaultValue;
}

function parseAdminUserIds(userIdsStr) {
  if (!userIdsStr) return [];
  
  try {
    return userIdsStr.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  } catch (error) {
    console.error('❌ خطأ في تحليل معرفات المدراء:', error);
    return [];
  }
}

export const config = {
  botToken: validateEnvVar('BOT_TOKEN', process.env.BOT_TOKEN, true),
  admin: {
    userIds: parseAdminUserIds(process.env.ADMIN_USER_IDS),
    groupId: validateEnvVar('GROUP_ID', process.env.GROUP_ID, false),
    supportChannel: validateEnvVar('SUPPORT_CHANNEL', process.env.SUPPORT_CHANNEL, false, '@SupportChannel'),
    chatId: validateEnvVar('ADMIN_CHAT_ID', process.env.ADMIN_CHAT_ID, false)
  },
  users: {
    activationCode: validateEnvVar('ACTIVATION_CODE', process.env.ACTIVATION_CODE, true, 'DEFAULT_CODE')
  },
  zoom: {
    fullLink: validateEnvVar('ZOOM_LINK', process.env.ZOOM_LINK, false, 'https://zoom.us/j/example')
  },
  // Rate limiting configuration
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 30,
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 100
  },
  faq: [
    {
      question: "كيف يمكنني التسجيل في الكورس؟",
      answer: "لبدء استخدام البوت، استخدم الأمر /verify مع كود التفعيل الذي حصلت عليه من المدرب."
    },
    {
      question: "كيف أسجل حضوري؟",
      answer: "استخدم الأمر /attendance متبوعاً برقم الدرس لتسجيل حضورك. مثال: /attendance 1"
    },
    {
      question: "كيف أرى ملفي الشخصي؟",
      answer: "استخدم الأمر /profile لعرض معلوماتك الشخصية وإحصائيات حضورك."
    },
    {
      question: "كيف أجيب على الواجبات؟",
      answer: "استخدم الأمر /submit متبوعاً برقم الواجب وإجابتك. مثال: /submit 1 الإجابة هنا"
    },
    {
      question: "متى تصل تذكيرات الدروس؟",
      answer: "يرسل البوت تذكيرات قبل 24 ساعة وساعة واحدة من بداية كل درس."
    },
    {
      question: "كيف أتواصل مع الدعم الفني؟",
      answer: `للحصول على المساعدة، تواصل معنا عبر ${process.env.SUPPORT_CHANNEL || '@SupportChannel'}`
    }
  ],
  schedule: {
    lessons: [
      {
        course_id: 1,
        title: "مقدمة في البرمجة",
        date: "2024-01-15",
        time: "19:00",
        zoom_link: process.env.ZOOM_LINK || "https://zoom.us/j/example"
      },
      {
        course_id: 1,
        title: "أساسيات الخوارزميات",
        date: "2024-01-17",
        time: "19:00",
        zoom_link: process.env.ZOOM_LINK || "https://zoom.us/j/example"
      }
    ]
  }
};