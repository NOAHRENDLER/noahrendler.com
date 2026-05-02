import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateEmail, validateTextField } from '../../js/sanitizer.js';

// ─────────────────────────────────────────────────────────────
// sanitizeInput
// ─────────────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('removes null bytes', () => {
    expect(sanitizeInput('hel\0lo')).toBe('hello');
    expect(sanitizeInput('\0\0\0')).toBe('');
  });

  it('escapes & to &amp;', () => {
    expect(sanitizeInput('a&b')).toBe('a&amp;b');
  });

  it('escapes < to &lt;', () => {
    expect(sanitizeInput('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes > to &gt;', () => {
    expect(sanitizeInput('a > b')).toBe('a &gt; b');
  });

  it('escapes " to &quot;', () => {
    expect(sanitizeInput('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it("escapes ' to &#x27;", () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it('handles a classic XSS payload', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles img onerror XSS vector', () => {
    const result = sanitizeInput('"><img src=x onerror=alert(1)>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });

  it('returns empty string for null', () => {
    expect(sanitizeInput(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('returns empty string for numbers', () => {
    expect(sanitizeInput(42)).toBe('');
    expect(sanitizeInput(0)).toBe('');
  });

  it('returns empty string for objects', () => {
    expect(sanitizeInput({})).toBe('');
    expect(sanitizeInput([])).toBe('');
  });

  it('returns empty string for booleans', () => {
    expect(sanitizeInput(true)).toBe('');
    expect(sanitizeInput(false)).toBe('');
  });

  it('preserves normal alphanumeric text unchanged', () => {
    expect(sanitizeInput('Noah Rendler 2026')).toBe('Noah Rendler 2026');
  });
});

// ─────────────────────────────────────────────────────────────
// validateEmail
// ─────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('accepts a standard email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('name@mail.example.de')).toBe(true);
  });

  it('accepts email with dots and hyphens', () => {
    expect(validateEmail('first.last@my-domain.org')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateEmail('   ')).toBe(false);
  });

  it('rejects missing @', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects domain without dot', () => {
    expect(validateEmail('user@localhost')).toBe(false);
  });

  it('rejects domain starting with dot', () => {
    expect(validateEmail('user@.example.com')).toBe(false);
  });

  it('rejects domain ending with dot', () => {
    expect(validateEmail('user@example.')).toBe(false);
  });

  it('rejects multiple @ signs', () => {
    expect(validateEmail('a@b@c.com')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
    expect(validateEmail(42)).toBe(false);
    expect(validateEmail({})).toBe(false);
  });

  it('rejects email exceeding 254 characters', () => {
    const long = `${'a'.repeat(245)}@b.com`;
    expect(validateEmail(long)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// validateTextField
// ─────────────────────────────────────────────────────────────

describe('validateTextField', () => {
  it('accepts a normal string', () => {
    expect(validateTextField('Hello World')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateTextField('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateTextField('   ')).toBe(false);
    expect(validateTextField('\t\n')).toBe(false);
  });

  it('rejects text exceeding default maxLength (1000)', () => {
    expect(validateTextField('a'.repeat(1001))).toBe(false);
  });

  it('accepts text at exact default maxLength', () => {
    expect(validateTextField('a'.repeat(1000))).toBe(true);
  });

  it('rejects text exceeding custom maxLength', () => {
    expect(validateTextField('a'.repeat(101), 100)).toBe(false);
  });

  it('accepts text at exact custom maxLength', () => {
    expect(validateTextField('a'.repeat(100), 100)).toBe(true);
  });

  it('rejects non-string input', () => {
    expect(validateTextField(null)).toBe(false);
    expect(validateTextField(undefined)).toBe(false);
    expect(validateTextField(42)).toBe(false);
    expect(validateTextField({})).toBe(false);
  });
});
