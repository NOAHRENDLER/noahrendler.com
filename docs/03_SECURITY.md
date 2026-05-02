# SECURITY — Secure Development Guidelines

## Leitprinzip

Sicherheit ist nicht ein Feature das am Ende hinzugefügt wird — sie ist in jede Entscheidung eingebaut. Diese Seite ist das Portfolio eines Cybersecurity-Studenten. Der Code selbst muss demonstrieren, dass der Ersteller sichere Software entwickeln kann.

## 1. Content Security Policy (CSP)

### Meta-Tag im HTML Head

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self' https://formspree.io https://api.web3forms.com;
  form-action https://formspree.io https://api.web3forms.com;
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
">
```

### CSP Regeln erklärt
| Direktive | Wert | Begründung |
|---|---|---|
| `default-src` | `'self'` | Alles standardmäßig nur von eigener Domain |
| `script-src` | `'self'` | **Kein Inline-JS, kein eval()** — alles in externen Dateien |
| `style-src` | `'self'` + Google Fonts | Externe Fonts erlaubt, kein Inline-CSS via JS |
| `font-src` | `'self'` + Google Fonts CDN | Nur Fonts von gstatic |
| `img-src` | `'self'` + `data:` | Data-URIs für kleine Icons falls nötig |
| `connect-src` | `'self'` + Formular-Service | Nur der Form-Service darf per AJAX angesprochen werden |
| `form-action` | Formular-Service | Formulare dürfen nur an den Service submitten |
| `frame-ancestors` | `'none'` | Seite darf nicht in iframes eingebettet werden (Clickjacking-Schutz) |
| `base-uri` | `'self'` | Verhindert Base-Tag Injection |
| `object-src` | `'none'` | Keine Plugins/Embeds |

### Wichtig
- **Kein `'unsafe-inline'`** — weder für Scripts noch für Styles
- **Kein `'unsafe-eval'`** — kein `eval()`, kein `new Function()`, kein `setTimeout(string)`
- Alle Event-Handler werden in JS via `addEventListener()` registriert, nicht als HTML-Attribute

## 2. Subresource Integrity (SRI)

Für jede externe Ressource die per CDN geladen wird (aktuell nur Google Fonts CSS):

```html
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap"
      crossorigin="anonymous">
```

**Hinweis**: Google Fonts CSS-Dateien haben dynamische Inhalte (Browser-abhängig), SRI funktioniert hier nicht direkt. Zwei Lösungen:

**Option A (empfohlen)**: Fonts selbst hosten
- Fonts herunterladen und in `fonts/` ablegen
- Eigene `@font-face` Deklarationen in CSS
- Keine externe Abhängigkeit, volle CSP-Kontrolle
- SRI nicht nötig da `'self'`

**Option B**: Google Fonts akzeptieren
- `crossorigin="anonymous"` setzen
- In CSP explizit erlauben
- Akzeptieren dass SRI für Google Fonts nicht möglich ist

**Empfehlung: Option A — Fonts selbst hosten.** Eliminiert externe Abhängigkeit komplett.

## 3. Input-Sanitization (Kontaktformular)

### Sanitization-Pipeline

```javascript
// sanitizer.js — eigenständiges Modul, separat testbar

/**
 * Sanitize einen String für sichere Verwendung.
 * Entfernt/escaped potenziell gefährliche Zeichen.
 */
export function sanitizeInput(raw) {
  if (typeof raw !== 'string') return '';

  return raw
    .trim()
    // Null-Bytes entfernen
    .replace(/\0/g, '')
    // HTML-Entities escapen
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validiere E-Mail Format.
 * Kein Regex-Monster — einfache, sichere Prüfung.
 */
export function validateEmail(email) {
  const sanitized = sanitizeInput(email);
  // Einfache Validierung: enthält @, hat Text vor und nach @
  const parts = sanitized.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length === 0 || parts[1].length === 0) return false;
  if (!parts[1].includes('.')) return false;
  return true;
}

/**
 * Validiere Textfeld mit Längenbegrenzung.
 */
export function validateTextField(text, maxLength = 1000) {
  if (typeof text !== 'string') return false;
  if (text.trim().length === 0) return false;
  if (text.length > maxLength) return false;
  return true;
}
```

### Formular-Handling Regeln
1. **Alle Eingaben werden sanitized** bevor sie verarbeitet oder angezeigt werden
2. **Validation passiert Client-seitig UND der Service validiert serverseitig** — Client-Validation ist UX, nicht Security
3. **Honeypot-Feld** gegen einfache Bots:
   ```html
   <!-- Visuell versteckt per CSS, nicht per display:none oder visibility:hidden -->
   <div class="form-field--hp" aria-hidden="true" tabindex="-1">
     <label for="website">Website</label>
     <input type="text" name="website" id="website" autocomplete="off" tabindex="-1">
   </div>
   ```
4. **Rate-Limiting UI** — Submit-Button wird nach Absenden für X Sekunden deaktiviert
5. **Keine Fehlermeldungen die interne Logik verraten** — generische User-Feedback-Messages

## 4. Sichere DOM-Manipulation

### Verboten
```javascript
// ❌ NIEMALS — öffnet XSS-Vektoren
element.innerHTML = userControlledString;
element.outerHTML = anything;
document.write(anything);
element.insertAdjacentHTML('beforeend', userString);
```

### Erlaubt
```javascript
// ✅ Sicher — Text wird automatisch escaped
element.textContent = userString;

