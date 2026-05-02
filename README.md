# SOC Portfolio — Noah Rendler

## Overview

A cybersecurity portfolio built as a SOC/SIEM-style operations dashboard instead of a conventional resume page. The layout mirrors a real analyst workstation: a 10-tile grid where each tile represents a domain (profile, projects, skills, certs, threat intel, and more), each expandable into a full detail view. There is no framework, no build step, and no external runtime dependencies — the entire site is vanilla HTML, CSS, and ES Modules. Content is driven entirely from a single `data.js` file, making updates a one-file operation.

## Live Demo

[https://noahrendler.com](https://noahrendler.com)

## Architecture

```
index.html              Static shell — topbar, grid container, topology overlay
js/
  main.js               Bootstrap entry point
  data.js               All site content (single source of truth)
  tiles-config.js       Grid layout — 10 tile definitions
  renderer.js           All DOM rendering functions
  navigation.js         3-level History API drill-down
  i18n.js               Language detection and switching
  clock.js              Live topbar clock
  contact.js            Contact form handling (sanitize → validate → submit)
  sanitizer.js          Pure input sanitization (no DOM access, fully testable)
  topology.js           Interactive homelab network diagram
css/
  variables.css         Design tokens (CSS custom properties)
  reset.css             CSS reset
  layout.css            Page structure and grid
  components.css        All UI components and tiles
  forms.css             Contact form styles
  scanline.css          CRT scanline overlay effect
  responsive.css        Responsive breakpoints
fonts/                  Self-hosted JetBrains Mono and Space Grotesk
tests/
  unit/                 Unit tests (clock, contact, data, i18n, navigation,
                        renderer, sanitizer, tiles-config, tiles)
  security/             CSP coverage and XSS vector tests
  integration/          Full render-flow integration tests
```

**Data-driven approach:** `data.js` is the only file that needs to change to update site content. It contains all text, project entries, certifications, skills, threat intel articles, CV entries, and UI strings for both languages. The renderer reads from this object and builds DOM via `createElement` — no HTML strings in data, no template literals with variable interpolation.

**Adding a new tile:** add an entry to `tiles-config.js`, a renderer function in `renderer.js`, and the content data in `data.js`. No HTML or CSS changes needed.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES Modules, strict mode) |
| Markup | HTML5 |
| Styling | CSS3 — custom properties, CSS Grid |
| Fonts | JetBrains Mono, Space Grotesk (self-hosted, no CDN) |
| Testing | Vitest + jsdom |
| Linting | ESLint 9 + eslint-plugin-security |
| Dev server | `npx serve` (no install, dev-only) |
| Hosting | Hostinger (Apache) |

No runtime dependencies. `devDependencies` are tooling only and are never deployed.

## Features

**Dashboard tiles — compact view:**
- **Analyst Profile** — name, title, bio, specializations, TryHackMe badge, tech tags
- **Network Topology** — homelab diagram thumbnail (interactive on expand)
- **Threat Intel Feed** — curated security research articles with severity badges
- **Career Timeline** — CV entries with role, employer, and date range
- **Projects** — portfolio project cards with status and tech stack
- **Certifications** — cert list with issuer, date, and status badges
- **System Monitor** — homelab service uptime overview
- **Skills Matrix** — security tools grouped by category with proficiency levels
- **Secure Contact** — in-tile contact form (no page navigation required)
- **Threat Radar** — SVG polygon chart showing skill coverage by domain; hover to zoom

**Expanded views (click any tile except System Monitor and Contact):**
- Each tile opens a full-width detail panel with additional content
- Projects tile has a third drill-down level: tile → project list → single project detail
- All transitions use the History API — browser back/forward works correctly

**Interactive topology overlay:**
- Fullscreen network diagram with 18 nodes across SOC Zone and Life Zone
- Drag-and-drop node repositioning
- Click any node for a detail panel (type, OS, ports, description)
- Animated SVG connection paths with per-zone color coding

**Navigation:**
- 3-level drill-down: grid (L1) → expanded panel (L2) → project detail (L3)
- Keyboard: `Enter`/`Space` to expand, `Escape` to collapse
- History API with `pushState` — shareable URLs (`#projects`, `#projects/project-id`)

**Bilingual DE/EN:**
- Language resolved from `localStorage` → `navigator.language` → `'de'`
- Toggle button in topbar; selection persists across sessions
- Full content translation including all UI strings

