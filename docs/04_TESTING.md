# TESTING — Test-Strategie & Implementierung

## Philosophie

Getestet wird alles was Logik enthält. Reines HTML/CSS (Layout, Farben, Spacing) wird nicht automatisiert getestet — das ist visuelles Review. Aber jede JavaScript-Funktion die Daten transformiert, DOM erzeugt, Input verarbeitet oder Zustände wechselt, bekommt Tests.

## Test-Stack

| Tool | Zweck | Warum |
|---|---|---|
| **Vitest** | Test-Runner + Assertions | Schnell, ES-Module-native, kein Babel nötig |
| **jsdom** | DOM-Simulation | In Vitest integriert, ermöglicht DOM-Tests ohne Browser |
| **ESLint** | Statische Code-Analyse | Findet Bugs und Security-Issues vor Runtime |
| **eslint-plugin-security** | Security-spezifische Linting Rules | Warnt vor unsicheren Patterns (eval, innerHTML etc.) |

### package.json (Dev-Dependencies)

```json
{
  "name": "soc-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint js/",
    "lint:security": "eslint js/ --rule '{\"security/detect-eval-with-expression\": \"error\", \"security/detect-non-literal-regexp\": \"warn\"}'",
    "check": "npm run lint && npm run test"
  },
  "devDependencies": {
    "vitest": "^3.x",
    "jsdom": "^25.x",
    "eslint": "^9.x",
    "eslint-plugin-security": "^3.x",
    "@vitest/coverage-v8": "^3.x"
  }
}
```

### vitest.config.js

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js'],
      exclude: ['js/data.js'],  // DATA ist Konfiguration, kein Code
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
```

## Test-Kategorien

### 1. Unit Tests

#### data.test.js — DATA-Objekt Integrität

```javascript
import { describe, it, expect } from 'vitest';
import { DATA } from '../../js/data.js';

