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
  
  // All MarkdownV2 reserved characters that need escaping
  // Order matters: escape backslash first to avoid double escaping
  const reservedChars = [
    { char: '\\', regex: /\\/g },
    { char: '_', regex: /_/g },
    { char: '*', regex: /\*/g },
    { char: '[', regex: /\[/g },
    { char: ']', regex: /\]/g },
    { char: '(', regex: /\(/g },
    { char: ')', regex: /\)/g },
    { char: '~', regex: /~/g },
    { char: '`', regex: /`/g },
    { char: '>', regex: />/g },
    { char: '#', regex: /#/g },
    { char: '+', regex: /\+/g },
    { char: '-', regex: /-/g },
    { char: '=', regex: /=/g },
    { char: '|', regex: /\|/g },
    { char: '{', regex: /\{/g },
    { char: '}', regex: /\}/g },
    { char: '.', regex: /\./g },
    { char: '!', regex: /!/g }
  ];
  
  let escaped = text;
  
  // Escape each reserved character
  reservedChars.forEach(({ char, regex }) => {
    escaped = escaped.replace(regex, `\\${char}`);
  });
  
  return escaped;
}

/**
 * Creates bold text in MarkdownV2 format
 * @param {string} text - Text to make bold
 * @returns {string} - Bold formatted text
 */
export function bold(text) {
  return `*${escapeMarkdownV2(text)}*`;
}

/**
 * Creates italic text in MarkdownV2 format
 * @param {string} text - Text to make italic
 * @returns {string} - Italic formatted text
 */
export function italic(text) {
  return `_${escapeMarkdownV2(text)}_`;
}

/**
 * Creates code text in MarkdownV2 format
 * @param {string} text - Text to format as code
 * @returns {string} - Code formatted text
 */
export function code(text) {
  return `\`${text.replace(/`/g, '\\`')}\``;
}

/**
 * Creates a link in MarkdownV2 format
 * @param {string} text - Link text
 * @param {string} url - URL
 * @returns {string} - Link formatted text
 */
export function link(text, url) {
  return `[${escapeMarkdownV2(text)}](${url})`;
}