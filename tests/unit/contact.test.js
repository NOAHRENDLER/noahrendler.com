/**
 * tests/unit/contact.test.js — Contact form handler tests.
 *
 * contact.js uses document-level submit delegation. Tests dispatch a submit
 * event on the form so it bubbles up to the document listener.
 *
 * initContact() is called once in beforeAll to avoid duplicate listeners.
 *
 * Rate-limit isolation
 * ────────────────────
 * _lastSubmitTime is unexported module-level state in contact.js that gets set
 * to Date.now() after every successful HTTP 200 response. To prevent one test's
 * successful submit from rate-limiting the next test, we:
 *   1. Run each test at a fake timestamp that advances 60 s per test, so that
 *      Date.now() - _lastSubmitTime is always > RATE_LIMIT_MS (30 s).
 *   2. Default global.fetch to a never-resolving mock. Tests that only check
 *      synchronous behaviour (validation, honeypot) never trigger the success
 *      handler and therefore never update _lastSubmitTime. Tests that need the
 *      async flow to complete assign their own resolving mock before submitting.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { initContact } from '../../js/contact.js';

// Register the document-level listener once for the whole file.
beforeAll(() => {
  document.documentElement.lang = 'de';
  initContact();
});

// ── Time and fetch setup ─────────────────────────────────────
let _fakeNow = 100_000; // start 100 s after epoch

beforeEach(() => {
  _fakeNow += 60_000; // advance 60 s per test — always > RATE_LIMIT_MS past any prior submit
  vi.useFakeTimers();
  vi.setSystemTime(_fakeNow);
  document.documentElement.lang = 'de';
  document.body.innerHTML = '';
  // Never-resolving mock: prevents _lastSubmitTime from being set by async
  // success callbacks in tests that only care about synchronous behaviour.
  global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Build a fully-featured contact form and append it to document.body.
 * Supports overrides for each field value.
 */
function _buildForm(overrides = {}) {
  const form = document.createElement('form');
  form.id = 'contact-form';

  // Honeypot — name="_gotcha" (Formspree native spam protection)
  const hp = document.createElement('input');
  hp.name = '_gotcha';
  hp.value = overrides.honeypot ?? '';
  form.appendChild(hp);

  // Name field with wrapper + error span
  const nameField = document.createElement('div');
  nameField.className = 'form-field';
  const nameInput = document.createElement('input');
  nameInput.id = 'contact-name';
  nameInput.value = overrides.name ?? 'Test User';
  const nameError = document.createElement('span');
  nameError.id = 'contact-name-error';
  nameField.appendChild(nameInput);
  nameField.appendChild(nameError);
  form.appendChild(nameField);

  // Email field with wrapper + error span
  const emailField = document.createElement('div');
  emailField.className = 'form-field';
  const emailInput = document.createElement('input');
  emailInput.id = 'contact-email';
  emailInput.value = overrides.email ?? 'test@example.com';
  const emailError = document.createElement('span');
  emailError.id = 'contact-email-error';
  emailField.appendChild(emailInput);
  emailField.appendChild(emailError);
  form.appendChild(emailField);

  // Message field with wrapper + error span
  const msgField = document.createElement('div');
  msgField.className = 'form-field';
  const msgInput = document.createElement('textarea');
  msgInput.id = 'contact-message';
  msgInput.value = overrides.message ?? 'Test message content.';
  const msgError = document.createElement('span');
  msgError.id = 'contact-message-error';
  msgField.appendChild(msgInput);
  msgField.appendChild(msgError);
  form.appendChild(msgField);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.id = 'contact-submit';
  submitBtn.textContent = 'SENDEN';
  form.appendChild(submitBtn);

  // Status element
  const status = document.createElement('div');
  status.id = 'form-status';
  status.className = 'form-status';
  form.appendChild(status);

  document.body.appendChild(form);
  return form;
}

/** Submit the form via a bubbling event (mirrors real user interaction). */
function _submit(form) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

// ─────────────────────────────────────────────────────────────
// Event delegation
// ─────────────────────────────────────────────────────────────