describe('DATA object integrity', () => {
  it('has both language keys', () => {
    expect(DATA).toHaveProperty('de');
    expect(DATA).toHaveProperty('en');
  });

  it('has identical structure for both languages', () => {
    const deKeys = Object.keys(DATA.de).sort();
    const enKeys = Object.keys(DATA.en).sort();
    expect(deKeys).toEqual(enKeys);
  });

  it('all threat intel entries have valid severity', () => {
    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    for (const lang of ['de', 'en']) {
      DATA[lang].threatIntel.forEach(entry => {
        expect(validSeverities).toContain(entry.severity);
      });
    }
  });

  it('all case entries have valid status', () => {
    const validStatuses = ['open', 'in-progress', 'closed'];
    for (const lang of ['de', 'en']) {
      DATA[lang].cases.forEach(c => {
        expect(validStatuses).toContain(c.status);
      });
    }
  });

  it('all IDs are unique within their category', () => {
    for (const lang of ['de', 'en']) {
      const tiIds = DATA[lang].threatIntel.map(e => e.id);
      expect(new Set(tiIds).size).toBe(tiIds.length);

      const caseIds = DATA[lang].cases.map(c => c.id);
      expect(new Set(caseIds).size).toBe(caseIds.length);
    }
  });

  it('contains no HTML in text fields', () => {
    const htmlRegex = /<[^>]+>/;
    for (const lang of ['de', 'en']) {
      DATA[lang].threatIntel.forEach(entry => {
        expect(entry.title).not.toMatch(htmlRegex);
        expect(entry.summary).not.toMatch(htmlRegex);
      });
    }
  });
});
```

#### sanitizer.test.js — Input-Sanitization

```javascript
import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateEmail, validateTextField } from '../../js/sanitizer.js';

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('escapes HTML entities', () => {
    expect(sanitizeInput('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('removes null bytes', () => {
    expect(sanitizeInput('hello\0world')).toBe('helloworld');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(42)).toBe('');
    expect(sanitizeInput({})).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('escapes single quotes', () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it('handles mixed attack vectors', () => {
    const input = '"><img src=x onerror=alert(1)>';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('name.surname@domain.de')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(42)).toBe(false);
  });
});

describe('validateTextField', () => {
  it('accepts valid text', () => {
    expect(validateTextField('Hello World')).toBe(true);
  });

  it('rejects empty or whitespace-only text', () => {
    expect(validateTextField('')).toBe(false);
    expect(validateTextField('   ')).toBe(false);
  });

  it('rejects text exceeding maxLength', () => {
    expect(validateTextField('a'.repeat(1001), 1000)).toBe(false);
  });

  it('accepts text at exact maxLength', () => {
    expect(validateTextField('a'.repeat(1000), 1000)).toBe(true);
  });
});
```

#### renderer.test.js — Render-Engine

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderStatusPanel, renderThreatIntel } from '../../js/renderer.js';

describe('renderStatusPanel', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders name as textContent, not innerHTML', () => {
    const data = {
      name: '<script>alert("xss")</script>',
      title: 'Test',
      location: 'Test',
      status: 'SEEKING',
      specializations: [],
      bio: ''
    };
    renderStatusPanel(container, data);
    // Der Script-Tag darf NICHT als HTML gerendert werden
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('<script>');
  });

  it('creates specialization tags', () => {
    const data = {
      name: 'Test',
      title: 'Test',
      location: 'Test',
      status: 'SEEKING',
      specializations: ['OSINT', 'Pentesting'],
      bio: ''
    };
    renderStatusPanel(container, data);
    const tags = container.querySelectorAll('.tag');
    expect(tags.length).toBe(2);
  });
});

describe('renderThreatIntel', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders entries in reverse chronological order', () => {
    const data = [
      { id: 'TI-001', date: '2024-01-01', severity: 'low', category: 'project', title: 'First', summary: '', tags: [] },
      { id: 'TI-002', date: '2025-06-01', severity: 'high', category: 'ctf', title: 'Second', summary: '', tags: [] }
    ];
    renderThreatIntel(container, data);
    const entries = container.querySelectorAll('.threat-entry');
    expect(entries[0].textContent).toContain('Second');
  });

  it('applies correct severity class', () => {
    const data = [
      { id: 'TI-001', date: '2024-01-01', severity: 'critical', category: 'project', title: 'Test', summary: '', tags: [] }
    ];
    renderThreatIntel(container, data);
    const dot = container.querySelector('.severity-dot');
    expect(dot.classList.contains('severity--critical')).toBe(true);
  });
});
```

#### i18n.test.js — Sprachumschaltung

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { detectLanguage, setLanguage, getCurrentLanguage } from '../../js/i18n.js';

describe('detectLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns stored language from localStorage', () => {
    localStorage.setItem('lang', 'en');
    expect(detectLanguage()).toBe('en');
  });

  it('falls back to "de" when no preference exists', () => {
    expect(detectLanguage()).toBe('de');
  });

  it('rejects invalid language values from localStorage', () => {
    localStorage.setItem('lang', '<script>alert(1)</script>');
    expect(detectLanguage()).toBe('de');
  });

  it('only accepts whitelisted language codes', () => {
    localStorage.setItem('lang', 'fr');
    expect(detectLanguage()).toBe('de');
  });
});
```

### 2. Integration Tests

#### render-flow.test.js — DATA → DOM Pipeline

```javascript
import { describe, it, expect } from 'vitest';
import { DATA } from '../../js/data.js';
import { renderAll } from '../../js/renderer.js';

describe('Full render pipeline', () => {
  it('renders all sections without errors for DE', () => {
    document.body.innerHTML = `
      <div id="status-panel"></div>
      <div id="threat-intel"></div>
      <div id="skills-matrix"></div>
      <div id="active-cases"></div>
      <div id="contact"></div>
    `;
    expect(() => renderAll('de')).not.toThrow();
  });

  it('renders all sections without errors for EN', () => {
    document.body.innerHTML = `
      <div id="status-panel"></div>
      <div id="threat-intel"></div>
      <div id="skills-matrix"></div>
      <div id="active-cases"></div>
      <div id="contact"></div>
    `;
    expect(() => renderAll('en')).not.toThrow();
  });

  it('re-renders cleanly on language switch (no duplicate elements)', () => {
    document.body.innerHTML = `
      <div id="status-panel"></div>
      <div id="threat-intel"></div>
      <div id="skills-matrix"></div>
      <div id="active-cases"></div>
      <div id="contact"></div>
    `;
    renderAll('de');
    renderAll('en');
    renderAll('de');
    // Jede Section darf nur EINMAL gerendert sein
    const panels = document.querySelectorAll('#status-panel > *');
    // Überprüfe dass keine duplizierten Kinder existieren
    expect(panels.length).toBeGreaterThan(0);
  });
});
```

### 3. Security Tests

#### xss-vectors.test.js — XSS-Resistenz

```javascript
import { describe, it, expect } from 'vitest';
import { renderAll } from '../../js/renderer.js';

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  "';alert(String.fromCharCode(88,83,83))//",
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)">',
  '{{constructor.constructor("alert(1)")()}}',
  '<img src=x onerror=alert(1)//',
  '\"><script>alert(document.cookie)</script>',
  '<body onload=alert(1)>'
];

