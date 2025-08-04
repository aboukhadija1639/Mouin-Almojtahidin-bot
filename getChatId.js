import { Telegraf } from 'telegraf';
import 'dotenv/config';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('message', (ctx) => {
  console.log('Chat ID:', ctx.chat.id);
});

bot.launch();
console.log('🤖 Send a message in your group to get the chat ID...');