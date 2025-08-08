// bot/utils/responseTemplates.js

import { escapeMarkdownV2 } from './escapeMarkdownV2.js';

/**
 * Returns a success styled MarkdownV2 message with a ✅ emoji prefix.
 */
export function success(text) {
  return `✅ ${escapeMarkdownV2(text)}`;
}

/**
 * Returns an error styled MarkdownV2 message with a ❌ emoji prefix.
 */
export function error(text) {
  return `❌ ${escapeMarkdownV2(text)}`;
}

/**
 * Returns an informational styled MarkdownV2 message with an ℹ️ emoji prefix.
 */
export function info(text) {
  return `ℹ️ ${escapeMarkdownV2(text)}`;
}