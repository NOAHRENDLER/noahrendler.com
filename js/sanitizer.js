/**
 * sanitizer.js — Input sanitization and validation.
 *
 * Security contract:
 *   - sanitizeInput() escapes HTML entities and removes null bytes.
 *     Output is safe to assign to element.textContent (which is always
 *     safe), but also safe if accidentally used in other contexts.
 *   - Validation functions return boolean only — they never throw.
 *   - No DOM access — this module is pure, testable without jsdom.
 */

/**
 * Sanitize a string for safe use.
 * - Trims whitespace
 * - Removes null bytes (can bypass filters in some contexts)
 * - Escapes HTML entities (defense-in-depth: renderer uses textContent,
 *   but this ensures the data layer is clean regardless)
 *
 * @param {unknown} raw - The raw input value.
 * @returns {string} Sanitized string, or '' for non-string input.
 */
export function sanitizeInput(raw) {
  if (typeof raw !== 'string') return '';

  return raw
    .trim()
    .replace(/\0/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate an email address.
 * Intentionally simple — avoids ReDoS-prone complex regex.
 * Server-side (Formspree) performs authoritative validation.
 *
 * @param {unknown} email - The raw email value.
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;

  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 254) return false; // RFC 5321 maximum

  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (local.length === 0 || local.length > 64) return false;
  if (domain.length === 0) return false;
  if (!domain.includes('.')) return false;

  // Domain must not start or end with a dot
  if (domain.startsWith('.') || domain.endsWith('.')) return false;

  return true;
}

/**
 * Validate a required text field with a length limit.
 *
 * @param {unknown} text - The raw field value.
 * @param {number} [maxLength=1000] - Maximum allowed character count.
 * @returns {boolean}
 */
export function validateTextField(text, maxLength = 1000) {
  if (typeof text !== 'string') return false;
  if (text.trim().length === 0) return false;
  if (text.length > maxLength) return false;
  return true;
}