**Live clock** — real-time display in topbar with ISO date, time, and local timezone.

**CRT aesthetic** — full-page scanline overlay via CSS, no JavaScript required.

## Security

**Content Security Policy** — enforced via `<meta http-equiv="Content-Security-Policy">` in `index.html`:
- `default-src 'self'` — everything served from own domain
- `script-src 'self'` — no inline JS, no `eval()`
- `style-src 'self'` — no inline styles injected via JS
- `font-src 'self'` — fonts self-hosted, no CDN
- `connect-src 'self' https://formspree.io https://api.web3forms.com` — only the form service allowed
- `frame-ancestors 'none'` — clickjacking protection
- `object-src 'none'` — no plugins
- `base-uri 'self'` — prevents base-tag injection

**No `unsafe-inline`, no `unsafe-eval`** — all event handlers registered via `addEventListener`, no inline attributes.

**DOM manipulation** — `innerHTML` is never used with any variable from `DATA` or user input. SVG icons are parsed via `DOMParser` and imported with `document.importNode()`. All text content uses `textContent`.

**`sanitizer.js`** — pure module (no DOM access, fully unit-tested):
- `sanitizeInput()` — trims, removes null bytes, escapes HTML entities (`&`, `<`, `>`, `"`, `'`)
- `validateEmail()` — RFC 5321-aware length checks, no ReDoS-prone regex
- `validateTextField()` — length-bounded non-empty check

**Contact form hardening:**
- Honeypot field — bots fill it, humans don't; silently fakes success on trigger
- Client-side rate limit — 30-second cooldown between submissions
- Form action allowlist — `fetch()` target validated against `['https://formspree.io/', 'https://api.web3forms.com/']` before any network request
- Generic error messages — no internal state exposed to the user

**`.htaccess` security headers:**
- `X-Frame-Options: DENY` (backup for CSP `frame-ancestors`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — camera, microphone, geolocation, payment disabled
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — HSTS
- HTTPS redirect via `RewriteEngine` (301)
- Cache directives: fonts 1 year, CSS/JS 1 month, images 1 month
- Directory listing disabled (`Options -Indexes`)
- 404 → `index.html` (SPA-friendly fallback)

**Security test suite** — `tests/security/csp-check.test.js` and `tests/security/xss-vectors.test.js` verify CSP directives and that XSS vectors are handled correctly.

## Deployment

No build step. Upload the static files directly.

**Files to deploy** (everything except `node_modules/`, `tests/`, `coverage/`, `docs/`, config files):

```
public_html/
├── index.html
├── .htaccess
├── css/          (all 7 CSS files)
├── js/           (all JS modules)
└── fonts/        (all 5 woff2 files)
```

**Steps:**

1. Run `npm run check` locally — lint and all 424 tests must pass.
2. Replace any remaining `{{PLACEHOLDER}}` values in `data.js`.
3. Log in to Hostinger → File Manager → navigate to `public_html/`.
4. Upload the files above, preserving the directory structure.
5. Enable SSL in the Hostinger dashboard (free). HSTS and the HTTPS redirect are already active in `.htaccess`.

**Post-deployment verification:**
- Browser DevTools → Console: no errors
- Browser DevTools → Network: no 404s
- [securityheaders.com](https://securityheaders.com) — target: grade A
- [observatory.mozilla.org](https://observatory.mozilla.org) — CSP, HSTS, redirects

**Future option:** Hostinger supports Git-based auto-deployment. Connect the repository, select the `main` branch, and pushes will trigger automatic deploys. A `.gitignore` excluding `node_modules/`, `coverage/`, and `tests/` keeps the deploy artifact clean.

## Local Development

```bash
npm install           # installs dev dependencies (Vitest, ESLint, jsdom, serve)
npm run dev           # starts http://localhost:8080 via npx serve
```

A local server is required because ES Modules are blocked by browsers when opened via `file://`. `npm run dev` uses `npx serve` — no global install needed.

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:coverage # coverage report in coverage/
npm run lint          # ESLint with security plugin
npm run check         # lint + tests (run this before every deployment)
```

**Note:** Vitest outputs a handful of `HTMLCanvasElement.getContext is not implemented` warnings during the test run. These are expected — jsdom does not implement Canvas without the optional `canvas` npm package. They are not test failures.

## License

MIT License — Noah Rendler 2026
