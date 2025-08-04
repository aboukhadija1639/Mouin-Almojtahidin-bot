// bot/utils/escapeMarkdownV2.js
export function escapeMarkdownV2(text) {
  if (typeof text !== 'string') return text;
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escaped = text;
  specialChars.forEach(char => {
    escaped = escaped.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  });
  return escaped;
}