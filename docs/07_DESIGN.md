# DESIGN.md — SOC Dashboard Portfolio: Visual Design Specification

## Anweisung an Claude Code

Dies ist die verbindliche visuelle Design-Spezifikation. Jede visuelle Entscheidung ist hier dokumentiert. Weiche NICHT ab, es sei denn der Nutzer bittet explizit darum.

**Zwei nicht-verhandelbare Anforderungen:**
1. **Responsive Design** — Die Seite muss auf allen Bildschirmgrößen ästhetisch aussehen (Smartphone, Tablet, Laptop, großer Monitor, Ultrawide). Nutze CSS Grid mit `auto-fit`/`minmax()`, nicht feste Breakpoints mit starren Spaltenzahlen.
2. **Erweiterbarkeit** — Kacheln und Inhalte müssen einfach hinzugefügt, entfernt und bearbeitet werden können, OHNE CSS oder Layout-Code anzufassen. Alle Inhalte kommen aus dem `DATA`-Objekt, alle Kacheln werden dynamisch aus einer Config-Struktur gerendert.

---

## 1. Design-Philosophie

Die Seite sieht aus wie eine **echte Security Operations Center Software** — nicht wie ein Portfolio das Security-Ästhetik als Dekoration benutzt. Jedes Element hat eine Funktion, jede Information ist präzise dargestellt.

**Referenz-Tools** (so soll es sich anfühlen):
- **Splunk Mission Control** — Informationsdichte, KPI-Panels, Event-Logs
- **Dynatrace** — Status-Indikatoren, Dashboard-Grid
- **Snyk** — Security-Badge-Ästhetik, Severity-Darstellung
- **Endor Labs** — Minimale Borders, präzise Typografie

**Ton & Wirkung:** Der Besucher soll denken *"Das hat jemand gebaut der weiß wie echte Security-Software aussieht."*

---

## 2. Design-Tokens (CSS Custom Properties)

Alle visuellen Werte werden als CSS Custom Properties in `css/variables.css` definiert. KEINE hartcodierten Farben oder Fontgrößen irgendwo sonst im Code.

```css
:root {
  /* === BACKGROUNDS === */
  --bg-primary: #070b12;      /* Body background — fast schwarz */
  --bg-secondary: #0d1320;    /* Kachel-Hintergrund */
  --bg-tertiary: #111827;     /* Nested elements, form inputs */
  --bg-hover: #0f1628;        /* Kachel beim Hover */

  /* === BORDERS === */
  --border-default: #1e293b;
  --border-hover: #00d4ff35;

  /* === TEXT === */
  --text-primary: #e2e8f0;    /* Hauptfarbe für Titel, Namen */
  --text-secondary: #94a3b8;  /* Body, Labels */
  --text-muted: #64748b;      /* Hints, Meta-Infos */
  --text-faint: #475569;      /* Section-Labels, kleinste Texte */

  /* === ACCENT (Brand) === */
  --accent: #00d4ff;          /* Cyan — Primärfarbe der Marke */
  --accent-dim: #00d4ff35;    /* Hover-States */
  --accent-soft: #00d4ff12;   /* Backgrounds von Badges */

  /* === SEVERITY (für Events, Threats) === */
  --sev-critical: #ef4444;    /* Rot */
  --sev-high: #f97316;        /* Orange */
  --sev-medium: #eab308;      /* Gelb */
  --sev-low: #22c55e;         /* Grün */
  --sev-info: #3b82f6;        /* Blau */

  /* === STATUS (für Cases, Items) === */
  --status-open: #f97316;     /* Orange */
  --status-progress: #eab308; /* Gelb */
  --status-closed: #22c55e;   /* Grün */

  /* === TILE ACCENT STRIPES (links an jeder Kachel) === */
  --tile-accent-profile: #00d4ff;
  --tile-accent-cv: #a78bfa;
  --tile-accent-skills: #3b82f6;
  --tile-accent-projects: #f97316;
  --tile-accent-certs: #ec4899;
  --tile-accent-contact: #22c55e;
  --tile-accent-topology: #06b6d4;
  --tile-accent-ctf: #ef4444;
  --tile-accent-uptime: #22c55e;
  --tile-accent-radar: #a78bfa;

  /* === TYPOGRAPHY === */
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  --font-sans: 'Space Grotesk', sans-serif;

  --fs-xs: 9px;    /* Labels, Hints */
  --fs-sm: 10px;   /* Meta-Infos, Timestamps */
  --fs-base: 11px; /* Body, Events, Listen-Einträge */
  --fs-md: 12px;   /* Project-Titel */
  --fs-lg: 14px;   /* Expanded-View Titel */
  --fs-xl: 15px;   /* System-Bar Werte */
  --fs-2xl: 20px;  /* Name, Hauptüberschriften */

  /* === SPACING === */
  --gap-grid: 10px;       /* Abstand zwischen Kacheln */
  --gap-section: 12px;    /* Abstand zwischen Sections */
  --padding-tile: 16px;   /* Innenabstand Kachel */
  --padding-expanded: 20px; /* Innenabstand Expanded View */

  /* === EFFECTS === */
  --scanline-opacity: 0.012;
  --transition-fast: 0.2s ease;

  /* === LAYOUT === */
  --max-width: 1280px;          /* Max-Breite Desktop */
  --tile-min-width: 240px;      /* Minimum-Breite einer Kachel */
  --tile-min-height: 160px;     /* Minimum-Höhe einer Kachel */
}
```

