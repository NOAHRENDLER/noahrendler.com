# PROJECT OVERVIEW — SOC Dashboard Portfolio

## Kontext

Cybersecurity-Student im Raum Stuttgart, aktiv auf der Suche nach einer Bachelorarbeit-Stelle. Diese Portfolio-Website soll sich radikal von generischen Portfolio-Seiten abheben und sofort zeigen, dass der Ersteller in der Security-Welt zuhause ist.

## Ziel

Eine persönliche Portfolio-Website im Stil eines Security Operations Center (SOC) Dashboards. Kein klassisches "Über mich / Projekte / Kontakt"-Layout, sondern ein dunkles, informationsdichtes Interface das aussieht wie ein echtes Security-Tool.

## Design-Philosophie: SOC-Dashboard Aesthetic

### Referenzen
- **Dynatrace** — Informationsdichte, Status-Indikatoren, Dark UI
- **Snyk** — Security-Badge-Ästhetik, Vulnerability-Darstellung
- **Endor Labs** — Minimale Borders, präzise Typografie, Dashboard-Layout

### Ästhetische Regeln
| Eigenschaft | Entscheidung |
|---|---|
| Hintergrund | Fast schwarz: `#070b12` |
| Akzentfarbe | Cyan: `#00d4ff` |
| Primäre Schrift | JetBrains Mono (Code/Terminal-Feeling) |
| Sekundäre Schrift | Space Grotesk (Lesbarkeit für Titel/Namen) |
| Ecken | Keine Rundungen — alles eckig und präzise |
| Schatten | Keine |
| Gradienten | Keine |
| UI-Elemente | Severity-Dots, Status-Pills, Badges wie in SIEM-Tools |
| Overlay | Scanline CSS-Effekt für Terminal-Ästhetik |

### Ton & Wirkung
Die Seite soll wirken wie ein **echtes Security-Tool** — nicht wie ein Portfolio das Security-Ästhetik als Dekoration benutzt. Jedes Element hat eine Funktion, jede Information ist präzise dargestellt. Der Besucher soll denken: "Das hat jemand gebaut, der weiß wie echte Security-Software aussieht."

## Struktur: 5 Sections (Phase 1)

| # | Section | Framing | Inhalt |
|---|---------|---------|--------|
| 1 | **Status Panel** | Analyst-Profil | Wer du bist, wo du suchst, Spezialgebiete als Tags |
| 2 | **Threat Intel Feed** | Event-Log / SIEM | Projekte, CTF-Writeups, Research als chronologische Events mit Severity |
| 3 | **Skills Matrix** | Tabelle, keine Balken | Tools, Kategorie, Proficiency — kein Bootstrap-Balkendiagramm |
| 4 | **Active Cases** | Incident Tracker | Programmierprojekte als offene/geschlossene Incidents mit ID und Status |
| 5 | **Contact** | Secure Channel | E-Mail, LinkedIn, GitHub — schlicht mit Security-Badge |

### Phase 2 (später, nicht in Phase 1 bauen)
- **Blog/Write-ups Section** — `DATA.posts` Array, Einzelseiten in `blog/`-Ordner
- Die Architektur wird so gebaut, dass Phase 2 ohne Umbau ergänzbar ist

## Sprache

Zweisprachig: **Deutsch + Englisch** mit dynamischer Sprachumschaltung.
- Ein einziges HTML-File
- JS tauscht Texte basierend auf gewählter Sprache
- `DATA`-Objekt enthält beide Sprachen (`DATA.de` / `DATA.en`)
- Standardsprache: Deutsch
- Toggle in der Topbar

## Kontakt-Formular

Externer Formular-Service (Formspree oder Web3Forms):
- HTML-Formular mit `action` auf externe API
- Client-seitige Input-Sanitization und Validation
- Honeypot-Feld gegen Spam
- CSRF-Token vom Service
- Kein eigenes Backend nötig

## Deployment

- **Hosting**: Hostinger
- **Methode**: Manuell per File Manager (Phase 1)
- **Spätere Option**: Git-basiertes Auto-Deploy (dokumentiert, aber nicht in Phase 1)

## Kernprinzipien

1. **Security First** — Jede Zeile Code wird unter Security-Gesichtspunkten geschrieben
2. **Testbar** — Alles was logisch ist wird getestet
3. **Data-Driven** — Inhalte im `DATA`-Objekt, Render-Engine generiert UI
4. **Kein Framework** — Reines HTML/CSS/JS, keine Build-Dependencies
5. **Wartbar** — Neues Projekt hinzufügen = ein Objekt in DATA eintragen
