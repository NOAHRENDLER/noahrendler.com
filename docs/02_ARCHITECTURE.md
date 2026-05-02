# ARCHITECTURE — SOC Dashboard Portfolio

## Dateistruktur

```
portfolio/
├── index.html                 # Einzige HTML-Datei — Skeleton + Semantic Structure
├── css/
│   ├── variables.css          # CSS Custom Properties (Farben, Fonts, Spacing)
│   ├── reset.css              # Minimaler CSS-Reset (kein Framework)
│   ├── layout.css             # Grid, Topbar, Sidebar, Section-Container
│   ├── components.css         # Status-Pills, Badges, Severity-Dots, Cards
│   ├── forms.css              # Kontaktformular Styles
│   ├── scanline.css           # Scanline Overlay-Effekt
│   └── responsive.css         # Mobile-Breakpoints
├── js/
│   ├── data.js                # DATA-Objekt mit allen Inhalten (de/en)
│   ├── renderer.js            # Render-Engine: DATA → DOM
│   ├── i18n.js                # Sprachumschaltung Logik
│   ├── clock.js               # Live-Uhr in Topbar
│   ├── nav.js                 # Sidebar-Navigation, Active State, Scroll-Tracking
│   ├── contact.js             # Formular-Handling, Validation, Sanitization
│   └── main.js                # Entry Point — initialisiert alle Module
├── tests/
│   ├── unit/
│   │   ├── data.test.js       # DATA-Objekt Validierung
│   │   ├── renderer.test.js   # Render-Engine Tests
│   │   ├── i18n.test.js       # Sprachumschaltung Tests
│   │   ├── sanitizer.test.js  # Input-Sanitization Tests
│   │   └── contact.test.js    # Formular-Logik Tests
│   ├── integration/
│   │   ├── render-flow.test.js    # DATA → DOM Pipeline
│   │   └── language-switch.test.js # i18n + Render Integration
│   └── security/
│       ├── csp-check.test.js      # CSP Header Validation
│       ├── xss-vectors.test.js    # XSS-Resistenz Tests
│       └── sri-check.test.js      # SRI Hash Verification
├── package.json               # Nur Dev-Dependencies (Testing, Linting)
├── .eslintrc.json             # ESLint Konfiguration (Security Rules)
├── vitest.config.js           # Test-Runner Konfiguration
└── docs/                      # Diese Dokumentation
    ├── 01_PROJECT_OVERVIEW.md
    ├── 02_ARCHITECTURE.md
    ├── 03_SECURITY.md
    ├── 04_TESTING.md
    ├── 05_IMPLEMENTATION_GUIDE.md
    └── 06_DEPLOYMENT.md
```

## Architektur-Prinzip: Separation of Concerns

```
┌──────────────────────────────────────────────────────┐
│                    index.html                        │
│              (Semantic HTML Skeleton)                 │
│         Enthält NUR Struktur, keine Inhalte          │
└──────────────────┬───────────────────────────────────┘
                   │ lädt
                   ▼
┌──────────────────────────────────────────────────────┐
│                    main.js                            │
│              (Entry Point / Bootstrap)                │
│  1. Sprache ermitteln (localStorage / Browser-Pref)  │
│  2. Renderer initialisieren                          │
│  3. Navigation aktivieren                            │
│  4. Uhr starten                                      │
│  5. Kontaktformular initialisieren                   │
└──────────────────┬───────────────────────────────────┘
                   │ importiert
          ┌────────┼────────┐
          ▼        ▼        ▼
      data.js  renderer.js  i18n.js
      (Inhalt)  (DOM-Bau)   (Sprache)
```

## DATA-Objekt Struktur (data.js)

```javascript
const DATA = {
  meta: {
    version: "1.0.0",
    lastUpdated: "2025-XX-XX"
  },

  de: {
    status: {
      name: "{{NAME}}",
      title: "Cybersecurity Student",
      location: "Raum Stuttgart",
      status: "SEEKING PLACEMENT",
      specializations: ["Network Security", "OSINT", "Penetration Testing"],
      bio: "..."
    },
    threatIntel: [
      {
        id: "TI-2025-001",
        date: "2025-XX-XX",
        severity: "high",      // critical | high | medium | low | info
        category: "project",   // project | ctf | research | certification
        title: "...",
        summary: "...",
        tags: ["OSINT", "Python"],
        link: null
      }
    ],
    skills: [
      {
        tool: "Wireshark",
        category: "Network Analysis",
        proficiency: "advanced",  // beginner | intermediate | advanced | expert
        years: 2
      }
    ],
    cases: [
      {
        id: "CASE-001",
        status: "closed",       // open | in-progress | closed
        title: "...",
        description: "...",
        tech: ["Python", "Kali Linux"],
        started: "2024-XX-XX",
        closed: "2025-XX-XX",
        link: "https://github.com/..."
      }
    ],
    contact: {
      email: "{{EMAIL}}",
      linkedin: "{{LINKEDIN_URL}}",
      github: "{{GITHUB_URL}}",
      formAction: "https://formspree.io/f/{{FORM_ID}}"
    },
    ui: {
      topbar: { title: "SOC // PORTFOLIO", statusLabel: "SUCHE BACHELORARBEIT" },
      nav: {
        status: "Status Panel",
        threatIntel: "Threat Intel",
        skills: "Skills Matrix",
        cases: "Active Cases",
        contact: "Contact"
      },
      // ... weitere UI-Strings
    }
  },

  en: {
    // Identische Struktur, englische Inhalte
    // ...
  }
};
```