---

## 3. Responsive Layout — Das Kern-Prinzip

**Das Grid-System nutzt `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))` statt fester Spaltenzahlen.** Das ist der Schlüssel zu echter Responsiveness ohne Media-Query-Chaos.

### 3.1 Basis-Grid

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--tile-min-width), 1fr));
  grid-auto-rows: minmax(var(--tile-min-height), auto);
  gap: var(--gap-grid);
}
```

**Wie das funktioniert:**
- Jede Kachel wird mindestens 240px breit sein
- Das Grid packt so viele Kacheln in eine Reihe wie passen
- Auf einem 27" Monitor: 5 Kacheln pro Reihe
- Auf einem Laptop: 3-4 Kacheln pro Reihe
- Auf einem Tablet: 2 Kacheln pro Reihe
- Auf einem Smartphone: 1 Kachel pro Reihe
- Keine Media Queries nötig — das Grid entscheidet selbst

### 3.2 Kachel-Größen (Spans)

Kacheln können über mehrere Grid-Zellen gehen:

```css
.tile-span-1 { grid-column: span 1; }
.tile-span-2 { grid-column: span 2; }
.tile-span-3 { grid-column: span 3; }
```

**Wichtig:** Auf kleinen Bildschirmen sollen `span-2` und `span-3` Kacheln automatisch auf `span 1` zurückfallen damit sie nicht unleserlich werden:

```css
@media (max-width: 768px) {
  .tile-span-2, .tile-span-3 {
    grid-column: span 1;
  }
}
```

### 3.3 Zielstruktur auf Desktop (≥1200px)

```
┌─────────────────────┬──────────┬──────────┐
│  ANALYST PROFILE    │ TOPOLOGY │ CTF      │
│       (span 2)      │ (span 1) │ (span 1) │
├─────────────────────┴──┬───────┴──────────┤
│       PROJECTS         │   CERTIFICATIONS │
│       (span 3)         │     (span 1)     │
├──────────────────────┬─┴──────────────────┤
│   SKILLS MATRIX      │   CAREER TIMELINE  │
│     (span 2)         │     (span 2)       │
├──────────┬───────────┴────────────────────┤
│ MONITOR  │   THREAT RADAR    SECURE CH.   │
│ (span 1) │    (span 1)       (span 2)     │
└──────────┴────────────────────────────────┘
```

Auf Tablet (600-1000px): Das Grid reflow't automatisch auf 2 Spalten pro Reihe.

Auf Smartphone (<600px): Eine Kachel pro Reihe, volle Breite.

### 3.4 Topbar responsive

```css
.topbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 600px) {
  .topbar-title { font-size: 12px; }
  .topbar-right .clock { display: none; } /* Uhr verstecken auf Handy */
}
```

### 3.5 System-Bar responsive

```css
.sys-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}
```

Auf sehr schmalen Screens werden die 4 Status-Items automatisch zu 2x2 oder 4x1 umgebrochen.

---

## 4. Erweiterbarkeit — Der TILES-Konfigurations-Ansatz

**Dies ist der kritischste Teil für einfache Erweiterbarkeit.** Alle Kacheln werden aus einer Konfigurations-Struktur dynamisch gerendert.

### 4.1 Konfigurationsstruktur in `js/tiles-config.js`

```javascript
export const TILES_CONFIG = [
  {
    id: 'profile',
    labelKey: 'analystProfile',     // Verweist auf DATA[lang].ui.tiles.analystProfile
    dataKey: 'profile',             // Verweist auf DATA[lang].profile
    accent: 'var(--tile-accent-profile)',
    badge: { textKey: 'statusActive', color: 'var(--accent)' },
    span: 2,
    renderer: 'renderProfileTile',  // Funktion in renderer.js
    expandable: true,
    expandRenderer: 'renderProfileExpanded'
  },
  {
    id: 'topology',
    labelKey: 'networkTopology',
    dataKey: 'topology',
    accent: 'var(--tile-accent-topology)',
    badge: null,
    span: 1,
    renderer: 'renderTopologyTile',
    expandable: true,
    expandRenderer: 'renderTopologyExpanded'
  },
  {
    id: 'ctf',
    labelKey: 'ctfScoreboard',
    dataKey: 'ctf',
    accent: 'var(--tile-accent-ctf)',
    badge: { textKey: 'eventCount', color: 'var(--sev-critical)' },
    span: 1,
    renderer: 'renderCtfTile',
    expandable: true,
    expandRenderer: 'renderCtfExpanded'
  },
  {
    id: 'projects',
    labelKey: 'projects',
    dataKey: 'projects',
    accent: 'var(--tile-accent-projects)',
    badge: { textKey: 'entryCount', color: 'var(--sev-high)' },
    span: 3,
    renderer: 'renderProjectsTile',
    expandable: true,
    expandRenderer: 'renderProjectsExpanded',
    drillDown: true    // Projekte haben Level-3 Drill-Down
  },
  {
    id: 'certs',
    labelKey: 'certifications',
    dataKey: 'certs',
    accent: 'var(--tile-accent-certs)',
    badge: { textKey: 'certCount', color: '#ec4899' },
    span: 1,
    renderer: 'renderCertsTile',
    expandable: true,
    expandRenderer: 'renderCertsExpanded'
  },
  {
    id: 'skills',
    labelKey: 'skillsMatrix',
    dataKey: 'skills',
    accent: 'var(--tile-accent-skills)',
    badge: { textKey: 'toolCount', color: 'var(--sev-info)' },
    span: 2,
    renderer: 'renderSkillsTile',
    expandable: true,
    expandRenderer: 'renderSkillsExpanded'
  },
  {
    id: 'cv',
    labelKey: 'careerTimeline',
    dataKey: 'cv',
    accent: 'var(--tile-accent-cv)',
    badge: { textKey: 'entryCount', color: 'var(--tile-accent-cv)' },
    span: 2,
    renderer: 'renderCvTile',
    expandable: true,
    expandRenderer: 'renderCvExpanded'
  },
  {
    id: 'uptime',
    labelKey: 'systemMonitor',
    dataKey: 'uptime',
    accent: 'var(--tile-accent-uptime)',
    badge: { textKey: 'uptimePercent', color: 'var(--status-closed)' },
    span: 1,
    renderer: 'renderUptimeTile',
    expandable: true,
    expandRenderer: 'renderUptimeExpanded'
  },
  {
    id: 'radar',
    labelKey: 'threatRadar',
    dataKey: 'radar',
    accent: 'var(--tile-accent-radar)',
    badge: null,
    span: 1,
    renderer: 'renderRadarTile',
    expandable: true,
    expandRenderer: 'renderRadarExpanded'
  },
  {
    id: 'contact',
    labelKey: 'secureChannel',
    dataKey: 'contact',
    accent: 'var(--tile-accent-contact)',
    badge: { textKey: 'encrypted', color: 'var(--status-closed)' },
    span: 2,
    renderer: 'renderContactTile',
    expandable: false,              // Formular direkt sichtbar, kein Drill-Down
    clickable: false                // Kachel selbst nicht klickbar
  }
];
```

### 4.2 Was das bedeutet

**Eine neue Kachel hinzufügen:**
1. Neuen Eintrag in `TILES_CONFIG` Array
2. Render-Funktion in `renderer.js` implementieren
3. Daten in `DATA` ergänzen
4. UI-Strings für DE/EN in `DATA.de.ui.tiles` und `DATA.en.ui.tiles`
5. Fertig — Grid platziert die Kachel automatisch

**Eine Kachel entfernen:**
1. Eintrag aus `TILES_CONFIG` löschen (oder auskommentieren)
2. Grid flowt automatisch neu

**Eine Kachel umordnen:**
1. Reihenfolge im `TILES_CONFIG` Array ändern
2. Grid rendert in der neuen Reihenfolge

**Eine Kachel größer/kleiner machen:**
1. `span` Wert im Config anpassen (1, 2 oder 3)

**Inhalt einer Kachel ändern:**
1. Nur das `DATA`-Objekt anfassen
2. Kein CSS, kein HTML, kein Render-Code

---

## 5. Die 10 Kacheln im Detail

### 5.1 Analyst Profile (span 2)
**Zweck:** Wer bin ich, was suche ich, Spezialgebiete.

**Kompakt-View:**
- Name (groß, Space Grotesk)
- Subtitle: "Cybersecurity Student // Stuttgart Area"
- Tag-Wolke mit 4-5 Spezialgebieten

**Expanded-View (2-Spalter):**
- Links: Identification + Mission Brief (Bio)
- Rechts: Specializations, Education, Languages

### 5.2 Network Topology (span 1)
**Zweck:** Grafisches Element — zeigt Tool-Verbindungen als Netzwerkgraph.

**Kompakt-View:**
- Kleiner SVG-Graph, zentraler "CORE"-Knoten, 6-8 umliegende Knoten
- Linien zwischen Knoten zeigen Skill-Kategorien
- Keine Daten nötig im MVP — statisches SVG

**Expanded-View:**
- Größerer Graph mit 10-15 Knoten
- Legende mit Farbcodes (Expert/Advanced/Offensive/Monitoring/OSINT)

### 5.3 CTF Scoreboard (span 1)
**Zweck:** Rangliste von CTF-Teilnahmen.

**Kompakt-View:**
- 3 Zeilen mit: Rang / Event-Name / Punkte
- Rang in Gold (#eab308), Punkte in Cyan

**Expanded-View:**
- Alle CTFs aufgelistet mit Platform-Badge
- Stats am Ende: Total Events, Best Placement, Total Points

### 5.4 Projects (span 3)
**Zweck:** Hauptkachel für Projekte — chronologischer Event-Feed + Status.

**Kompakt-View:**
- 4 Zeilen: Severity-Dot / Datum / Titel / Status-Pill
- Severity als leuchtender Dot (kritisch = rot glühend, high = orange glühend)

**Expanded-View:**
- Alle Projekte als größere Cards
- Jede Card ist klickbar → **Drill-Down zu Level 3** (Projekt-Detail)

**Drill-Down Level 3:**
- Projekt-Details: Description, Objectives, Tech Stack, Status, Repository-Link
- "BACK TO PROJECTS" Button

### 5.5 Certifications (span 1)
**Zweck:** Zertifikate auflisten.

**Kompakt-View:**
- 2-3 Zertifikate mit farbigem Kürzel-Badge (C+, ISO, THM)
- Name + Ausstellerorganisation

**Expanded-View:**
- Vollständige Liste mit Jahreszahl
- Beschreibung der Zertifizierung

### 5.6 Skills Matrix (span 2)
**Zweck:** Tools und Technologien nach Proficiency-Level.

**Kompakt-View:**
- Tag-Wolke mit 8-10 farbcodierten Badges
- Expert=Cyan, Advanced=Grün, Intermediate=Gelb
- "+X more" Indikator

**Expanded-View:**
- 3x2 Grid gruppiert nach Kategorie (Network Analysis, Offensive Security, SIEM, Programming, Infrastructure, OSINT)
- Jede Kategorie hat ihre Tools als vertikale Liste
- Legende mit Farbcodes

### 5.7 Career Timeline (span 2)
**Zweck:** Lebenslauf-Stationen chronologisch.

**Kompakt-View:**
- 2-3 Timeline-Einträge
- Aktueller Eintrag: leuchtender Dot (Purple)
- Vergangene Einträge: matter grauer Dot
- Datum / Titel / Sub-Info

**Expanded-View:**
- Alle Timeline-Einträge
- Längere Beschreibungen pro Station
- Studium, Praktika, Selbst-Study, Abitur

### 5.8 System Monitor (span 1)
**Zweck:** Dekorative "Uptime-Monitor" Kachel die immer gut aussieht.

**Kompakt-View:**
- 14 farbige Balken nebeneinander (Daily-Uptime der letzten 14 Tage)
- Grün=up, Gelb=partial, Rot=down
- Response Time: "47ms"
- Last Deploy: "3d ago"

**Expanded-View:**
- 30-Tage-Balken-Grafik
- 4 KPI-Kacheln: Uptime 99.7%, Response 47ms, Last Deploy 3d, Incidents 1

### 5.9 Threat Radar (span 1) — NEU
**Zweck:** Fülle die Grid-Lücke mit einer weiteren grafischen Kachel. Radar-Chart mit Skill-Kategorien.

**Kompakt-View:**
- SVG-Radar-Chart (Spinnennetz mit 5-6 Achsen)
- Achsen: Network, Offensive, Defensive, OSINT, DevOps, Analysis
- Gefüllte Fläche zeigt Skill-Abdeckung
- Farbe: Purple (--tile-accent-radar)

**Expanded-View:**
- Größerer Radar-Chart
- Werte-Tabelle daneben mit Kategorie + Score (z.B. 1-10)
- Dekorativ — Werte sind "calibrated" nicht gemessen

**Inhalt (kann später gefüllt werden):**
```javascript
radar: {
  axes: [
    { label: 'NETWORK', value: 8 },
    { label: 'OFFENSIVE', value: 6 },
    { label: 'DEFENSIVE', value: 7 },
    { label: 'OSINT', value: 9 },
    { label: 'DEVOPS', value: 5 },
    { label: 'ANALYSIS', value: 8 }
  ]
}
```

### 5.10 Secure Channel / Contact (span 2)
**Zweck:** Kontaktinformationen + Direkt-Formular. Kein Klick/Expand nötig.

**Layout (immer sichtbar, 2 Spalten):**
- Links: Direct Channels (E-Mail, LinkedIn, GitHub) mit Icons
- Rechts: Transmit Message Form
  - Name + Email nebeneinander
  - Subject einzeilig
  - Message-Textarea (2 Zeilen)
  - "▶ TRANSMIT MESSAGE" Button in Grün

**Wichtig:**
- Kachel-Hover-Effekt DEAKTIVIERT (`cursor: default`)
- Inputs haben grüne Border (statt cyan wie andere Akzente)
- Kein Klick auf die Kachel tut etwas
- `event.stopPropagation()` auf alle Input-Elemente

---

## 6. Visuelle Komponenten im Detail

### 6.1 Topbar

```
┌───────────────────────────────────────────────────────────────┐
│ SOC // PORTFOLIO  [SEEKING PLACEMENT]    ● 2026-04-15 // ...  │
└───────────────────────────────────────────────────────────────┘
```

- Höhe: ~48px
- Unten: 1px Border (--border-default)
- Links: Titel (Cyan, bold, 3px letter-spacing) + Status-Pill (Cyan-Outline)
- Rechts: Live-Uhr (monospace, --text-faint) + Sprache-Toggle (DE | EN)

### 6.2 System Status Bar

4 Status-Items nebeneinander, jedes mit:
- Farbiger Dot links (grün/cyan/amber mit box-shadow glow)
- Label darüber (kleinst, --text-faint, letter-spaced)
- Value darunter (15px, bold, --text-primary)

Beispiele:
- STATUS: ONLINE (grün)
- CLEARANCE: B.SC. Y3 (cyan)
- AVAILABILITY: IMMEDIATE (grün)
- SECTOR: STUTTGART (amber)

### 6.3 Tile Basis-Struktur

```html
<div class="tile tile-{id}" data-span="{1|2|3}">
  <div class="tile-header">
    <span class="tile-label">{LABEL}</span>
    <span class="tile-badge">{STATUS}</span>
  </div>
  <div class="tile-body">
    <!-- kachel-spezifischer Inhalt -->
  </div>
  <div class="tile-hint">▶ EXPAND</div>
