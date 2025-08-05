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
    { char: '-', regex: /\-/g },
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