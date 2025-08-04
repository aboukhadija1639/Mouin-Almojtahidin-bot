// testPolling.js
import { Telegraf } from 'telegraf';
const bot = new Telegraf('7615777531:AAGmBTvWFwDmsXqoJ4cN0t-6S009QW8q2Dk');
bot.command('start', ctx => ctx.reply('Test OK'));
bot.launch({ dropPendingUpdates: true }).then(() => console.log('Polling started')).catch(err => console.error('Polling failed:', err));