describe('XSS resistance', () => {
  XSS_PAYLOADS.forEach((payload, index) => {
    it(`resists XSS vector #${index + 1}: ${payload.substring(0, 30)}...`, () => {
      // Injiziere Payload in DATA-Struktur
      const maliciousData = createMaliciousData(payload);

      document.body.innerHTML = `
        <div id="status-panel"></div>
        <div id="threat-intel"></div>
        <div id="skills-matrix"></div>
        <div id="active-cases"></div>
        <div id="contact"></div>
      `;

      // Render darf keinen ausführbaren HTML-Code erzeugen
      renderAll('de', maliciousData);

      const html = document.body.innerHTML;
      expect(html).not.toContain('<script');
      expect(html).not.toContain('onerror=');
      expect(html).not.toContain('onload=');
      expect(html).not.toContain('javascript:');
    });
  });
});

function createMaliciousData(payload) {
  // Erstellt ein DATA-Objekt wo alle Text-Felder den Payload enthalten
  return {
    de: {
      status: {
        name: payload,
        title: payload,
        location: payload,
        status: payload,
        specializations: [payload],
        bio: payload
      },
      threatIntel: [{
        id: 'TI-EVIL-001',
        date: '2025-01-01',
        severity: 'high',
        category: 'project',
        title: payload,
        summary: payload,
        tags: [payload]
      }],
      skills: [{
        tool: payload,
        category: payload,
        proficiency: 'advanced',
        years: 1
      }],
      cases: [{
        id: 'CASE-EVIL',
        status: 'open',
        title: payload,
        description: payload,
        tech: [payload],
        started: '2025-01-01',
        closed: null,
        link: null
      }],
      contact: {
        email: payload,
        linkedin: payload,
        github: payload,
        formAction: 'https://formspree.io/f/test'
      },
      ui: {
        topbar: { title: payload, statusLabel: payload },
        nav: {
          status: payload,
          threatIntel: payload,
          skills: payload,
          cases: payload,
          contact: payload
        }
      }
    }
  };
}
```

#### csp-check.test.js — CSP Validation

```javascript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('CSP configuration', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('has a CSP meta tag', () => {
    expect(html).toContain('Content-Security-Policy');
  });

  it('does not allow unsafe-inline for scripts', () => {
    const cspMatch = html.match(/content="([^"]*Content-Security-Policy[^"]*)"/i);
    if (cspMatch) {
      expect(cspMatch[1]).not.toContain("'unsafe-inline'");
    }
  });

  it('does not allow unsafe-eval', () => {
    const cspMatch = html.match(/content="([^"]*Content-Security-Policy[^"]*)"/i);
    if (cspMatch) {
      expect(cspMatch[1]).not.toContain("'unsafe-eval'");
    }
  });

  it('has no inline event handlers in HTML', () => {
    const inlineHandlers = /\s(on\w+)=/gi;
    const matches = html.match(inlineHandlers);
    expect(matches).toBeNull();
  });

  it('has no inline script tags', () => {
    // Erlaubt: <script src="..."> und <script type="module" src="...">
    // Verboten: <script>...code...</script>
    const inlineScripts = /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi;
    const matches = html.match(inlineScripts);
    expect(matches).toBeNull();
  });
});
```

## ESLint Konfiguration

```json
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2024": true
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["security"],
  "extends": [
    "eslint:recommended",
    "plugin:security/recommended-legacy"
  ],
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "no-alert": "warn",
    "no-console": "warn",
    "strict": ["error", "safe"],
    "eqeqeq": ["error", "always"],
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

## Test-Ausführung

```bash
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# Nur Linting
npm run lint

# Alles zusammen (CI-Style)
npm run check
```

## Coverage-Ziele

| Metrik | Minimum | Ziel |
|---|---|---|
| Statements | 80% | 90%+ |
| Branches | 80% | 85%+ |
| Functions | 80% | 90%+ |
| Lines | 80% | 90%+ |

`data.js` ist von Coverage ausgenommen — es enthält nur Konfiguration/Content, keinen testbaren Code.
