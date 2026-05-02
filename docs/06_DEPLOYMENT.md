# DEPLOYMENT — Hostinger Setup & Workflow

## Aktuelle Methode: Manuell per File Manager

### Voraussetzungen
- Hostinger Account mit aktiver Hosting-Plan
- Domain verknüpft (oder Hostinger-Subdomain nutzen)
- FTP/File Manager Zugang im Hostinger Dashboard

### Deployment-Schritte

1. **Deployment-Paket lokal erstellen**
   Kopiere nur die Production-Dateien (ohne Dev-Tools):
   ```
   deployment/
   ├── index.html
   ├── css/
   │   ├── variables.css
   │   ├── reset.css
   │   ├── layout.css
   │   ├── components.css
   │   ├── forms.css
   │   ├── scanline.css
   │   └── responsive.css
   ├── js/
   │   ├── data.js
   │   ├── renderer.js
   │   ├── i18n.js
   │   ├── sanitizer.js
   │   ├── clock.js
   │   ├── nav.js
   │   ├── contact.js
   │   └── main.js
   ├── fonts/
   │   ├── JetBrainsMono-Regular.woff2
   │   ├── JetBrainsMono-Bold.woff2
   │   ├── SpaceGrotesk-Regular.woff2
   │   ├── SpaceGrotesk-SemiBold.woff2
   │   └── SpaceGrotesk-Bold.woff2
   └── .htaccess
   ```

2. **Im Hostinger File Manager**
   - Navigiere zu `public_html/`
   - Lade alle Dateien hoch (Ordnerstruktur beibehalten)
   - `index.html` muss direkt in `public_html/` liegen

3. **Nach dem Upload prüfen**
   - Seite im Browser öffnen
   - DevTools öffnen → Console: keine Errors?
   - DevTools → Network: keine 404s?
   - DevTools → Application → Security: CSP aktiv?

### Pre-Deployment Checkliste

- [ ] `npm run check` lokal bestanden (Lint + Tests)
- [ ] Alle `{{PLACEHOLDER}}` durch echte Daten ersetzt
- [ ] Keine `console.log` im Code
- [ ] Formspree/Web3Forms Form-ID eingetragen
- [ ] E-Mail, LinkedIn, GitHub URLs korrekt
- [ ] `.htaccess` enthält Security Headers

## .htaccess für Security Headers

```apache
# ============================================
# Security Headers — SOC Portfolio
# ============================================

# Prevent MIME type sniffing
Header always set X-Content-Type-Options "nosniff"

# Clickjacking protection (backup for CSP frame-ancestors)
Header always set X-Frame-Options "DENY"

# Control referrer information
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Disable unnecessary browser features
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()"

# Disable legacy XSS filter (CSP is the modern protection)
Header always set X-XSS-Protection "0"

# Strict Transport Security (only if HTTPS is enabled)
# Uncomment after confirming HTTPS works:
# Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"

# ============================================
# Caching
# ============================================

# Fonts: long cache (they rarely change)
<FilesMatch "\.(woff2)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# CSS/JS: moderate cache with revalidation
<FilesMatch "\.(css|js)$">
  Header set Cache-Control "public, max-age=86400, must-revalidate"
</FilesMatch>

# HTML: no cache (always fresh)
<FilesMatch "\.(html)$">
  Header set Cache-Control "no-cache, must-revalidate"
</FilesMatch>

# ============================================
# Error Handling
# ============================================

# Custom 404 (optional — later add a styled 404 page)
# ErrorDocument 404 /404.html

# ============================================
# Compression (if mod_deflate available)
# ============================================

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

### Hostinger-spezifische Hinweise

- **Apache Module**: Hostinger nutzt Apache. `mod_headers` und `mod_deflate` sind normalerweise verfügbar. Falls ein Header nicht greift, prüfe ob `mod_headers` aktiv ist.
- **HTTPS**: Hostinger bietet kostenloses SSL. Aktiviere es im Dashboard unter "SSL/TLS". Nach Aktivierung den HSTS-Header einkommentieren.
- **PHP**: Wird nicht benötigt. Falls PHP-Version-Auswahl erscheint — ignorieren.

## Post-Deployment Security Check

Nach dem ersten Deployment diese Online-Tools nutzen:

1. **Security Headers**: https://securityheaders.com
   - Deine URL eingeben
   - Ziel: mindestens Note "A"
   - Überprüft ob alle Headers korrekt gesetzt sind

2. **Mozilla Observatory**: https://observatory.mozilla.org
   - Umfassenderer Scan
   - Prüft CSP, HSTS, Cookies, Redirects etc.

3. **CSP Evaluator**: https://csp-evaluator.withgoogle.com
   - Deine CSP eingeben
   - Zeigt Schwächen in der Policy

4. **PageSpeed Insights**: https://pagespeed.web.dev
   - Performance-Check
   - Zeigt auch Security-relevante Empfehlungen

## Spätere Option: Git-basiertes Deployment

Hostinger unterstützt Git-Deployment. Setup-Überblick für die Zukunft:

1. **Git-Repository auf GitHub erstellen**
   - Private Repo (bis du bereit bist es öffentlich zu machen)
   - `.gitignore` für `node_modules/`, Coverage-Reports etc.

2. **Hostinger Git-Integration**
   - Im Hostinger Dashboard: "Git" oder "Git Deployment"
   - Repository URL verbinden
   - Branch wählen (z.B. `main`)
   - Auto-Deploy aktivieren: Push auf `main` → Website aktualisiert sich

3. **Workflow mit Git-Deployment**
   ```
   Lokale Änderung → npm run check → git commit → git push → Auto-Deploy
   ```

4. **Vorteil**: Kein manuelles Hochladen mehr, Versionierung inklusive, Rollback möglich.

**Hinweis**: Bei Git-Deployment musst du die `.gitignore` so konfigurieren, dass nur Production-Dateien deployed werden (oder einen separaten `deploy` Branch nutzen).

## Update-Workflow (manuell)

Für Updates an der Live-Seite:

1. Änderungen lokal vornehmen
2. `npm run check` ausführen
3. Bestätigen dass alles grün ist
4. Geänderte Dateien im Hostinger File Manager hochladen (überschreiben)
5. Browser-Cache leeren und Seite prüfen

**Tipp**: Versionierung in `DATA.meta.version` erhöhen bei jedem Update. Das hilft beim Debuggen falls eine alte Cache-Version angezeigt wird.