</div>
```

**Styling:**
- Background: --bg-secondary
- Border: 1px --border-default
- Padding: --padding-tile
- Links: 3px vertikaler Accent-Stripe (tile-spezifische Farbe)
- Hover: Border wechselt zu --border-hover, Background zu --bg-hover
- `.tile-hint` erscheint erst beim Hover (color: transparent → --text-faint)

### 6.4 Severity-Dots

```css
.sev-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sev-critical { background: var(--sev-critical); box-shadow: 0 0 5px #ef444450; }
.sev-high { background: var(--sev-high); box-shadow: 0 0 5px #f9731650; }
.sev-medium { background: var(--sev-medium); } /* kein Glow */
.sev-low { background: var(--sev-low); }
.sev-info { background: var(--sev-info); }
```

Critical und High bekommen einen Glow-Effekt — die müssen auffallen.

### 6.5 Status-Pills

```css
.status-pill {
  font-size: var(--fs-xs);
  padding: 2px 8px;
  border: 1px solid;
}
.status-open      { background: #f9731618; color: var(--status-open); border-color: #f9731635; }
.status-progress  { background: #eab30818; color: var(--status-progress); border-color: #eab30835; }
.status-closed    { background: #22c55e18; color: var(--status-closed); border-color: #22c55e35; }
```

Prinzip: Farbe mit ~10% Opacity als Background, 20% Opacity für Border, volle Farbe für Text.

### 6.6 Badges (Skills)

```css
.badge {
  font-size: var(--fs-xs);
  padding: 3px 8px;
  display: inline-block;
}
.badge-expert       { background: #00d4ff12; border: 1px solid #00d4ff35; color: var(--accent); }
.badge-advanced     { background: #22c55e12; border: 1px solid #22c55e35; color: var(--sev-low); }
.badge-intermediate { background: #eab30812; border: 1px solid #eab30835; color: var(--sev-medium); }
```

### 6.7 Scanline-Overlay

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 212, 255, var(--scanline-opacity)) 3px,
    rgba(0, 212, 255, var(--scanline-opacity)) 6px
  );
  pointer-events: none;
  z-index: 999;
}
```

Ganz subtil — der Effekt soll spürbar aber nicht störend sein.

### 6.8 Typography-Regeln

| Element | Font | Größe | Gewicht | Farbe |
|---------|------|-------|---------|-------|
| Name, Namen | Space Grotesk | --fs-2xl | 700 | --text-primary |
| Tile-Labels | JetBrains Mono | --fs-sm | 400 | --text-faint, letter-spaced |
| Event-Titel | JetBrains Mono | --fs-base | 400 | --text-primary |
| Sub-Infos | JetBrains Mono | --fs-sm | 400 | --text-muted |
| Timestamps | JetBrains Mono | --fs-sm | 400 | --text-faint |
| Body-Text | JetBrains Mono | --fs-base | 400, line-height 1.7 | --text-secondary |

**Alle Labels sind UPPERCASE und haben `letter-spacing: 1-2px`.** Das ist ein Schlüsselelement der SOC-Ästhetik.

---

## 7. Drill-Down Interaktion

### 7.1 Drei Ebenen

```
Level 1: Dashboard-Grid (alle Kacheln)
  ↓ (Klick auf Kachel)
Level 2: Expanded Panel (volle Details einer Kachel)
  ↓ (Klick auf Projekt in Projects-Panel)
Level 3: Projekt-Detail
```

### 7.2 Expanded Panel Header

```html
<div class="exp-header">
  <button class="exp-back">◀ BACK</button>
  <span class="exp-title">THREAT INTEL FEED</span>
  <span class="exp-breadcrumb">SOC // PORTFOLIO / PROJECTS</span>
</div>
```

- Back-Button: Cyan, subtle Border, hover intensiviert
- Breadcrumb: rechts, klein, grau — zeigt Navigations-Pfad
- Title: mittig, bold, letter-spaced

### 7.3 Animation

Subtiler Fade-In beim Expand (200ms):
```css
.expanded { animation: fadeIn 0.2s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 7.4 JavaScript-Logik

```javascript
function expand(tileId) {
  document.getElementById('mainGrid').classList.add('hidden');
  document.querySelectorAll('.expanded').forEach(el => el.classList.remove('active'));
  document.getElementById(`exp-${tileId}`).classList.add('active');
  history.pushState({ view: tileId }, '', `#${tileId}`);
}

function collapse() {
  document.querySelectorAll('.expanded').forEach(el => el.classList.remove('active'));
  document.getElementById('mainGrid').classList.remove('hidden');
  history.pushState({ view: 'grid' }, '', '#');
}

// Browser-Back-Button Support
window.addEventListener('popstate', (e) => {
  if (e.state?.view === 'grid' || !e.state) collapse();
  else expand(e.state.view);
});
```

---

## 8. Accessibility

- Alle Kacheln sind per Tastatur navigierbar (`tabindex="0"`)
- Kacheln haben `role="button"` wenn klickbar
- Expand/Collapse wird per Enter/Space ausgelöst
- Focus-Styles mit sichtbarem Ring: `outline: 2px solid var(--accent-dim); outline-offset: 2px`
- Alle Icons haben `aria-label`
- Kontrast-Ratio: Alle Text-auf-Background Kombinationen bestehen WCAG AA
- Scanline-Overlay hat `pointer-events: none` (keine Interaktion blockiert)

---

## 9. Implementierungs-Reihenfolge für Claude Code

1. **CSS Custom Properties** in `variables.css` anlegen — ALLE Werte aus Abschnitt 2
2. **Basis-Layout** in `layout.css`: Topbar, System-Bar, Grid mit `auto-fit/minmax`
3. **Tile-Komponente** in `components.css`: Base-Styling, Hover, Accent-Stripe
4. **TILES_CONFIG** in `tiles-config.js` anlegen mit allen 10 Kacheln
5. **Render-Engine** in `renderer.js` — pro Kachel eine `render{Id}Tile()` und `render{Id}Expanded()`
6. **Main Entry** in `main.js`: TILES_CONFIG iterieren, jede Kachel erzeugen
7. **Drill-Down-Logik** in `navigation.js`: expand/collapse/back
8. **Responsive testen** auf: 375px (iPhone), 768px (Tablet), 1280px (Laptop), 1920px (Monitor), 2560px (4K)

---

## 10. Anti-Patterns — Was NICHT zu tun ist

- ❌ Keine festen Pixel-Breiten für Kacheln (nur `minmax` in Grid)
- ❌ Keine hartcodierten Farben — immer CSS Custom Properties
- ❌ Keine HTML-Struktur für neue Kacheln ändern — nur TILES_CONFIG
- ❌ Keine `innerHTML` mit dynamischen Daten (siehe SECURITY.md)
- ❌ Keine Inline-Styles für visuelle Entscheidungen (nur für Grid-Spans via `data-span` Attribut)
- ❌ Keine Sidebar (explizit entfernt im neuen Design)
- ❌ Keine runden Ecken auf Kacheln — alles eckig
- ❌ Keine Schatten, keine Gradienten (außer dem Severity-Glow)
- ❌ Keine Emojis in der UI — nur ASCII-Pfeile (▶ ◀) und Unicode-Dots (●)
- ❌ Keine eingerichteten Breakpoints in jeder Komponente — das Grid macht das automatisch

---

## 11. Testing — Visuelle Checkliste

Nach Implementierung durch Claude Code manuell prüfen:

- [ ] Auf 1280px Breite: Kachel-Layout wie in Abschnitt 3.3 beschrieben
- [ ] Auf 768px (Tablet): Kacheln arrangieren sich auf 2 pro Reihe
- [ ] Auf 375px (iPhone): Eine Kachel pro Reihe, Topbar kompakt
- [ ] Auf 2560px (4K): Max-Width greift, Inhalt zentriert
- [ ] Hover auf Kachel: Border wird cyan, Background wechselt, Hint erscheint
- [ ] Klick auf Kachel: Grid verschwindet, Expanded-Panel erscheint mit Animation
- [ ] Back-Button kehrt zum Grid zurück
- [ ] Projekte-Kachel → Klick auf Projekt → Level-3 Drill-Down funktioniert
- [ ] Kontaktformular: Eingabe in Felder funktioniert ohne Kachel zu expandieren
- [ ] Sprachwechsel: alle Texte wechseln ohne Layout-Sprünge
- [ ] Live-Uhr: läuft und aktualisiert sich jede Sekunde
- [ ] Scanline-Overlay: sichtbar aber subtil, blockiert keine Clicks
- [ ] Tab-Navigation: alle Kacheln per Tastatur erreichbar

---

## 12. Zukünftige Erweiterungen (vorbereitet, aber nicht implementiert)

- **Blog-Kachel** (Phase 2): Neuer Eintrag in TILES_CONFIG mit `id: 'posts'`, `span: 3`, verlinkt auf `blog/`-Ordner
- **Darkmode/Lightmode Toggle**: CSS Custom Properties einfach austauschbar via `[data-theme="light"]` Selector
- **Live-Daten-Feeds**: Kacheln können `fetchInterval` im Config haben für periodische Updates (z.B. GitHub-Commits live)
- **Kachel-Reihenfolge per Drag-and-Drop**: TILES_CONFIG lässt sich aus localStorage laden
- **Custom Themes**: Alternative Farbsets (z.B. Green-Terminal, Purple-Hacker) als zusätzliche CSS-Dateien

Alle diese Erweiterungen sind durch die Config-basierte Architektur möglich ohne die bestehenden Kacheln anzufassen.
