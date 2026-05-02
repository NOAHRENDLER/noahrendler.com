// i18n.js — Language detection and switching.
// Resolution: localStorage → navigator.language → 'de'
// Security: only SUPPORTED_LANGS accepted; localStorage wrapped in try/catch.

const SUPPORTED_LANGS = Object.freeze(['de', 'en']);
const DEFAULT_LANG = 'de';
const STORAGE_KEY = 'lang';

export function detectLanguage() {
  // 1. localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
  } catch (_e) {
    // Storage blocked — proceed to next check
  }

  // 2. Browser preference
  const browserLang = (navigator.language ?? '').split('-')[0].toLowerCase();
  if (SUPPORTED_LANGS.includes(browserLang)) {
    return browserLang;
  }

  // 3. Fallback
  return DEFAULT_LANG;
}

export function getCurrentLanguage() {
  const lang = document.documentElement.lang;
  return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

export function setLanguage(lang, renderCallback) {
  if (!SUPPORTED_LANGS.includes(lang)) return;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (_e) {
    // Storage blocked — language won't persist across sessions, but works now
  }

  document.documentElement.lang = lang;
  _updateToggleButton(lang);
  renderCallback(lang);
}

/** @returns {'de' | 'en'} initial language */
export function initI18n(renderCallback) {
  const lang = detectLanguage();
  document.documentElement.lang = lang;
  _updateToggleButton(lang);

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = getCurrentLanguage();
      const next = current === 'de' ? 'en' : 'de';
      setLanguage(next, renderCallback);
    });
  }

  return lang;
}

function _updateToggleButton(activeLang) {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;

  const nextLang = activeLang === 'de' ? 'en' : 'de';
  toggle.textContent = nextLang.toUpperCase();
  toggle.setAttribute(
    'aria-label',
    activeLang === 'de' ? 'Switch to English' : 'Zu Deutsch wechseln'
  );
}
