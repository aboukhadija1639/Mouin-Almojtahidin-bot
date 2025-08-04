// Utility to escape all MarkdownV2 reserved characters for Telegram
// See: https://core.telegram.org/bots/api#markdownv2-formatting

export function escapeMarkdownV2(text) {
  if (typeof text !== 'string') return '';
  // List of all MarkdownV2 special characters
  // _ * [ ] ( ) ~ ` > # + - = | { } . !
  // Also escape backslash itself first
  return text
    .replace(/\\/g, '\\\\') // Escape backslash
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}