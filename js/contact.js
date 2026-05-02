/**
 * contact.js — Contact form handling.
 *
 * Flow: input → sanitize → validate → submit
 *
 * Security:
 *   - All inputs are sanitized via sanitizer.js before processing.
 *   - Honeypot field check silently rejects bot submissions.
 *   - Client-side rate limiting: 30s cooldown between submissions.
 *     (The form service enforces server-side rate limiting authoritatively.)
 *   - formAction URL is validated against an allowlist before fetch().
 *   - Error messages are generic — no internal state is leaked to the user.
 *   - Document-level event delegation survives re-renders and tile rebuilds.
 */

import { sanitizeInput, validateEmail, validateTextField } from './sanitizer.js';
import { DATA } from './data.js';
import { getCurrentLanguage } from './i18n.js';

const RATE_LIMIT_MS = 30_000; // 30 seconds between submissions

// Allowed form action base URLs
const ALLOWED_FORM_HOSTS = Object.freeze([
  'https://formspree.io/',
  'https://api.web3forms.com/'
]);

let _lastSubmitTime = 0;
let _statusTimer    = null;

/**
 * Initialize contact form event handling.
 * Uses document-level delegation so it survives re-renders and works
 * inside tiles (the old #contact section no longer exists in the DOM).
 */
export function initContact() {
  document.addEventListener('submit', event => {
    if (event.target.id !== 'contact-form') return;
    event.preventDefault();
    _handleSubmit(event.target);
  });
}

// ─────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────

function _handleSubmit(form) {
  const lang = getCurrentLanguage();
  const strings = DATA[lang].ui.contact.validation;

  // Rate limit check
  if (Date.now() - _lastSubmitTime < RATE_LIMIT_MS) {
    _setFormStatus(form, strings.tooManyRequests, 'error');
    return;
  }

  // Honeypot check — bots fill hidden fields, humans don't
  const honeypot = form.querySelector('[name="_gotcha"]');
  if (honeypot && honeypot.value !== '') {
    // Silently fake success — do not reveal the honeypot mechanism
    _setFormStatus(form, strings.success, 'success');
    return;
  }

  const nameInput    = form.querySelector('#contact-name');
  const emailInput   = form.querySelector('#contact-email');
  const messageInput = form.querySelector('#contact-message');

  if (!nameInput || !emailInput || !messageInput) return;

  const rawName    = nameInput.value;
  const rawEmail   = emailInput.value;
  const rawMessage = messageInput.value;

  // Validate
  let isValid = true;

  if (!validateTextField(rawName, 100)) {
    _setFieldError(form, 'contact-name', strings.nameRequired);
    isValid = false;
  } else {
    _clearFieldError(form, 'contact-name');
  }

  if (!validateEmail(rawEmail)) {
    _setFieldError(form, 'contact-email', strings.emailInvalid);
    isValid = false;
  } else {
    _clearFieldError(form, 'contact-email');
  }

  if (!validateTextField(rawMessage, 1000)) {
    _setFieldError(form, 'contact-message', strings.messageRequired);
    isValid = false;
  } else {
    _clearFieldError(form, 'contact-message');
  }

  if (!isValid) return;

  // Sanitize — defense-in-depth before sending to external service
  const payload = {
    name:    sanitizeInput(rawName),
    email:   sanitizeInput(rawEmail),
    message: sanitizeInput(rawMessage)
  };

  // Get and validate form action URL
  const formAction = DATA[lang].contact.formAction;
  if (!_isAllowedFormAction(formAction)) {
    // Form service not yet configured — show nothing (site not deployed yet)
    return;
  }

  _submitForm(form, formAction, payload, strings);
}

async function _submitForm(form, formAction, payload, strings) {
  const submitBtn = form.querySelector('#contact-submit');
  const statusEl  = form.querySelector('#form-status');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = strings.sending;
  }
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  }

  try {
    const response = await fetch(formAction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      _lastSubmitTime = Date.now();
      _setFormStatus(form, strings.success, 'success');
      form.reset();
    } else {
      // Do not expose server error details
      _setFormStatus(form, strings.error, 'error');
    }
  } catch (_e) {
    // Network error — do not expose details
    _setFormStatus(form, strings.error, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = DATA[getCurrentLanguage()].ui.contact.submitLabel;
    }
  }
}

/**
 * Validate that a form action URL is from an allowed host.
 * Prevents the fetch from being redirected to an unexpected endpoint.
 *
 * @param {unknown} url
 * @returns {boolean}
 */
function _isAllowedFormAction(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('{{')) return false;
  return ALLOWED_FORM_HOSTS.some(host => url.startsWith(host));
}

function _setFieldError(form, fieldId, message) {
  const errorEl = form.querySelector(`#${fieldId}-error`);
  const fieldEl = form.querySelector(`#${fieldId}`)?.closest('.form-field');

  if (errorEl) errorEl.textContent = message;
  if (fieldEl) fieldEl.classList.add('form-field--invalid');
}

function _clearFieldError(form, fieldId) {
  const errorEl = form.querySelector(`#${fieldId}-error`);
  const fieldEl = form.querySelector(`#${fieldId}`)?.closest('.form-field');

  if (errorEl) errorEl.textContent = '';
  if (fieldEl) fieldEl.classList.remove('form-field--invalid');
}

function _setFormStatus(form, message, type) {
  const statusEl = form.querySelector('#form-status');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `form-status form-status--${type}`;

  // Auto-dismiss after 5 seconds
  if (_statusTimer) clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'form-status';
    _statusTimer = null;
  }, 5000);
}
