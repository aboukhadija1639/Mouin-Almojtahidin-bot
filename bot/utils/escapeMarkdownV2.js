// bot/utils/escapeMarkdownV2.js

/**
 * Escapes MarkdownV2 reserved characters in text to prevent parsing errors
 * Ensures professional message display without MarkdownV2 parsing issues
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text safe for MarkdownV2
 */
export function escapeMarkdownV2(text) {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  if (!text) {
    return '';
  }

  // Escape all special MarkdownV2 characters
  // Reference: https://core.telegram.org/bots/api#markdownv2-style
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Creates bold text in MarkdownV2 format
 */
export function bold(text) {
  return `*${escapeMarkdownV2(text)}*`;
}

/**
 * Creates italic text in MarkdownV2 format
 */
export function italic(text) {
  return `_${escapeMarkdownV2(text)}_`;
}

/**
 * Creates inline code text in MarkdownV2 format
 */
export function code(text) {
  return `\`${text.replace(/`/g, '\\`')}\``;
}

/**
 * Creates a link in MarkdownV2 format
 */
export function link(text, url) {
  return `[${escapeMarkdownV2(text)}](${url})`;
}

/**
 * Creates preformatted code block in MarkdownV2 format
 */
export function codeBlock(text, language = '') {
  const escapedText = text.replace(/```/g, '\\`\\`\\`');
  return `\`\`\`${language}\n${escapedText}\n\`\`\``;
}

/**
 * Creates underlined text in MarkdownV2 format
 */
export function underline(text) {
  return `__${escapeMarkdownV2(text)}__`;
}

/**
 * Creates strikethrough text in MarkdownV2 format
 */
export function strikethrough(text) {
  return `~${escapeMarkdownV2(text)}~`;
}

/**
 * Creates spoiler text in MarkdownV2 format
 */
export function spoiler(text) {
  return `||${escapeMarkdownV2(text)}||`;
}
