import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectLanguage, getCurrentLanguage, setLanguage, initI18n } from '../../js/i18n.js';

describe('detectLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    // jsdom defaults navigator.language to 'en' (a supported language).
    // Stub it with an unsupported value so tests can control each path
    // independently — without this, localStorage-fallback tests would
    // incorrectly return 'en' from the browser-preference branch.
    vi.stubGlobal('navigator', { language: 'xx' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns "de" stored in localStorage', () => {
    localStorage.setItem('lang', 'de');
    expect(detectLanguage()).toBe('de');
  });

  it('returns "en" stored in localStorage', () => {
    localStorage.setItem('lang', 'en');
    expect(detectLanguage()).toBe('en');
  });

  it('falls back to "de" when localStorage is empty and browser lang is unsupported', () => {
    // navigator.language is 'xx' (unsupported) — final fallback must be 'de'
    expect(detectLanguage()).toBe('de');
  });

  it('uses the browser language when it is supported', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    expect(detectLanguage()).toBe('en');
  });

  it('parses "en-US" to "en" correctly', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(detectLanguage()).toBe('en');
  });

  it('rejects an invalid language code from localStorage', () => {
    localStorage.setItem('lang', 'fr');
    expect(detectLanguage()).toBe('de');
  });

  it('rejects XSS payloads from localStorage', () => {
    localStorage.setItem('lang', '<script>alert(1)</script>');
    expect(detectLanguage()).toBe('de');
  });

  it('rejects empty string from localStorage', () => {
    localStorage.setItem('lang', '');
    expect(detectLanguage()).toBe('de');
  });

  it('rejects null byte payloads from localStorage', () => {
    localStorage.setItem('lang', '\0de');
    expect(detectLanguage()).toBe('de');
  });

  it('localStorage takes priority over browser language', () => {
    localStorage.setItem('lang', 'de');
    vi.stubGlobal('navigator', { language: 'en' });
    expect(detectLanguage()).toBe('de');
  });
});

describe('getCurrentLanguage', () => {
  it('returns the lang attribute of <html>', () => {
    document.documentElement.lang = 'en';
    expect(getCurrentLanguage()).toBe('en');
  });

  it('returns "de" for an empty lang attribute', () => {
    document.documentElement.lang = '';
    expect(getCurrentLanguage()).toBe('de');
  });

  it('returns "de" for an invalid lang attribute', () => {
    document.documentElement.lang = 'xyz';
    expect(getCurrentLanguage()).toBe('de');
  });
});

describe('setLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'de';
  });

  it('updates document.documentElement.lang', () => {
    setLanguage('en', () => {});
    expect(document.documentElement.lang).toBe('en');
  });

  it('persists the language in localStorage', () => {
    setLanguage('en', () => {});
    expect(localStorage.getItem('lang')).toBe('en');
  });

  it('calls the render callback with the new language', () => {
    const callback = vi.fn();
    setLanguage('en', callback);
    expect(callback).toHaveBeenCalledWith('en');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not call callback for an unsupported language', () => {
    const callback = vi.fn();
    setLanguage('fr', callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not change lang for an unsupported language', () => {
    document.documentElement.lang = 'de';
    setLanguage('xx', () => {});
    expect(document.documentElement.lang).toBe('de');
  });

  it('still applies the language change when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    setLanguage('en', () => {});
    expect(document.documentElement.lang).toBe('en');
    vi.restoreAllMocks();
  });
});

// ─────────────────────────────────────────────────────────────
// detectLanguage — localStorage throws (storage blocked)
// ─────────────────────────────────────────────────────────────

describe('detectLanguage — localStorage blocked', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'xx' }); // unsupported browser lang
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('falls back to "de" when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(detectLanguage()).toBe('de');
  });

  it('uses the browser language when localStorage throws and browser lang is supported', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(detectLanguage()).toBe('en');
  });
});

// ─────────────────────────────────────────────────────────────
// initI18n
// ─────────────────────────────────────────────────────────────

describe('initI18n', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Remove any lang-toggle button left over
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.remove();
  });

  it('returns the detected language', () => {
    vi.stubGlobal('navigator', { language: 'en' });
    const lang = initI18n(() => {});
    expect(lang).toBe('en');
  });

  it('sets document.documentElement.lang to the detected language', () => {
    vi.stubGlobal('navigator', { language: 'xx' }); // unsupported → 'de'
    localStorage.setItem('lang', 'en');
    initI18n(() => {});
    expect(document.documentElement.lang).toBe('en');
  });

  it('works without a #lang-toggle button in the DOM', () => {
    expect(() => initI18n(() => {})).not.toThrow();
  });

  it('wires up the #lang-toggle click to call the render callback', () => {
    const toggle = document.createElement('button');
    toggle.id = 'lang-toggle';
    document.body.appendChild(toggle);

    localStorage.setItem('lang', 'de');
    const callback = vi.fn();
    initI18n(callback);
    callback.mockClear(); // ignore the initial call from initI18n itself

    toggle.click();
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('en'); // de → en
  });

  it('toggle click switches language from de to en', () => {
    const toggle = document.createElement('button');
    toggle.id = 'lang-toggle';
    document.body.appendChild(toggle);

    localStorage.setItem('lang', 'de');
    initI18n(() => {});
    document.documentElement.lang = 'de'; // ensure starting state

    toggle.click();
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates the toggle button text to the next language on init', () => {
    const toggle = document.createElement('button');
    toggle.id = 'lang-toggle';
    document.body.appendChild(toggle);

    localStorage.setItem('lang', 'de');
    initI18n(() => {});
    // Toggle should show the OTHER language (EN)
    expect(toggle.textContent).toBe('EN');
  });
});
