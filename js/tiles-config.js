/**
 * tiles-config.js — Configuration array for the 10 dashboard tiles.
 *
 * This is the single source of truth for the grid layout.
 * To add a tile: add an entry here, add a renderer in renderer.js,
 * add data in data.js, add UI strings in data.js ui.tiles.
 * No CSS or HTML changes needed.
 *
 * Fields:
 *   id             — unique identifier; used as DOM id="tile-{id}"
 *   labelKey       — key in DATA[lang].ui.tiles for the header label
 *   dataKey        — key in DATA[lang] for the tile's content data
 *   accent         — CSS custom property for the 3px left stripe
 *   badge          — header badge { textKey, color } or null
 *   span           — grid column span: 1 | 2 | 3
 *   renderer       — compact tile renderer function name
 *   expandable     — true: tile click opens expanded panel
 *   expandRenderer — expanded view renderer function name (if expandable)
 *   drillDown      — true: expanded view has level-3 project drill-down
 *   clickable      — false: tile click does nothing (contact tile only)
 *
 * Grid layout (desktop, 3 columns × 5 rows — 15 cells total):
 *
 *   Row 1: profile  (col 1–2)  │ topology (col 3)         [wide LEFT]
 *   Row 2: ctf      (col 1)    │ cv       (col 2–3)        [wide RIGHT]
 *   Row 3: projects (col 1–2)  │ certs    (col 3)          [wide LEFT]
 *   Row 4: uptime   (col 1)    │ skills   (col 2–3)        [wide RIGHT]
 *   Row 5: contact  (col 1–2)  │ radar    (col 3)          [wide LEFT]
 *
 * Alternation rule: span-2 tiles switch sides every row (left/right/left/right/left).
 * Achieved purely via array order — no explicit grid-column placement needed.
 * A [span-1, span-2] pair in the array → auto-placement puts span-1 at col 1,
 * then span-2 fills the remaining cols 2–3.
 */

export const TILES_CONFIG = Object.freeze([

  // ── Row 1: wide LEFT ────────────────────────────────────────────
  Object.freeze({
    id: 'profile',
    labelKey: 'analystProfile',
    dataKey: 'profile',
    accent: 'var(--tile-accent-profile)',
    badge: Object.freeze({ textKey: 'statusActive', color: 'var(--accent)' }),
    span: 2,
    renderer: 'renderProfileTile',
    expandable: true,
    expandRenderer: 'renderProfileExpanded'
  }),

  Object.freeze({
    id: 'topology',
    labelKey: 'networkTopology',
    dataKey: 'topology',
    accent: 'var(--tile-accent-topology)',
    badge: Object.freeze({ textKey: 'planned', color: '#eab308' }),
    span: 1,
    renderer: 'renderTopologyTile',
    expandable: true,
    expandRenderer: 'renderTopologyExpanded'
  }),

  // ── Row 2: wide RIGHT ───────────────────────────────────────────
  Object.freeze({
    id: 'threatFeed',
    labelKey: 'threatFeed',
    dataKey: 'threatFeed',
    accent: 'var(--tile-accent-ctf)',
    badge: Object.freeze({ textKey: 'articleCount', color: 'var(--sev-critical)' }),
    span: 1,
    renderer: 'renderThreatFeedTile',
    expandable: true,
    expandRenderer: 'renderThreatFeedExpanded'
  }),

  Object.freeze({
    id: 'cv',
    labelKey: 'careerTimeline',
    dataKey: 'cv',
    accent: 'var(--tile-accent-cv)',
    badge: Object.freeze({ textKey: 'entryCount', color: 'var(--tile-accent-cv)' }),
    span: 2,
    renderer: 'renderCvTile',
    expandable: true,
    expandRenderer: 'renderCvExpanded'
  }),

  // ── Row 3: wide LEFT ────────────────────────────────────────────
  Object.freeze({
    id: 'projects',
    labelKey: 'projects',
    dataKey: 'projects',
    accent: 'var(--tile-accent-projects)',
    badge: Object.freeze({ textKey: 'entryCount', color: 'var(--sev-high)' }),
    span: 2,
    renderer: 'renderProjectsTile',
    expandable: true,
    expandRenderer: 'renderProjectsExpanded',
    drillDown: true
  }),

  Object.freeze({
    id: 'certs',
    labelKey: 'certifications',
    dataKey: 'certs',
    accent: 'var(--tile-accent-certs)',
    badge: Object.freeze({ textKey: 'certCount', color: '#ec4899' }),
    span: 1,
    renderer: 'renderCertsTile',
    expandable: true,
    expandRenderer: 'renderCertsExpanded'
  }),

  // ── Row 4: wide RIGHT ───────────────────────────────────────────
  Object.freeze({
    id: 'uptime',
    labelKey: 'systemMonitor',
    dataKey: 'uptime',
    accent: 'var(--tile-accent-uptime)',
    badge: Object.freeze({ textKey: 'uptimePercent', color: 'var(--status-closed)' }),
    span: 1,
    renderer: 'renderUptimeTile',
    expandable: false
  }),

  Object.freeze({
    id: 'skills',
    labelKey: 'skillsMatrix',
    dataKey: 'skills',
    accent: 'var(--tile-accent-skills)',
    badge: Object.freeze({ textKey: 'toolCount', color: 'var(--sev-info)' }),
    span: 2,
    renderer: 'renderSkillsTile',
    expandable: true,
    expandRenderer: 'renderSkillsExpanded'
  }),

  // ── Row 5: wide LEFT ────────────────────────────────────────────
  Object.freeze({
    id: 'contact',
    labelKey: 'secureChannel',
    dataKey: 'contact',
    accent: 'var(--tile-accent-contact)',
    badge: Object.freeze({ textKey: 'encrypted', color: 'var(--status-closed)' }),
    span: 2,
    renderer: 'renderContactTile',
    expandable: false,
    clickable: false
  }),

  Object.freeze({
    id: 'radar',
    labelKey: 'threatRadar',
    dataKey: 'radar',
    accent: 'var(--tile-accent-radar)',
    badge: null,
    span: 1,
    renderer: 'renderRadarTile',
    expandable: true,
    expandRenderer: 'renderRadarExpanded'
  })

]);