### Regeln für das DATA-Objekt
1. **Keine HTML-Strings in DATA** — nur reiner Text, Renderer erzeugt HTML
2. **Alle Texte in beiden Sprachen** — fehlende Übersetzung → Fallback auf DE
3. **Platzhalter für persönliche Daten** — `{{NAME}}`, `{{EMAIL}}` etc. als erkennbare Marker
4. **IDs sind einzigartig** — `TI-YYYY-NNN` für Threat Intel, `CASE-NNN` für Cases
5. **Severity/Status nur vordefinierte Werte** — werden in Tests validiert

## Renderer (renderer.js)

Der Renderer ist eine reine Funktion: `DATA[lang] → DOM`

```
renderer.js
├── renderStatusPanel(data)     → #status-panel
├── renderThreatIntel(data)     → #threat-intel
├── renderSkillsMatrix(data)    → #skills-matrix
├── renderActiveCases(data)     → #active-cases
├── renderContact(data)         → #contact
└── renderAll(lang)             → ruft alle auf
```

### Rendering-Regeln
1. **Kein `innerHTML` mit User-Daten** — ausschließlich `textContent` und `createElement`
2. **DATA wird nicht mutiert** — Renderer liest nur
3. **Idempotent** — `renderAll()` kann jederzeit erneut aufgerufen werden (z.B. bei Sprachwechsel)
4. **Keine DOM-Queries in Render-Funktionen** — Container werden als Parameter übergeben

## i18n (i18n.js)

```javascript
// Sprachermittlung Priorität:
// 1. localStorage Wert (User hat manuell gewählt)
// 2. navigator.language (Browser-Einstellung)
// 3. Fallback: "de"

// Sprachwechsel:
// 1. Lang in localStorage speichern
// 2. html[lang] Attribut setzen
// 3. renderer.renderAll(newLang) aufrufen
// 4. Toggle-Button Text aktualisieren
```

## Kontaktformular (contact.js)

```
Eingabe → Sanitize → Validate → Submit
                                   │
                    ┌──────────────┤
                    ▼              ▼
                Success        Error
                (UI-Feedback)  (UI-Feedback)
```

Details zur Sanitization und Validation: siehe `03_SECURITY.md`

## Module-Loading Strategie

Kein Bundler, kein Build-Step. Stattdessen:

```html
<!-- Am Ende von index.html -->
<script src="js/data.js"></script>
<script src="js/i18n.js"></script>
<script src="js/renderer.js"></script>
<script src="js/clock.js"></script>
<script src="js/nav.js"></script>
<script src="js/contact.js"></script>
<script src="js/main.js"></script>
```

Alternativ: `type="module"` mit ES-Module-Imports, falls der Browser-Support reicht (tut er — alle modernen Browser). **Empfehlung: ES Modules verwenden.**

```html
<script type="module" src="js/main.js"></script>
```

```javascript
// main.js
import { DATA } from './data.js';
import { initI18n } from './i18n.js';
import { renderAll } from './renderer.js';
import { initClock } from './clock.js';
import { initNav } from './nav.js';
import { initContact } from './contact.js';
```

**Vorteil von ES Modules:**
- Kein globaler Namespace-Pollution
- Explizite Abhängigkeiten
- Bessere Testbarkeit (Module können isoliert importiert werden)
- `strict mode` automatisch aktiv

## Erweiterbarkeit: Phase 2 Blog

Die Architektur ist so angelegt, dass ein Blog ergänzbar ist ohne bestehenden Code umzubauen:

1. `DATA.de.posts` / `DATA.en.posts` Array hinzufügen
2. `renderer.renderBlog(data)` Funktion ergänzen
3. Neuen Nav-Eintrag in `DATA.ui.nav` eintragen
4. Einzelne Blog-Posts als separate HTML-Dateien in `blog/` (oder Markdown mit Client-Side Rendering)

Kein Refactoring der bestehenden Sections nötig.
