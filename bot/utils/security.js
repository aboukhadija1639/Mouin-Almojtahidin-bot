// bot/utils/security.js

/**
 * Sanitize user input to prevent SQL injection and XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>'";&|`$(){}[\]\\]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize numeric input
 * @param {string|number} input - The input to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} - The validated number or null if invalid
 */
export function validateNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseInt(input);
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  return num;
}

/**
 * Validate date string in YYYY-MM-DD format
 * @param {string} dateString - The date string to validate
 * @returns {Date|null} - The validated date or null if invalid
 */
export function validateDate(dateString) {
  if (typeof dateString !== 'string') return null;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  // Check if the date string matches the parsed date (prevents invalid dates like 2024-02-30)
  const isoString = date.toISOString().split('T')[0];
  if (isoString !== dateString) return null;
  
  return date;
}

/**
 * Validate text length
 * @param {string} text - The text to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateTextLength(text, minLength = 0, maxLength = 1000) {
  if (typeof text !== 'string') return false;
  return text.length >= minLength && text.length <= maxLength;
}

/**
 * Sanitize and validate user ID
 * @param {string|number} userId - The user ID to validate
 * @returns {number|null} - The validated user ID or null if invalid
 */
export function validateUserId(userId) {
  const id = parseInt(userId);
  if (isNaN(id) || id <= 0 || id > 9999999999) { // Telegram user IDs are typically 9-10 digits
    return null;
  }
  return id;
}

/**
 * Validate command arguments
 * @param {string[]} args - Array of command arguments
 * @param {number} expectedCount - Expected number of arguments
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateCommandArgs(args, expectedCount) {
  return Array.isArray(args) && args.length >= expectedCount;
}

/**
 * Rate limiting helper - simple in-memory store
 */
const rateLimitStore = new Map();

/**
 * Check if user is rate limited
 * @param {number} userId - The user ID
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if rate limited, false otherwise
 */
export function isRateLimited(userId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userKey = `user_${userId}`;
  
  if (!rateLimitStore.has(userKey)) {
    rateLimitStore.set(userKey, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  const userLimit = rateLimitStore.get(userKey);
  
  // Reset if window has passed
  if (now > userLimit.resetTime) {
    rateLimitStore.set(userKey, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  // Increment counter
  userLimit.count++;
  
  // Check if limit exceeded
  return userLimit.count > maxRequests;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limit store every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);