// ✅ Sicher — DOM-API statt String-Parsing
const el = document.createElement('div');
el.textContent = data.title;
el.classList.add('card-title');
container.appendChild(el);

// ✅ Sicher — Attribute setzen (keine Event-Handler als Strings)
el.setAttribute('data-id', sanitizedId);
el.setAttribute('aria-label', sanitizedLabel);
```

### Ausnahme: innerHTML für statische Markup-Fragmente
Wenn `innerHTML` verwendet wird, dann **ausschließlich mit hardcoded Strings** — niemals mit Variablen die aus DATA oder User-Input stammen:
```javascript
// ✅ Akzeptabel — komplett statischer String
container.innerHTML = '<span class="status-dot"></span>';

// ❌ NICHT akzeptabel — Variable im String
container.innerHTML = `<span class="status-dot">${status}</span>`;
```

## 5. Weitere Security Headers

Diese Header können auf Hostinger über `.htaccess` gesetzt werden (falls Apache) oder sind als Meta-Tags im HTML realisierbar:

```
# .htaccess für Hostinger (Apache)
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()"
Header always set X-XSS-Protection "0"
```

| Header | Zweck |
|---|---|
| `X-Content-Type-Options: nosniff` | Verhindert MIME-Type Sniffing |
| `X-Frame-Options: DENY` | Clickjacking-Schutz (Backup für CSP frame-ancestors) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Kontrolliert welche Info im Referer-Header gesendet wird |
| `Permissions-Policy` | Deaktiviert Browser-APIs die nicht gebraucht werden |
| `X-XSS-Protection: 0` | Deaktiviert den alten XSS-Filter (kann selbst Probleme verursachen, CSP ist besser) |

## 6. Secure Coding Practices — Checkliste

### JavaScript
- [ ] `'use strict'` in allen Dateien (oder ES Modules verwenden → automatisch strict)
- [ ] Keine globalen Variablen — alles in Modulen gekapselt
- [ ] Kein `eval()`, `new Function()`, `setTimeout(string)`
- [ ] Kein `innerHTML` mit dynamischen Daten
- [ ] Alle User-Inputs durch Sanitizer
- [ ] Keine sensiblen Daten in `console.log` (auch nicht auskommentiert)
- [ ] Keine Kommentare die interne Architektur an Angreifer verraten (in Production)
- [ ] `Object.freeze(DATA)` — DATA-Objekt gegen Mutation schützen

### HTML
- [ ] CSP Meta-Tag im Head
- [ ] Keine Inline Event-Handler (`onclick`, `onload` etc.)
- [ ] Keine Inline Styles in HTML-Elementen
- [ ] `rel="noopener noreferrer"` auf allen externen Links
- [ ] `autocomplete="off"` auf Honeypot-Feldern
- [ ] Korrekte `lang`-Attribute

### CSS
- [ ] Keine `expression()` (veraltet, aber erwähnenswert)
- [ ] Keine `url()` die auf externe Domains zeigen (außer selbstgehostete Fonts)
- [ ] Honeypot-Feld visuell versteckt, aber nicht via `display:none` (Bots erkennen das)

### Externe Ressourcen
- [ ] Fonts selbst gehostet (keine externen CDN-Abhängigkeiten)
- [ ] SRI-Hashes auf allen externen Ressourcen (falls doch externe Quellen nötig)
- [ ] `crossorigin="anonymous"` auf Cross-Origin-Requests

## 7. Threat Model für eine statische Portfolio-Seite

| Bedrohung | Risiko | Mitigierung |
|---|---|---|
| XSS via DOM-Manipulation | Mittel | CSP, kein innerHTML mit dynamischen Daten, textContent |
| Clickjacking | Niedrig | frame-ancestors 'none', X-Frame-Options |
| Form-Spam | Mittel | Honeypot, Rate-Limiting UI, Service-seitiges Rate-Limiting |
| E-Mail Header Injection | Niedrig (Service handled) | Input-Sanitization als Defense-in-Depth |
| Supply Chain (CDN Compromise) | Niedrig | Fonts selbst hosten, keine externen JS-Dependencies |
| Information Disclosure | Niedrig | Keine sensiblen Daten in Source, keine Debug-Logs |
| MIME Sniffing | Niedrig | X-Content-Type-Options: nosniff |

Dieses Threat Model ist bewusst auf die Angriffsfläche einer statischen Website zugeschnitten. Ein Blog mit dynamischem Content (Phase 2) würde das Threat Model erweitern.
