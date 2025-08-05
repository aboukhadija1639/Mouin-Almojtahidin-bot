export function escapeMarkdownV2(text) {
  if (typeof text !== 'string') return text;
  
  // All MarkdownV2 reserved characters that need escaping
  const reservedChars = [
    '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!', '\\'
  ];
  
  let escaped = text;
  
  // Escape backslash first to avoid double escaping
  escaped = escaped.replace(/\\/g, '\\\\');
  
  // Then escape all other reserved characters
  reservedChars.slice(1).forEach(char => {
    const regex = new RegExp(`\\${char}`, 'g');
    escaped = escaped.replace(regex, `\\${char}`);
  });
  
  return escaped;
}