describe('event delegation', () => {
  it('ignores submit events from forms with a different id', () => {
    const otherForm = document.createElement('form');
    otherForm.id = 'other-form';
    document.body.appendChild(otherForm);
    expect(() => otherForm.dispatchEvent(new Event('submit', { bubbles: true }))).not.toThrow();
  });

  it('handles submit events from #contact-form without throwing', () => {
    const form = _buildForm();
    expect(() => _submit(form)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────────────────────

describe('rate limiting', () => {
  it('shows a rate-limit error when Date.now() is within 30 s of lastSubmitTime', () => {
    // _lastSubmitTime starts at 0. Override to 1 s after epoch:
    // 1000 − 0 = 1000 ms < RATE_LIMIT_MS (30 000 ms) → guard triggers.
    // (beforeEach already installed fake timers; we just adjust the time.)
    vi.setSystemTime(new Date(1000));

    const form = _buildForm();
    _submit(form);

    const statusEl = form.querySelector('#form-status');
    expect(statusEl.textContent).not.toBe('');
    expect(statusEl.className).toContain('form-status--error');
  });
});

// ─────────────────────────────────────────────────────────────
// Honeypot
// ─────────────────────────────────────────────────────────────

describe('honeypot', () => {
  it('fakes success when the honeypot field is filled', () => {
    const form = _buildForm({ honeypot: 'bot-content' });
    _submit(form);

    const statusEl = form.querySelector('#form-status');
    expect(statusEl.className).toContain('form-status--success');
  });

  it('proceeds normally when the honeypot field is empty', () => {
    const form = _buildForm({ honeypot: '' });
    _submit(form);
    // Honeypot empty → validation runs; no forced success applied synchronously
    const statusEl = form.querySelector('#form-status');
    expect(statusEl.className).not.toContain('form-status--success');
  });

  it('proceeds normally when the honeypot field is absent', () => {
    const form = _buildForm();
    form.querySelector('[name="_gotcha"]').remove();
    expect(() => _submit(form)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Missing inputs guard
// ─────────────────────────────────────────────────────────────

describe('missing inputs', () => {
  it('returns early without throwing when required inputs are absent', () => {
    const form = document.createElement('form');
    form.id = 'contact-form';
    document.body.appendChild(form);
    expect(() => _submit(form)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Field validation — name
// ─────────────────────────────────────────────────────────────

describe('name validation', () => {
  it('shows an error when name is empty', () => {
    const form = _buildForm({ name: '' });
    _submit(form);
    expect(form.querySelector('#contact-name-error').textContent).not.toBe('');
  });

  it('marks the name form-field as invalid', () => {
    const form = _buildForm({ name: '' });
    _submit(form);
    expect(
      form.querySelector('#contact-name').closest('.form-field').classList.contains('form-field--invalid')
    ).toBe(true);
  });

  it('does NOT send a fetch request when name is empty', () => {
    const form = _buildForm({ name: '' });
    _submit(form);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', () => {
    const form = _buildForm({ name: '   ' });
    _submit(form);
    expect(form.querySelector('#contact-name-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a name exceeding 100 characters', () => {
    const form = _buildForm({ name: 'a'.repeat(101) });
    _submit(form);
    expect(form.querySelector('#contact-name-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// Field validation — email
// ─────────────────────────────────────────────────────────────

describe('email validation', () => {
  it('shows an error when email is malformed', () => {
    const form = _buildForm({ name: 'Alice', email: 'not-an-email' });
    _submit(form);
    expect(form.querySelector('#contact-email-error').textContent).not.toBe('');
  });

  it('clears the name error when name is valid', () => {
    const form = _buildForm({ name: 'Alice', email: 'not-an-email' });
    _submit(form);
    expect(form.querySelector('#contact-name-error').textContent).toBe('');
  });

  it('does NOT send a fetch request when email is malformed', () => {
    const form = _buildForm({ name: 'Alice', email: 'not-an-email' });
    _submit(form);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects email without @', () => {
    const form = _buildForm({ email: 'nodomain' });
    _submit(form);
    expect(form.querySelector('#contact-email-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects email without domain dot', () => {
    const form = _buildForm({ email: 'user@localhost' });
    _submit(form);
    expect(form.querySelector('#contact-email-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('accepts a valid email address', () => {
    const form = _buildForm({ email: 'alice@example.com' });
    _submit(form);
    expect(form.querySelector('#contact-email-error').textContent).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// Field validation — message
// ─────────────────────────────────────────────────────────────

describe('message validation', () => {
  it('shows an error when message is empty', () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: '' });
    _submit(form);
    expect(form.querySelector('#contact-message-error').textContent).not.toBe('');
  });

  it('does NOT send a fetch request when message is empty', () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: '' });
    _submit(form);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only message', () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: '   ' });
    _submit(form);
    expect(form.querySelector('#contact-message-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a message exceeding 1000 characters', () => {
    const form = _buildForm({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'a'.repeat(1001)
    });
    _submit(form);
    expect(form.querySelector('#contact-message-error').textContent).not.toBe('');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// All fields valid
// ─────────────────────────────────────────────────────────────

describe('all fields valid', () => {
  it('clears all field errors and initiates a fetch request', async () => {
    const form = _buildForm({
      name:    'Alice',
      email:   'alice@example.com',
      message: 'Hello World'
    });
    _submit(form);

    // Field errors are cleared synchronously
    expect(form.querySelector('#contact-name-error').textContent).toBe('');
    expect(form.querySelector('#contact-email-error').textContent).toBe('');
    expect(form.querySelector('#contact-message-error').textContent).toBe('');

    // Fetch is called (async — wait for the call, not the response)
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalledOnce());
  });
});

// ─────────────────────────────────────────────────────────────
// XSS sanitization — payload escaping before fetch
// ─────────────────────────────────────────────────────────────
//
// Each test submits a known XSS vector as the name or message field,
// then inspects the JSON body passed to fetch() to confirm that raw
// HTML characters are escaped by sanitizeInput() before the data
// leaves the browser.
// ─────────────────────────────────────────────────────────────

describe('XSS sanitization in fetch payload', () => {
  // These tests need fetch to resolve so the payload is actually sent.
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  /** Submit and return the parsed JSON body from the first fetch call. */
  async function _capturePayload(form) {
    _submit(form);
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    return JSON.parse(options.body);
  }

  it('escapes <script> tag in name field', async () => {
    const form = _buildForm({ name: "<script>alert('xss')</script>" });
    const payload = await _capturePayload(form);
    expect(payload.name).not.toContain('<');
    expect(payload.name).not.toContain('>');
    expect(payload.name).toContain('&lt;script&gt;');
  });

  it('escapes <img onerror> vector in name field', async () => {
    const form = _buildForm({ name: '<img src=x onerror=alert(1)>' });
    const payload = await _capturePayload(form);
    expect(payload.name).not.toContain('<');
    expect(payload.name).not.toContain('>');
  });

  it('escapes double-quote in SQL-injection-style input in name field', async () => {
    const form = _buildForm({ name: '"; DROP TABLE users; --' });
    const payload = await _capturePayload(form);
    expect(payload.name).not.toContain('"');
    expect(payload.name).toContain('&quot;');
  });

  it('escapes <svg onload> vector in name field', async () => {
    const form = _buildForm({ name: '<svg onload=alert(1)>' });
    const payload = await _capturePayload(form);
    expect(payload.name).not.toContain('<');
    expect(payload.name).not.toContain('>');
  });

  it('passes javascript: protocol as safe plain text (no HTML chars to escape)', async () => {
    const form = _buildForm({ name: 'javascript:alert(1)' });
    const payload = await _capturePayload(form);
    // No angle brackets or quotes — sanitizeInput() leaves it unchanged.
    // Sent as plain text in JSON to Formspree; never rendered as a URL attribute.
    expect(payload.name).toBe('javascript:alert(1)');
  });

  it('escapes <script> tag in message field', async () => {
    const form = _buildForm({ message: "<script>alert('xss')</script>" });
    const payload = await _capturePayload(form);
    expect(payload.message).not.toContain('<');
    expect(payload.message).not.toContain('>');
    expect(payload.message).toContain('&lt;script&gt;');
  });

  it('escapes <img onerror> vector in message field', async () => {
    const form = _buildForm({ message: '<img src=x onerror=alert(1)>' });
    const payload = await _capturePayload(form);
    expect(payload.message).not.toContain('<');
    expect(payload.message).not.toContain('>');
  });

  it('escapes double-quote in SQL-injection-style input in message field', async () => {
    const form = _buildForm({ message: '"; DROP TABLE users; --' });
    const payload = await _capturePayload(form);
    expect(payload.message).not.toContain('"');
    expect(payload.message).toContain('&quot;');
  });

  it('escapes <svg onload> vector in message field', async () => {
    const form = _buildForm({ message: '<svg onload=alert(1)>' });
    const payload = await _capturePayload(form);
    expect(payload.message).not.toContain('<');
    expect(payload.message).not.toContain('>');
  });

  it('escapes single quotes in name field', async () => {
    const form = _buildForm({ name: "it's a trap" });
    const payload = await _capturePayload(form);
    expect(payload.name).not.toContain("'");
    expect(payload.name).toContain('&#x27;');
  });
});

// ─────────────────────────────────────────────────────────────
// Submit flow — fetch mock scenarios
// ─────────────────────────────────────────────────────────────

describe('submit flow — HTTP 200 success', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('shows a success status message', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#form-status').className).toContain('form-status--success')
    );
    expect(form.querySelector('#form-status').textContent).not.toBe('');
  });

  it('re-enables the submit button after success', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#contact-submit').disabled).toBe(false)
    );
  });

  it('resets form fields after success', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#contact-name').value).toBe('')
    );
    expect(form.querySelector('#contact-email').value).toBe('');
    expect(form.querySelector('#contact-message').value).toBe('');
  });
});

describe('submit flow — HTTP 500 error', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
  });

  it('shows an error status message', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#form-status').className).toContain('form-status--error')
    );
    expect(form.querySelector('#form-status').textContent).not.toBe('');
  });

  it('re-enables the submit button after error', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#contact-submit').disabled).toBe(false)
    );
  });

  it('does NOT reset form fields after error', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#form-status').className).toContain('form-status--error')
    );
    // Fields must NOT be cleared on error — user should be able to correct and retry
    expect(form.querySelector('#contact-name').value).toBe('Alice');
    expect(form.querySelector('#contact-message').value).toBe('Hello');
  });
});

describe('submit flow — network error', () => {
  it('shows an error status message on fetch rejection', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() =>
      expect(form.querySelector('#form-status').className).toContain('form-status--error')
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Fetch payload structure
// ─────────────────────────────────────────────────────────────

describe('fetch payload structure', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('sends a POST request to the Formspree endpoint', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://formspree.io/f/meevkole');
    expect(options.method).toBe('POST');
  });

  it('sends Content-Type: application/json and Accept: application/json', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['Accept']).toBe('application/json');
  });

  it('includes name, email, and message keys in the JSON body', async () => {
    const form = _buildForm({ name: 'Alice', email: 'alice@example.com', message: 'Hello' });
    _submit(form);
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('message');
  });
});

// ─────────────────────────────────────────────────────────────
// _setFormStatus edge case — missing status element
// ─────────────────────────────────────────────────────────────

describe('_setFormStatus with missing #form-status', () => {
  it('does not throw when #form-status element is absent from the form', () => {
    const form = _buildForm({ honeypot: 'bot-content' });
    form.querySelector('#form-status').remove();
    expect(() => _submit(form)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// _setFieldError without error element / form-field wrapper
// ─────────────────────────────────────────────────────────────

describe('_setFieldError without error spans', () => {
  it('does not throw when error spans are absent', () => {
    const form = document.createElement('form');
    form.id = 'contact-form';
    const nameInput = document.createElement('input');
    nameInput.id = 'contact-name';
    nameInput.value = '';  // invalid → triggers _setFieldError
    form.appendChild(nameInput);
    const emailInput = document.createElement('input');
    emailInput.id = 'contact-email';
    emailInput.value = 'test@example.com';
    form.appendChild(emailInput);
    const msgInput = document.createElement('textarea');
    msgInput.id = 'contact-message';
    msgInput.value = 'msg';
    form.appendChild(msgInput);
    const hp = document.createElement('input');
    hp.name = '_gotcha';
    hp.value = '';
    form.appendChild(hp);
    document.body.appendChild(form);
    expect(() => _submit(form)).not.toThrow();
  });
});
