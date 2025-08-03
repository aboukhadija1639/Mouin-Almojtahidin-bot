import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  admin: {
    userIds: process.env.ADMIN_USER_IDS ? process.env.ADMIN_USER_IDS.split(',').map(id => parseInt(id.trim())) : [],
    groupId: process.env.GROUP_ID || '',
    supportChannel: process.env.SUPPORT_CHANNEL || '@SupportChannel',
    chatId: process.env.ADMIN_CHAT_ID || ''
  },
  users: {
    activationCode: process.env.ACTIVATION_CODE || 'DEFAULT_CODE'
  },
  zoom: {
    fullLink: process.env.ZOOM_LINK || 'https://zoom.us/j/example'
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