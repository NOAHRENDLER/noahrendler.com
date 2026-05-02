/**
 * renderer.js — Render engine: DATA[lang] → DOM.
 *
 * Security contract (enforced by tests/security/xss-vectors.test.js):
 *   - NEVER use innerHTML / outerHTML / insertAdjacentHTML with any
 *     variable derived from DATA or user input.
 *   - All text from DATA is written via element.textContent — the browser
 *     automatically escapes it; no manual escaping needed here.
 *   - URL fields (link, github, linkedin) are validated to start with
 *     'https://' before being assigned to element.href.
 *   - All render functions are idempotent: they clear their container
 *     before building, so renderAll() can be called repeatedly
 *     (e.g., on language switch) without duplicating elements.
 *   - Containers are passed as parameters — no document.querySelector
 *     inside render functions, which makes them unit-testable.
 */

import { DATA } from './data.js';
import { TILES_CONFIG } from './tiles-config.js';
import { openTopology } from './topology.js';

// ─────────────────────────────────────────────────────────────
// Grid render functions
// ─────────────────────────────────────────────────────────────

export function renderSysBar(container, data) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const validDots = Object.freeze(['green', 'cyan', 'amber']);

  data.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'sys-bar__item';

    const dotEl = document.createElement('span');
    const dot = validDots.includes(item.dot) ? item.dot : 'green';
    dotEl.className = `sys-bar__dot sys-bar__dot--${dot}`;
    dotEl.setAttribute('aria-hidden', 'true');
    itemEl.appendChild(dotEl);

    const infoEl = document.createElement('div');
    infoEl.className = 'sys-bar__info';

    const labelEl = document.createElement('span');
    labelEl.className = 'sys-bar__label';
    labelEl.textContent = item.label;
    infoEl.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = 'sys-bar__value';
    valueEl.textContent = item.value;
    infoEl.appendChild(valueEl);

    itemEl.appendChild(infoEl);
    container.appendChild(itemEl);
  });
}

/**
 * Render the full dashboard grid from TILES_CONFIG.
 *
 * @param {'de' | 'en'} lang
 * @param {object} [dataOverride] - Replaces DATA (for tests).
 */
export function renderGrid(lang, dataOverride) {
  const source = dataOverride ?? DATA;
  const langData = source[lang];

  if (!langData) {
    throw new Error(`renderGrid: unsupported language "${lang}"`);
  }

  _renderTopbar(langData.ui.topbar);

  const sysBar = document.getElementById('sys-bar');
  if (sysBar && langData.ui.sysBar) {
    renderSysBar(sysBar, langData.ui.sysBar);
  }

  const grid = document.getElementById('main-grid');
  if (!grid) return;
  grid.textContent = '';

  TILES_CONFIG.forEach(cfg => {
    const tileEl = _buildTile(cfg, langData);
    _renderTileContent(cfg, tileEl, langData);
    grid.appendChild(tileEl);
  });
}

/**
 * @param {object} cfg  - One entry from TILES_CONFIG
 * @param {object} langData - DATA[lang]
 * @returns {HTMLElement}
 */
function _buildTile(cfg, langData) {
  const tile = document.createElement('div');
  tile.id = `tile-${cfg.id}`;
  tile.className = `tile tile-span-${cfg.span}`;

  if (cfg.clickable === false) {
    tile.classList.add('tile--no-click');
  } else {
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `Expand ${cfg.id}`);
  }

  // ── Header ──────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'tile-header';

  const labelEl = document.createElement('span');
  labelEl.className = 'tile-label';
  // Fallback: labelKey converted to readable text if ui.tiles not yet present
  labelEl.textContent = langData.ui.tiles?.[cfg.labelKey] ?? cfg.labelKey.toUpperCase();
  header.appendChild(labelEl);

  if (cfg.badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'tile-badge';
    badgeEl.textContent = '—';
    badgeEl.style.color = cfg.badge.color;
    header.appendChild(badgeEl);
  }

  tile.appendChild(header);

  const body = document.createElement('div');
  body.className = 'tile-body';
  body.id = `tile-body-${cfg.id}`;
  tile.appendChild(body);

  // ── Expand CTA (expandable tiles only) ─────────────────────
  if (cfg.expandable !== false) {
    const ctaEl = document.createElement('div');
    ctaEl.className = 'tile-expand-cta';
    ctaEl.setAttribute('aria-hidden', 'true');

    const ctaBar1 = document.createElement('span');
    ctaBar1.className = 'tile-expand-bar';
    ctaEl.appendChild(ctaBar1);

    const ctaLabel = document.createElement('span');
    ctaLabel.className = 'tile-expand-label';
    ctaLabel.textContent = '▶ EXPAND';
    ctaEl.appendChild(ctaLabel);

    const ctaBar2 = document.createElement('span');
    ctaBar2.className = 'tile-expand-bar';
    ctaEl.appendChild(ctaBar2);

    tile.appendChild(ctaEl);
  }

  return tile;
}

// ─────────────────────────────────────────────────────────────
// Tile content renderers
// render{Id}Tile(container, data, badge?)
//   container — the .tile-body div
//   data      — DATA[lang][cfg.dataKey]
//   badge     — the .tile-badge span (optional)
// ─────────────────────────────────────────────────────────────

/**
 * Profile tile — name, title // location, specialization tags.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].profile
 * @param {HTMLElement} [badge]
 */
export function renderProfileTile(container, data, badge) {
  if (!container || !data) return;
  container.textContent = '';

  const inner = document.createElement('div');
  inner.className = 'profile-tile-inner';

  // ── Identity ─────────────────────────────────────────────
  const identEl = document.createElement('div');
  identEl.className = 'profile-tile-identity';

  const nameEl = document.createElement('div');
  nameEl.className = 'profile-tile-name';
  nameEl.textContent = data.name;
  identEl.appendChild(nameEl);

  const roleEl = document.createElement('div');
  roleEl.className = 'profile-tile-role';
  roleEl.textContent = data.title;
  identEl.appendChild(roleEl);

  const locationEl = document.createElement('div');
  locationEl.className = 'profile-tile-location';

  const dotEl = document.createElement('span');
  dotEl.className = 'profile-tile-location-dot';
  dotEl.setAttribute('aria-hidden', 'true');
  locationEl.appendChild(dotEl);
  locationEl.appendChild(document.createTextNode(data.location));

  identEl.appendChild(locationEl);
  inner.appendChild(identEl);

  // ── Tags ─────────────────────────────────────────────────
  if (data.specializations && data.specializations.length > 0) {
    const tagsEl = document.createElement('div');
    tagsEl.className = 'profile-tile-tags';
    data.specializations.forEach(spec => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = spec;
      tagsEl.appendChild(tagEl);
    });
    inner.appendChild(tagsEl);
  }

  // ── Short Bio ────────────────────────────────────────────
  if (data.shortBio) {
    const bioEl = document.createElement('div');
    bioEl.className = 'profile-tile-bio';
    bioEl.textContent = data.shortBio;
    inner.appendChild(bioEl);
  }

  // ── Expand CTA ──────────────────────────────────────────
  const ctaEl = document.createElement('div');
  ctaEl.className = 'tile-expand-cta';
  ctaEl.setAttribute('aria-hidden', 'true');

  const bar1 = document.createElement('span');
  bar1.className = 'tile-expand-bar';
  ctaEl.appendChild(bar1);

  const labelEl = document.createElement('span');
  labelEl.className = 'tile-expand-label';
  labelEl.textContent = '▶ EXPAND';
  ctaEl.appendChild(labelEl);

  const bar2 = document.createElement('span');
  bar2.className = 'tile-expand-bar';
  ctaEl.appendChild(bar2);

  inner.appendChild(ctaEl);

  container.appendChild(inner);

  if (badge) badge.textContent = data.status;
}

/**
 * CV / Career Timeline tile — chronological entries with current/past dot.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].cv
 * @param {HTMLElement} [badge]
 */
export function renderCvTile(container, data, badge) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const listEl = document.createElement('div');
  listEl.className = 'cv-list';

  data.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'cv-entry';

    const dotEl = document.createElement('span');
    dotEl.className = entry.current ? 'cv-dot cv-dot--current' : 'cv-dot cv-dot--past';
    dotEl.setAttribute('aria-hidden', 'true');
    entryEl.appendChild(dotEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'cv-content';

    const cvTitleEl = document.createElement('div');
    cvTitleEl.className = 'cv-title';
    cvTitleEl.textContent = entry.title;
    contentEl.appendChild(cvTitleEl);

    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'cv-subtitle';
    subtitleEl.textContent = entry.subtitle;
    contentEl.appendChild(subtitleEl);

    const dateEl = document.createElement('div');
    dateEl.className = 'cv-date';
    dateEl.textContent = entry.date;
    contentEl.appendChild(dateEl);

    entryEl.appendChild(contentEl);
    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);

  if (badge) badge.textContent = String(data.length);
}

/**
 * Skills Matrix tile — category overview with mini bar-chart.
 *
 * Compact view shows one row per skill category:
 *   [CATEGORY NAME]  [████░░░░]  [count]
 * Footer: total tool count.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].skills
 * @param {HTMLElement} [badge]
 */
export function renderSkillsTile(container, data, badge) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  // Group skills by category (insertion order preserved)
  const categories = new Map();
  data.forEach(skill => {
    const cat = skill.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat).push(skill);
  });

  if (categories.size === 0) {
    if (badge) badge.textContent = '0';
    return;
  }

  const maxCount = Math.max(...[...categories.values()].map(s => s.length));

  const listEl = document.createElement('div');
  listEl.className = 'skills-compact-list';

  let idx = 0;
  categories.forEach((skills, category) => {
    const rowEl = document.createElement('div');
    rowEl.className = `skills-compact-row skills-cat--${idx % 7}`;

    const nameEl = document.createElement('span');
    nameEl.className = 'skills-compact-cat';
    nameEl.textContent = category;
    rowEl.appendChild(nameEl);

    const barWrapEl = document.createElement('div');
    barWrapEl.className = 'skills-compact-bar-wrap';

    const barEl = document.createElement('div');
    barEl.className = 'skills-compact-bar';
    barEl.style.width = `${Math.round((skills.length / maxCount) * 100)}%`;
    barWrapEl.appendChild(barEl);
    rowEl.appendChild(barWrapEl);

    const countEl = document.createElement('span');
    countEl.className = 'skills-compact-count';
    countEl.textContent = String(skills.length);
    rowEl.appendChild(countEl);

    listEl.appendChild(rowEl);
    idx++;
  });

  container.appendChild(listEl);

  const footerEl = document.createElement('div');
  footerEl.className = 'skills-compact-footer';
  footerEl.textContent = `${data.length} TOOLS TRACKED`;
  container.appendChild(footerEl);

  if (badge) badge.textContent = String(data.length);
}

/**
 * Projects tile — compact list, all entries sorted by status (active → completed → planned).
 * Overflow is handled by tile-body CSS (overflow: hidden).
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].projects
 * @param {HTMLElement} [badge]
 * @param {object} [uiStrings] - DATA[lang].ui.cases (for statusLabels)
 */
export function renderProjectsTile(container, data, badge, uiStrings) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const VALID_STATUSES = ['completed', 'active', 'planned'];
  const STATUS_RANK = { active: 0, completed: 1, planned: 2 };

  const sorted = [...data].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 3;
    const rb = STATUS_RANK[b.status] ?? 3;
    return ra - rb;
  });

  const listEl = document.createElement('div');
  listEl.className = 'proj-list';

  sorted.forEach(proj => {
    const entryEl = document.createElement('div');
    entryEl.className = 'proj-entry';
    entryEl.setAttribute('data-id', proj.id);

    const status = VALID_STATUSES.includes(proj.status) ? proj.status : 'planned';
    const dotEl = document.createElement('span');
    dotEl.className = `proj-dot proj-dot--${status}`;
    if (status === 'active') dotEl.classList.add('proj-dot--pulse');
    dotEl.setAttribute('aria-label', `Status: ${status}`);
    entryEl.appendChild(dotEl);

    const dateEl = document.createElement('span');
    dateEl.className = 'proj-date';
    dateEl.textContent = _projShortDate(proj.date);
    entryEl.appendChild(dateEl);

    const nameEl = document.createElement('span');
    nameEl.className = 'proj-name';
    nameEl.textContent = proj.name;
    entryEl.appendChild(nameEl);

    const statusLabel = uiStrings?.statusLabels?.[status] ?? status.toUpperCase();
    const pillEl = document.createElement('span');
    pillEl.className = `proj-status proj-status--${status}`;
    pillEl.textContent = statusLabel;
    entryEl.appendChild(pillEl);

    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);

  if (badge) badge.textContent = String(data.length);
}

/**
 * Convert YYYY-MM date string to short "MMM YY" label.
 * @param {string} isoYearMonth - e.g. "2026-04"
 * @returns {string}
 */
function _projShortDate(isoYearMonth) {
  if (!isoYearMonth || typeof isoYearMonth !== 'string') return '';
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const parts = isoYearMonth.split('-');
  const year  = parts[0];
  const m     = parseInt(parts[1], 10) - 1;
  if (!year || m < 0 || m > 11) return isoYearMonth;
  return `${MONTHS[m]} ${year.slice(2)}`;
}

/**
 * Certifications tile — list of cert abbreviation + name / issuer.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].certs
 * @param {HTMLElement} [badge]
 */
export function renderCertsTile(container, data, badge) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const listEl = document.createElement('div');
  listEl.className = 'certs-list';

  data.forEach(cert => {
    const entryEl = document.createElement('div');
    entryEl.className = 'cert-entry';

    const abbrEl = document.createElement('span');
    abbrEl.className = 'cert-abbr';
    abbrEl.textContent = cert.abbr;
    entryEl.appendChild(abbrEl);

    const infoEl = document.createElement('div');
    infoEl.className = 'cert-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'cert-name';
    nameEl.textContent = cert.name;
    infoEl.appendChild(nameEl);

    const issuerEl = document.createElement('div');
    issuerEl.className = 'cert-issuer';
    issuerEl.textContent = `${cert.issuer} // ${cert.year}`;
    infoEl.appendChild(issuerEl);

    entryEl.appendChild(infoEl);
    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);

  if (badge) badge.textContent = String(data.length);
}

/**
 * Network Topology tile — static SVG: CORE hub + 6 outer nodes + connecting lines.
 * No data dependency — layout is always the same.
 *
 * @param {HTMLElement} container
 */
export function renderTopologyTile(container, badge) {
  if (!container) return;
  container.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'topo-tile-wrap';

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'topo-tile-svg topology-svg');
  svg.setAttribute('viewBox', '0 0 310 170');
  svg.setAttribute('aria-hidden', 'true');
  // Pointer-events off so the tile-level click (openTopology) still fires
  svg.style.pointerEvents = 'none';

  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, String(attrs[k])));
    return e;
  };
  const txt = (tag, attrs, text) => { const e = el(tag, attrs); e.textContent = text; return e; };

  // Zone divider
  svg.appendChild(el('line', {
    x1: 0, y1: 85, x2: 310, y2: 85,
    stroke: 'rgba(255,255,255,0.05)', 'stroke-dasharray': '3 7'
  }));

  // Zone labels
  svg.appendChild(txt('text',
    { x: 6, y: 16,  'font-size': 6, fill: 'rgba(192,132,252,0.35)', 'font-family': 'monospace', 'letter-spacing': 1 },
    'LIFE'));
  svg.appendChild(txt('text',
    { x: 6, y: 165, 'font-size': 6, fill: 'rgba(57,255,20,0.3)',   'font-family': 'monospace', 'letter-spacing': 1 },
    'SOC'));

  // Internet → Router (dashed yellow)
  svg.appendChild(el('line', {
    x1: 18, y1: 85, x2: 44, y2: 85,
    stroke: '#ffd600', 'stroke-width': 0.8, 'stroke-dasharray': '3 4', 'stroke-opacity': 0.5
  }));

  // Internet diamond
  svg.appendChild(el('rect', {
    x: 11, y: 79, width: 10, height: 10,
    transform: 'rotate(45 16 84)',
    fill: 'none', stroke: '#ffd600', 'stroke-width': 1, 'stroke-opacity': 0.7
  }));

  // Router
  svg.appendChild(el('circle', {
    cx: 50, cy: 85, r: 5,
    fill: '#0d1117', stroke: '#ffd600', 'stroke-width': 1.5
  }));

  // Router → Proxmox Life / SOC
  svg.appendChild(el('path', {
    d: 'M55,85 C68,85 75,42 88,42',
    stroke: 'rgba(139,148,158,0.4)', 'stroke-width': 0.8, fill: 'none'
  }));
  svg.appendChild(el('path', {
    d: 'M55,85 C68,85 75,128 88,128',
    stroke: 'rgba(139,148,158,0.4)', 'stroke-width': 0.8, fill: 'none'
  }));

  // Life connections
  [
    { d: 'M88,42 C118,42 118,32 155,32',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C118,42 118,50 155,52',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C128,42 128,24 195,24',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C128,42 128,45 195,46',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C143,42 143,18 235,18',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C143,42 143,40 235,40',  stroke: '#c084fc', 'stroke-opacity': 0.3  },
    { d: 'M88,42 C155,42 155,55 275,55',  stroke: '#00e5ff', 'stroke-opacity': 0.25 }
  ].forEach(p => svg.appendChild(el('path', { ...p, 'stroke-width': 0.7, fill: 'none' })));

  // SOC connections
  [
    { d: 'M88,128 C118,128 118,118 155,118', stroke: '#39ff14', 'stroke-opacity': 0.3 },
    { d: 'M88,128 C118,128 118,136 155,136', stroke: '#39ff14', 'stroke-opacity': 0.3 },
    { d: 'M88,128 C128,128 128,108 195,106', stroke: '#39ff14', 'stroke-opacity': 0.3 },
    { d: 'M88,128 C128,128 128,128 195,128', stroke: '#39ff14', 'stroke-opacity': 0.3 },
    { d: 'M88,128 C143,128 143,142 235,142', stroke: '#ff3b3b', 'stroke-opacity': 0.3 },
    { d: 'M88,128 C143,128 143,155 235,155', stroke: '#ff3b3b', 'stroke-opacity': 0.3 }
  ].forEach(p => svg.appendChild(el('path', { ...p, 'stroke-width': 0.7, fill: 'none' })));

  // Proxmox Life (host)
  svg.appendChild(el('circle', { cx: 88, cy: 42, r: 7, fill: '#0d1117', stroke: '#c084fc', 'stroke-width': 1.5 }));

  // Life VMs
  [[155,32],[155,52],[195,24],[195,46],[235,18],[235,40]].forEach(([cx, cy]) => {
    svg.appendChild(el('circle', { cx, cy, r: 3.5, fill: '#0d1117', stroke: '#c084fc', 'stroke-width': 0.9 }));
  });

  // Grafana/Prometheus (cyan)
  svg.appendChild(el('circle', { cx: 275, cy: 55, r: 3.5, fill: '#0d1117', stroke: '#00e5ff', 'stroke-width': 0.9 }));

  // Proxmox SOC (host)
  svg.appendChild(el('circle', { cx: 88, cy: 128, r: 7, fill: '#0d1117', stroke: '#39ff14', 'stroke-width': 1.5 }));

  // SOC VMs
  [[155,118],[155,136],[195,106],[195,128]].forEach(([cx, cy]) => {
    svg.appendChild(el('circle', { cx, cy, r: 3.5, fill: '#0d1117', stroke: '#39ff14', 'stroke-width': 0.9 }));
  });

  // Isolated VMs (red)
  [[235,142],[235,155]].forEach(([cx, cy]) => {
    svg.appendChild(el('circle', { cx, cy, r: 3.5, fill: '#0d1117', stroke: '#ff3b3b', 'stroke-width': 0.9 }));
  });

  wrap.appendChild(svg);
  container.appendChild(wrap);

  if (badge) badge.textContent = 'PLANNED';
}

// ─────────────────────────────────────────────────────────────
// Topology — node info (popup data, shared by both views)
// ─────────────────────────────────────────────────────────────

const _TOPO_INFO = {
  internet:    { name: 'Internet',           type: 'WAN',                       desc: 'Upstream internet connection',                                              os: '—',                  port: '80/443',     status: 'active'  },
  router:      { name: 'Router/Firewall',    type: 'Network Gateway',           desc: 'Main firewall, VLAN trunking, NAT, IDS/IPS',                                os: 'OPNsense (FreeBSD)', port: '443',        status: 'planned' },
  proxmoxSoc:  { name: 'Proxmox Node 1',     type: 'Hypervisor SOC Core',       desc: 'Primary compute for security tooling',                                      os: 'Proxmox VE 8',       port: '8006',       status: 'planned' },
  proxmoxLife: { name: 'Proxmox Node 2',     type: 'Hypervisor Life Services',  desc: 'Secondary node for self-hosted services',                                   os: 'Proxmox VE 8',       port: '8006',       status: 'planned' },
  wazuh:       { name: 'Wazuh',              type: 'SIEM/XDR',                  desc: 'Open source SIEM — threat detection and alerting',                          os: 'Ubuntu Server',      port: '1514/443',   status: 'planned' },
  elk:         { name: 'ELK Stack',          type: 'Log Analytics',             desc: 'Elasticsearch+Logstash+Kibana — central log aggregation',                   os: 'Ubuntu Server',      port: '9200/5601',  status: 'planned' },
  graylog:     { name: 'Graylog',            type: 'Log Management',            desc: 'Centralized log management with alerting via Syslog/GELF',                  os: 'Ubuntu Server',      port: '9000/514',   status: 'planned' },
  docker:      { name: 'Docker Host',        type: 'Container Runtime',         desc: 'Containerized SOC services, managed via Portainer',                         os: 'Ubuntu Server',      port: '9443',       status: 'planned' },
  ubuntu:      { name: 'Ubuntu Server',      type: 'General Purpose VM',        desc: 'Scripts, tooling experiments and lab exercises',                            os: 'Ubuntu 22.04',       port: '22/80',      status: 'planned' },
  kali:        { name: 'Kali Linux',         type: 'Offensive Lab',             desc: 'Attack machine in isolated VLAN for pentesting exercises',                  os: 'Kali Rolling',       port: '22 internal',status: 'planned' },
  target:      { name: 'Target VMs',         type: 'Vulnerable Machines',       desc: 'Metasploitable/DVWA/VulnHub — targets for Kali lab',                        os: 'Various',            port: 'isolated',   status: 'planned' },
  home:        { name: 'Home Assistant',     type: 'Home Automation',           desc: 'Smart home hub — automations, energy, presence',                            os: 'HAOS',               port: '8123',       status: 'planned' },
  pihole:      { name: 'Pi-Hole',            type: 'DNS/Ad Blocker',            desc: 'Network-wide DNS ad and tracker blocking',                                  os: 'Debian/Docker',      port: '53/80',      status: 'planned' },
  nginx:       { name: 'Nginx Proxy',        type: 'Reverse Proxy',             desc: "SSL routing with Let's Encrypt for all internal services",                  os: 'Docker',             port: '80/443',     status: 'planned' },
  jellyfin:    { name: 'Jellyfin',           type: 'Media Server',              desc: 'Self-hosted media for movies, series, music',                               os: 'Docker',             port: '8096',       status: 'planned' },
  nextcloud:   { name: 'Nextcloud',          type: 'Cloud Storage',             desc: 'Private Google Drive/Photos replacement',                                   os: 'Docker',             port: '443',        status: 'planned' },
  localai:     { name: 'Local AI',           type: 'LLM/Open WebUI',            desc: 'Ollama with local LLMs — fully offline, no data leaves network',            os: 'Ubuntu+Docker',      port: '11434/3000', status: 'planned' },
  nas:         { name: 'NAS',                type: 'Shared Storage',            desc: 'Network storage for VM disks, backups, ISOs, media',                        os: 'TrueNAS/Unraid',     port: '445/2049',   status: 'planned' }
};

const _TOPO_NS = 'http://www.w3.org/2000/svg';

function _topoCreateNS(name, attrs) {
  const el = document.createElementNS(_TOPO_NS, name);
  if (attrs) Object.keys(attrs).forEach(k => el.setAttribute(k, String(attrs[k])));
  return el;
}

// ─────────────────────────────────────────────────────────────
// Compact topology — minimalist sketch, no labels, transparent bg
// ─────────────────────────────────────────────────────────────

function _buildTopologyCompact() {
  const svg = _topoCreateNS('svg', {
    viewBox: '0 0 200 220',
    'preserveAspectRatio': 'xMidYMid meet'
  });

  // Internet diamond (small)
  svg.appendChild(_topoCreateNS('polygon', {
    points: '100,8 110,18 100,28 90,18',
    fill: 'transparent', stroke: '#2a4a6a', 'stroke-width': 1
  }));
  // Internet → Router
  svg.appendChild(_topoCreateNS('line', { x1: 100, y1: 28, x2: 100, y2: 40, stroke: '#2a4a6a', 'stroke-width': 1 }));
  // Router diamond
  svg.appendChild(_topoCreateNS('polygon', {
    points: '100,40 113,52 100,64 87,52',
    fill: 'transparent', stroke: '#39ff14', 'stroke-width': 1
  }));
  // Router → Proxmox SOC / Life (curves)
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 95,62 Q 80,80 60,90', fill: 'none', stroke: '#39ff14', 'stroke-width': 1
  }));
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 105,62 Q 120,80 140,90', fill: 'none', stroke: '#39ff14', 'stroke-width': 1
  }));

  // Proxmox SOC — double ring
  svg.appendChild(_topoCreateNS('circle', { cx: 60,  cy: 100, r: 12, fill: 'transparent', stroke: '#378add', 'stroke-width': 1.5 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 60,  cy: 100, r:  9, fill: 'transparent', stroke: '#0a3060', 'stroke-width': 0.5 }));
  // Proxmox Life — double ring
  svg.appendChild(_topoCreateNS('circle', { cx: 140, cy: 100, r: 12, fill: 'transparent', stroke: '#8a5aaa', 'stroke-width': 1.5 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 140, cy: 100, r:  9, fill: 'transparent', stroke: '#3a1a5a', 'stroke-width': 0.5 }));

  // SOC bus + 3 mini circles (no labels)
  svg.appendChild(_topoCreateNS('line', { x1: 60, y1: 112, x2: 60, y2: 130, stroke: '#378add', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 35, y1: 130, x2: 85, y2: 130, stroke: '#378add', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 35, y1: 130, x2: 35, y2: 141, stroke: '#378add', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 60, y1: 130, x2: 60, y2: 141, stroke: '#378add', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 85, y1: 130, x2: 85, y2: 141, stroke: '#378add', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 35, cy: 145, r: 4, fill: 'transparent', stroke: '#39ff14', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 60, cy: 145, r: 4, fill: 'transparent', stroke: '#39ff14', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 85, cy: 145, r: 4, fill: 'transparent', stroke: '#00e5ff', 'stroke-width': 1 }));

  // Life bus + 3 mini circles
  svg.appendChild(_topoCreateNS('line', { x1: 140, y1: 112, x2: 140, y2: 130, stroke: '#8a5aaa', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 115, y1: 130, x2: 165, y2: 130, stroke: '#8a5aaa', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 115, y1: 130, x2: 115, y2: 141, stroke: '#8a5aaa', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 140, y1: 130, x2: 140, y2: 141, stroke: '#8a5aaa', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('line', { x1: 165, y1: 130, x2: 165, y2: 141, stroke: '#8a5aaa', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 115, cy: 145, r: 4, fill: 'transparent', stroke: '#c084fc', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 140, cy: 145, r: 4, fill: 'transparent', stroke: '#c084fc', 'stroke-width': 1 }));
  svg.appendChild(_topoCreateNS('circle', { cx: 165, cy: 145, r: 4, fill: 'transparent', stroke: '#c084fc', 'stroke-width': 1 }));

  // Cyan dashed connections from Proxmox to monitoring (routed outside zones)
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 48,100 L 16,100 L 16,190', fill: 'none', stroke: '#00e5ff', 'stroke-width': 0.8, 'stroke-dasharray': '2 2', opacity: '0.6'
  }));
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 152,100 L 184,100 L 184,190', fill: 'none', stroke: '#00e5ff', 'stroke-width': 0.8, 'stroke-dasharray': '2 2', opacity: '0.6'
  }));

  // Monitoring strip
  svg.appendChild(_topoCreateNS('rect', {
    x: 10, y: 190, width: 180, height: 18, rx: 2, ry: 2,
    fill: 'transparent', stroke: '#00e5ff', 'stroke-width': 1, 'stroke-dasharray': '3 2'
  }));

  return svg;
}

// ─────────────────────────────────────────────────────────────
// Helper — create an interactive node group + register click
// ─────────────────────────────────────────────────────────────

function _topoNodeGroup({ id, shape, attrs, label, labelX, labelY }, { interactive, onNodeClick }) {
  const group = _topoCreateNS('g', { class: 'topo-node' });
  group.dataset.nodeId = id;

  if (shape === 'diamond') {
    group.appendChild(_topoCreateNS('polygon', attrs));
  } else if (shape === 'doubleRing') {
    group.appendChild(_topoCreateNS('circle', attrs.outer));
    group.appendChild(_topoCreateNS('circle', attrs.inner));
  } else { // circle
    group.appendChild(_topoCreateNS('circle', attrs));
  }

  if (label) {
    const t = _topoCreateNS('text', {
      x: labelX, y: labelY,
      'text-anchor': 'middle',
      'dominant-baseline': 'hanging',
      class: 'topo-text topo-text--small'
    });
    t.textContent = label;
    group.appendChild(t);
  }

  if (interactive) {
    group.style.cursor = 'pointer';
    group.classList.add('topo-node--clickable');
    group.addEventListener('click', e => {
      e.stopPropagation();
      const info = _TOPO_INFO[id];
      if (info && typeof onNodeClick === 'function') onNodeClick({ id, info }, group, e);
    });
  }

  return group;
}

// ─────────────────────────────────────────────────────────────
// Expanded topology — horizontal layout (1400×480)
// ─────────────────────────────────────────────────────────────

function _buildTopologyExpanded({ onNodeClick }) {
  const svg = _topoCreateNS('svg', {
    viewBox: '0 0 1400 480',
    'preserveAspectRatio': 'xMidYMid meet'
  });
  svg.setAttribute('width', '100%');

  // ── Arrow marker definition ──────────────────────────────────
  const defs = _topoCreateNS('defs');
  const marker = _topoCreateNS('marker', {
    id: 'topoArrowRedExp', viewBox: '0 0 10 10', refX: '8', refY: '5',
    markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'
  });
  marker.appendChild(_topoCreateNS('path', { d: 'M 0,0 L 10,5 L 0,10 z', fill: '#ff3b3b' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  // ── Zone backgrounds + labels ────────────────────────────────
  svg.appendChild(_topoCreateNS('rect', {
    x: 320, y: 80, width: 360, height: 360, rx: 8, ry: 8,
    fill: 'transparent', stroke: '#0a3a5a', 'stroke-width': 1, 'stroke-dasharray': '5 3'
  }));
  svg.appendChild(_topoCreateNS('rect', {
    x: 760, y: 80, width: 360, height: 360, rx: 8, ry: 8,
    fill: 'transparent', stroke: '#3a0a6a', 'stroke-width': 1, 'stroke-dasharray': '5 3'
  }));
  const socZ = _topoCreateNS('text', { x: 332, y: 100, class: 'topo-text topo-text--zone', fill: '#378add' });
  socZ.textContent = 'SOC ZONE';
  svg.appendChild(socZ);
  const lifeZ = _topoCreateNS('text', { x: 772, y: 100, class: 'topo-text topo-text--zone', fill: '#8a5aaa' });
  lifeZ.textContent = 'LIFE ZONE';
  svg.appendChild(lifeZ);

  // ── Backbone connections (horizontal flow) ───────────────────
  // Internet → Router
  svg.appendChild(_topoCreateNS('line', { x1: 76, y1: 240, x2: 158, y2: 240, stroke: '#2a4a6a', 'stroke-width': 1.2 }));
  // Router → Proxmox SOC
  svg.appendChild(_topoCreateNS('line', { x1: 202, y1: 240, x2: 356, y2: 240, stroke: '#39ff14', 'stroke-width': 1 }));
  // Router → Proxmox Life (route around SOC zone via top arc)
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 195,233 C 220,90 740,90 796,232',
    fill: 'none', stroke: '#39ff14', 'stroke-width': 1, opacity: '0.85'
  }));

  // ── SOC zone bus topology ────────────────────────────────────
  // Horizontal bus from Proxmox SOC to right edge of zone
  svg.appendChild(_topoCreateNS('line', { x1: 404, y1: 240, x2: 660, y2: 240, stroke: '#378add', 'stroke-width': 1.5 }));
  // Drops to row-1 VMs (above bus, y=160)
  [450, 530, 610].forEach(x => {
    svg.appendChild(_topoCreateNS('line', { x1: x, y1: 240, x2: x, y2: 180, stroke: '#378add', 'stroke-width': 1 }));
  });
  // Drops to row-2 VMs (below bus, y=320)
  [450, 530].forEach(x => {
    svg.appendChild(_topoCreateNS('line', { x1: x, y1: 240, x2: x, y2: 300, stroke: '#378add', 'stroke-width': 1 }));
  });
  // Isolated lab VLAN line + label
  svg.appendChild(_topoCreateNS('line', {
    x1: 332, y1: 372, x2: 668, y2: 372, stroke: '#5a2020', 'stroke-width': 1, 'stroke-dasharray': '4 3'
  }));
  const labLabel = _topoCreateNS('text', { x: 340, y: 366, class: 'topo-text topo-text--xsmall', fill: '#ff6a6a' });
  labLabel.textContent = 'ISOLATED LAB VLAN';
  svg.appendChild(labLabel);
  // Kali → Target dashed red arrow
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 468,410 L 512,410',
    fill: 'none', stroke: '#ff3b3b', 'stroke-width': 1.2, 'stroke-dasharray': '4 3',
    'marker-end': 'url(#topoArrowRedExp)'
  }));

  // ── Life zone bus topology ───────────────────────────────────
  svg.appendChild(_topoCreateNS('line', { x1: 844, y1: 240, x2: 1100, y2: 240, stroke: '#8a5aaa', 'stroke-width': 1.5 }));
  [890, 970, 1050].forEach(x => {
    svg.appendChild(_topoCreateNS('line', { x1: x, y1: 240, x2: x, y2: 180, stroke: '#8a5aaa', 'stroke-width': 1 }));
    svg.appendChild(_topoCreateNS('line', { x1: x, y1: 240, x2: x, y2: 300, stroke: '#8a5aaa', 'stroke-width': 1 }));
  });
  // Nginx → NAS dashed (route around Local AI on the right)
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 1070,180 L 1070,162 L 1098,162 L 1098,410 L 1068,410',
    fill: 'none', stroke: '#4a2a8a', 'stroke-width': 1, 'stroke-dasharray': '4 3'
  }));

  // ── Monitoring vertical bar (right) ──────────────────────────
  svg.appendChild(_topoCreateNS('rect', {
    x: 1200, y: 80, width: 180, height: 360, rx: 4, ry: 4,
    fill: 'transparent', stroke: '#00e5ff', 'stroke-width': 1, 'stroke-dasharray': '3 2'
  }));
  const monT1 = _topoCreateNS('text', { x: 1290, y: 220, 'text-anchor': 'middle', class: 'topo-text topo-text--bold', fill: '#5ad9e8' });
  monT1.textContent = 'GRAFANA';
  svg.appendChild(monT1);
  const monT2 = _topoCreateNS('text', { x: 1290, y: 240, 'text-anchor': 'middle', class: 'topo-text topo-text--bold', fill: '#5ad9e8' });
  monT2.textContent = '+ PROMETHEUS';
  svg.appendChild(monT2);
  const monT3 = _topoCreateNS('text', { x: 1290, y: 264, 'text-anchor': 'middle', class: 'topo-text topo-text--small', fill: '#3a8a99' });
  monT3.textContent = 'Monitoring Layer';
  svg.appendChild(monT3);
  // Cyan dashed connections from each Proxmox to monitoring (routed via top)
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 380,216 L 380,60 L 1280,60 L 1280,80', fill: 'none', stroke: '#00e5ff', 'stroke-width': 1, 'stroke-dasharray': '3 2', opacity: '0.6'
  }));
  svg.appendChild(_topoCreateNS('path', {
    d: 'M 820,216 L 820,72 L 1300,72 L 1300,80', fill: 'none', stroke: '#00e5ff', 'stroke-width': 1, 'stroke-dasharray': '3 2', opacity: '0.6'
  }));

  // ── Nodes (clickable) ────────────────────────────────────────
  const ctx = { interactive: true, onNodeClick };

  // Internet (diamond)
  svg.appendChild(_topoNodeGroup({
    id: 'internet', shape: 'diamond',
    attrs: { points: '60,228 76,240 60,252 44,240', fill: '#050a0f', stroke: '#2a4a6a', 'stroke-width': 1.5 },
    label: 'INTERNET', labelX: 60, labelY: 262
  }, ctx));

  // Router (diamond)
  svg.appendChild(_topoNodeGroup({
    id: 'router', shape: 'diamond',
    attrs: { points: '180,218 202,240 180,262 158,240', fill: '#040e06', stroke: '#39ff14', 'stroke-width': 1.5 },
    label: 'ROUTER', labelX: 180, labelY: 272
  }, ctx));

  // Proxmox SOC (double ring)
  svg.appendChild(_topoNodeGroup({
    id: 'proxmoxSoc', shape: 'doubleRing',
    attrs: {
      outer: { cx: 380, cy: 240, r: 24, fill: '#061828', stroke: '#378add', 'stroke-width': 2 },
      inner: { cx: 380, cy: 240, r: 20, fill: 'none', stroke: '#0a3060', 'stroke-width': 0.5 }
    },
    label: 'Proxmox SOC', labelX: 380, labelY: 272
  }, ctx));

  // Proxmox Life (double ring)
  svg.appendChild(_topoNodeGroup({
    id: 'proxmoxLife', shape: 'doubleRing',
    attrs: {
      outer: { cx: 820, cy: 240, r: 24, fill: '#100828', stroke: '#8a5aaa', 'stroke-width': 2 },
      inner: { cx: 820, cy: 240, r: 20, fill: 'none', stroke: '#3a1a5a', 'stroke-width': 0.5 }
    },
    label: 'Proxmox Life', labelX: 820, labelY: 272
  }, ctx));

  // SOC VMs row 1 (y=160, r=20)
  const socRow1 = [
    { id: 'wazuh',   cx: 450, label: 'Wazuh' },
    { id: 'elk',     cx: 530, label: 'ELK Stack' },
    { id: 'graylog', cx: 610, label: 'Graylog' }
  ];
  socRow1.forEach(({ id, cx, label }) => {
    svg.appendChild(_topoNodeGroup({
      id, shape: 'circle',
      attrs: { cx, cy: 160, r: 20, fill: '#030f08', stroke: '#39ff14', 'stroke-width': 1.5 },
      label, labelX: cx, labelY: 188
    }, ctx));
  });

  // SOC VMs row 2 (y=320, r=20)
  [
    { id: 'docker', cx: 450, label: 'Docker Host' },
    { id: 'ubuntu', cx: 530, label: 'Ubuntu Server' }
  ].forEach(({ id, cx, label }) => {
    svg.appendChild(_topoNodeGroup({
      id, shape: 'circle',
      attrs: { cx, cy: 320, r: 20, fill: '#030f08', stroke: '#00e5ff', 'stroke-width': 1.5 },
      label, labelX: cx, labelY: 348
    }, ctx));
  });

  // Lab (y=410, r=18)
  [
    { id: 'kali',   cx: 450, label: 'Kali' },
    { id: 'target', cx: 530, label: 'Target' }
  ].forEach(({ id, cx, label }) => {
    svg.appendChild(_topoNodeGroup({
      id, shape: 'circle',
      attrs: { cx, cy: 410, r: 18, fill: '#140404', stroke: '#ff3b3b', 'stroke-width': 1.5 },
      label, labelX: cx, labelY: 436
    }, ctx));
  });

  // Life VMs row 1 (y=160, r=20)
  [
    { id: 'home',   cx: 890,  label: 'Home Assist.' },
    { id: 'pihole', cx: 970,  label: 'Pi-Hole' },
    { id: 'nginx',  cx: 1050, label: 'Nginx Proxy' }
  ].forEach(({ id, cx, label }) => {
    svg.appendChild(_topoNodeGroup({
      id, shape: 'circle',
      attrs: { cx, cy: 160, r: 20, fill: '#0a0520', stroke: '#c084fc', 'stroke-width': 1.5 },
      label, labelX: cx, labelY: 188
    }, ctx));
  });

  // Life VMs row 2 (y=320, r=20)
  [
    { id: 'jellyfin',  cx: 890,  label: 'Jellyfin' },
    { id: 'nextcloud', cx: 970,  label: 'Nextcloud' },
    { id: 'localai',   cx: 1050, label: 'Local AI' }
  ].forEach(({ id, cx, label }) => {
    svg.appendChild(_topoNodeGroup({
      id, shape: 'circle',
      attrs: { cx, cy: 320, r: 20, fill: '#0a0520', stroke: '#c084fc', 'stroke-width': 1.5 },
      label, labelX: cx, labelY: 348
    }, ctx));
  });

  // NAS (y=410, r=18)
  svg.appendChild(_topoNodeGroup({
    id: 'nas', shape: 'circle',
    attrs: { cx: 1050, cy: 410, r: 18, fill: '#0a0520', stroke: '#4a2a8a', 'stroke-width': 1.5 },
    label: 'NAS', labelX: 1050, labelY: 436
  }, ctx));

  return svg;
}

// Thin wrapper: _dispatchExpandedRender routes 'topology' here.
// expand() short-circuits for topology, but restoreNav() does not.

export function renderTopologyExpanded(_container) {
  openTopology();
}

/**
 * Threat Intel Feed tile — all articles as SIEM-style log entries.
 * Entries overflow+fade naturally via tile-body CSS.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].threatFeed
 * @param {HTMLElement} [badge]
 */
export function renderThreatFeedTile(container, data, badge) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));

  const listEl = document.createElement('div');
  listEl.className = 'tfeed-list';

  sorted.forEach((entry, idx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'tfeed-entry';

    // Severity dot — color derived from tags, pulses on newest entry
    const dotEl = document.createElement('span');
    dotEl.className = idx === 0 ? 'tfeed-dot tfeed-dot--live' : 'tfeed-dot';
    dotEl.style.setProperty('--tfeed-dot-color', _tfeedSeverityColor(entry.tags));
    rowEl.appendChild(dotEl);

    // Date
    const dateEl = document.createElement('span');
    dateEl.className   = 'tfeed-date';
    dateEl.textContent = _tfeedShortDate(entry.date);
    rowEl.appendChild(dateEl);

    // Source badge (abbreviated)
    const sourceEl = document.createElement('span');
    sourceEl.className   = 'tfeed-source';
    sourceEl.textContent = _tfeedSourceAbbr(entry.source);
    rowEl.appendChild(sourceEl);

    // Title
    const titleEl = document.createElement('span');
    titleEl.className   = 'tfeed-title';
    titleEl.textContent = entry.title;
    rowEl.appendChild(titleEl);

    listEl.appendChild(rowEl);
  });

  container.appendChild(listEl);

  const footerEl = document.createElement('div');
  footerEl.className   = 'tfeed-footer';
  footerEl.textContent = `${data.length} ARTICLES TRACKED`;
  container.appendChild(footerEl);

  if (badge) badge.textContent = String(data.length);
}

// Tags that map to a severity color — derived from data, nothing hardcoded per-article.
const _TFEED_CRITICAL = new Set(['zero-day', 'exploit', 'ransomware', 'apt', 'malware',
                                   'critical-infrastructure', 'ics']);
const _TFEED_HIGH     = new Set(['patch-tuesday', 'cisa', 'kev', 'fortinet',
                                   'supply-chain', 'ci/cd', 'devops']);
const _TFEED_INFO     = new Set(['report', 'trends', 'ai', 'predictions', 'agentic', 'defense']);

function _tfeedSeverityColor(tags) {
  const lower = (tags ?? []).map(t => t.toLowerCase());
  if (lower.some(t => _TFEED_CRITICAL.has(t))) return 'var(--sev-critical)';
  if (lower.some(t => _TFEED_HIGH.has(t)))     return 'var(--sev-medium)';
  if (lower.some(t => _TFEED_INFO.has(t)))     return 'var(--sev-info)';
  return 'var(--text-faint)';
}

function _tfeedSourceAbbr(source) {
  // Take initials of all words; if < 2 chars, fall back to first 5 chars of first word.
  const words   = source.trim().split(/\s+/);
  const initials = words.map(w => w[0].toUpperCase()).join('');
  return initials.length >= 2 ? initials.slice(0, 5) : words[0].slice(0, 5).toUpperCase();
}

function _tfeedShortDate(isoDate) {
  const MONTHS = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  try {
    const parts = isoDate.split('-');
    return `${MONTHS[parseInt(parts[1], 10)]} ${parseInt(parts[2], 10)}`;
  } catch (_) {
    return isoDate;
  }
}

/**
 * System Monitor tile — self-contained dashboard panel (no expanded view).
 *
 * Sections:
 *   1. 30-day uptime bars (hardcoded seed data)
 *   2. Three metric boxes (uptime / response / deploy)
 *   3. Response-time sparkline (canvas, 48 points, animated current value)
 *   4. Event log (4 entries)
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].uptime
 * @param {HTMLElement} [badge]
 */
export function renderUptimeTile(container, data, badge) {
  if (!container || !data) return;
  container.textContent = '';

  // ── 1. Uptime bars (30 days, seed-based) ──────────────────────
  const BAR_DATA = [
    'g','g','g','g','g','g','y','g','g','g',
    'g','g','g','r','g','g','g','g','y','g',
    'g','g','g','g','g','y','g','g','g','g'
  ];
  const BAR_HEIGHTS = [
    90,95,88,92,96,94,60,93,91,97,
    89,95,93,30,96,92,90,88,55,94,
    91,97,95,93,90,65,92,96,88,94
  ];
  const BAR_COLORS = { g: '#39ff14', y: '#ffd600', r: '#ff3b3b' };

  const barsEl = document.createElement('div');
  barsEl.className = 'sysmon-bars';

  BAR_DATA.forEach((type, i) => {
    const bar = document.createElement('div');
    bar.className = 'sysmon-bar';
    bar.style.height = `${BAR_HEIGHTS[i]}%`;
    bar.style.background = BAR_COLORS[type];
    barsEl.appendChild(bar);
  });
  container.appendChild(barsEl);

  // ── 2. Metric boxes ───────────────────────────────────────────
  const metricsEl = document.createElement('div');
  metricsEl.className = 'sysmon-metrics';

  const metricsData = [
    { label: 'UPTIME',   value: `${data.uptimePercent}%`, color: '#39ff14', sub: null },
    { label: 'RESPONSE', value: `${data.responseMs}ms`,   color: 'var(--accent)', sub: 'p95 latency' },
    { label: 'DEPLOY',   value: data.lastDeploy,          color: '#ffd600', sub: 'v1.4.2' }
  ];

  metricsData.forEach(m => {
    const box = document.createElement('div');
    box.className = 'sysmon-metric';

    const lbl = document.createElement('div');
    lbl.className = 'sysmon-metric__label';
    lbl.textContent = m.label;
    box.appendChild(lbl);

    const val = document.createElement('div');
    val.className = 'sysmon-metric__value';
    val.style.color = m.color;
    val.textContent = m.value;
    box.appendChild(val);

    if (m.sub) {
      const sub = document.createElement('div');
      sub.className = 'sysmon-metric__sub';
      sub.textContent = m.sub;
      box.appendChild(sub);
    }

    metricsEl.appendChild(box);
  });
  container.appendChild(metricsEl);

  // ── 3. Response sparkline (canvas) ────────────────────────────
  const SPARK_DATA = [
    42,45,38,47,44,41,50,48,43,39,46,52,55,49,44,40,
    37,42,48,53,58,62,89,72,55,48,44,41,39,43,47,45,
    42,38,41,44,47,50,46,43,40,38,42,45,48,44,41,47
  ];

  const sparkWrap = document.createElement('div');
  sparkWrap.className = 'sysmon-spark-wrap';

  const sparkHeader = document.createElement('div');
  sparkHeader.className = 'sysmon-spark-header';

  const sparkLabel = document.createElement('span');
  sparkLabel.className = 'sysmon-spark-label';
  sparkLabel.textContent = data.sparkLabel ?? 'RESPONSE TIME // 24H';
  sparkHeader.appendChild(sparkLabel);

  const sparkLive = document.createElement('span');
  sparkLive.className = 'sysmon-spark-live';
  sparkLive.textContent = `${data.responseMs}ms`;
  sparkHeader.appendChild(sparkLive);

  sparkWrap.appendChild(sparkHeader);

  const canvas = document.createElement('canvas');
  canvas.className = 'sysmon-spark-canvas';
  canvas.setAttribute('height', '48');
  canvas.setAttribute('aria-hidden', 'true');
  sparkWrap.appendChild(canvas);
  container.appendChild(sparkWrap);

  // Draw sparkline after layout (needs width)
  requestAnimationFrame(() => { _drawSparkline(canvas, SPARK_DATA); });

  // Animate live value ±5ms every 2s
  const intervalId = setInterval(() => {
    if (!container.isConnected) { clearInterval(intervalId); return; }
    const jitter = Math.floor(Math.random() * 11) - 5;
    const val = Math.max(28, Math.min(90, data.responseMs + jitter));
    sparkLive.textContent = `${val}ms`;
  }, 2000);

  // ── 4. Event log ──────────────────────────────────────────────
  const LOG_ENTRIES = data.logEntries ?? [
    { time: '19:14:02',  color: '#39ff14',      msg: 'Deploy v1.4.2 — successful' },
    { time: '16:33:47',  color: 'var(--accent)', msg: 'SSL certificate renewed' },
    { time: '11:02:19',  color: '#ffd600',       msg: 'Response spike → 89ms (resolved)' },
    { time: 'yesterday', color: '#39ff14',       msg: 'Uptime check passed — 100%' }
  ];

  const logEl = document.createElement('div');
  logEl.className = 'sysmon-log';

  LOG_ENTRIES.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'sysmon-log-row';

    const ts = document.createElement('span');
    ts.className = 'sysmon-log-ts';
    ts.textContent = entry.time;
    row.appendChild(ts);

    const dot = document.createElement('span');
    dot.className = 'sysmon-log-dot';
    dot.style.background = entry.color;
    row.appendChild(dot);

    const msg = document.createElement('span');
    msg.className = 'sysmon-log-msg';
    msg.textContent = entry.msg;
    row.appendChild(msg);

    logEl.appendChild(row);
  });
  container.appendChild(logEl);

  if (badge) badge.textContent = `${data.uptimePercent}%`;
}

/**
 * Draw a sparkline with cyan line + gradient fill on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} points
 */
function _drawSparkline(canvas, points) {
  if (!canvas || !canvas.getContext) return;
  const W = canvas.offsetWidth || canvas.width || 200;
  const H = 48;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const PAD = 2;

  const xStep = W / (points.length - 1);
  const yScale = (H - PAD * 2) / range;

  const coords = points.map((v, i) => ({
    x: i * xStep,
    y: PAD + (max - v) * yScale
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,212,255,0.25)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');

  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  coords.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(coords[coords.length - 1].x, H);
  ctx.lineTo(coords[0].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  coords.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Threat Radar tile — compact hexagonal radar that fills the tile.
 * 6 axes, 5 rings, animated polygon draw-in, colored value dots with tooltip.
 * No side panel here — that lives in the expanded view.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].radar
 */
export function renderRadarTile(container, data) {
  if (!container || !data || !Array.isArray(data.axes)) return;
  container.textContent = '';

  const wrap = document.createElement('div');
  wrap.className = 'radar-wrap radar-wrap--compact';

  const svg = _buildRadarSvg(data, { showValueLabels: false, clickableLabels: false, labelOffset: 18, size: 300, maxR: 108 });
  svg.classList.add('radar-svg--compact');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.display = 'block';
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // Hover-zoom: SVG scales to 1.55 anchored at the mouse position,
  // computed relative to the tile element (which has overflow:hidden).
  const tile = container.closest('.tile') ?? wrap;
  wrap.addEventListener('mouseenter', () => {
    svg.style.transform = 'scale(1.55)';
  });
  wrap.addEventListener('mousemove', event => {
    const rect = tile.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    svg.style.transformOrigin = x + 'px ' + y + 'px';
  });
  wrap.addEventListener('mouseleave', () => {
    svg.style.transform = 'scale(1)';
  });
}

function _buildRadarSvg(data, { showValueLabels, clickableLabels, labelOffset, size = 300, maxR = 108 }) {
  const NS        = 'http://www.w3.org/2000/svg';
  const SIZE      = size;
  const CX        = SIZE / 2;
  const CY        = SIZE / 2;
  const MAX_R     = maxR;
  const MAX_VALUE = 10;
  const N         = data.axes.length;
  const DEFAULT_COLOR = '#c084fc';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('class', 'radar-svg');

  const pt = (i, r) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.round((CX + r * Math.cos(angle)) * 10) / 10,
      y: Math.round((CY + r * Math.sin(angle)) * 10) / 10
    };
  };

  const pointsStr = (r) =>
    data.axes.map((_, i) => { const p = pt(i, r); return `${p.x},${p.y}`; }).join(' ');

  [0.2, 0.4, 0.6, 0.8, 1].forEach(f => {
    const ring = document.createElementNS(NS, 'polygon');
    ring.setAttribute('points', pointsStr(MAX_R * f));
    ring.setAttribute('class', 'radar-ring');
    svg.appendChild(ring);
  });

  data.axes.forEach((_, i) => {
    const p = pt(i, MAX_R);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(CX));
    line.setAttribute('y1', String(CY));
    line.setAttribute('x2', String(p.x));
    line.setAttribute('y2', String(p.y));
    line.setAttribute('class', 'radar-axis');
    svg.appendChild(line);
  });

  const targetR = data.axes.map(axis =>
    (Math.min(Math.max(Number(axis.value), 0), MAX_VALUE) / MAX_VALUE) * MAX_R
  );
  const collapsedPts = data.axes.map(() => `${CX},${CY}`).join(' ');

  const poly = document.createElementNS(NS, 'polygon');
  poly.setAttribute('points', collapsedPts);
  poly.setAttribute('class', 'radar-polygon');
  svg.appendChild(poly);

  const dotsGroup = document.createElementNS(NS, 'g');
  dotsGroup.setAttribute('class', 'radar-dots');
  svg.appendChild(dotsGroup);

  data.axes.forEach((axis, i) => {
    const p = pt(i, MAX_R + labelOffset);
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', String(p.x));
    label.setAttribute('y', String(p.y));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('class', clickableLabels ? 'radar-label radar-label--clickable' : 'radar-label');
    label.setAttribute('data-axis-index', String(i));
    label.style.setProperty('--axis-color', axis.color ?? DEFAULT_COLOR);
    label.textContent = axis.label;
    svg.appendChild(label);
  });

  // ── Draw animation ─────────────────────────────────────────
  const DURATION = 900;
  let start = null;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const tick = (now) => {
    if (start === null) start = now;
    const t = Math.min((now - start) / DURATION, 1);
    const k = ease(t);
    const pts = data.axes.map((_, i) => {
      const p = pt(i, targetR[i] * k);
      return `${p.x},${p.y}`;
    }).join(' ');
    poly.setAttribute('points', pts);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      _renderRadarDots(dotsGroup, data.axes, targetR, pt, DEFAULT_COLOR, showValueLabels);
    }
  };
  requestAnimationFrame(tick);

  return svg;
}

function _renderRadarDots(group, axes, targetR, pt, defaultColor, showValueLabels) {
  const NS = 'http://www.w3.org/2000/svg';
  axes.forEach((axis, i) => {
    const p = pt(i, targetR[i]);
    const color = axis.color ?? defaultColor;

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', String(p.x));
    dot.setAttribute('cy', String(p.y));
    dot.setAttribute('r', '3.5');
    dot.setAttribute('class', 'radar-dot');
    dot.setAttribute('fill', color);
    // Native SVG tooltip — shown on hover in the compact view
    const tip = document.createElementNS(NS, 'title');
    tip.textContent = `${axis.label}: ${axis.value}/10`;
    dot.appendChild(tip);
    group.appendChild(dot);

    if (showValueLabels) {
      const angle = (i / axes.length) * 2 * Math.PI - Math.PI / 2;
      const offX = Math.cos(angle) * 9;
      const offY = Math.sin(angle) * 9;
      const val = document.createElementNS(NS, 'text');
      val.setAttribute('x', String(p.x + offX));
      val.setAttribute('y', String(p.y + offY));
      val.setAttribute('text-anchor', 'middle');
      val.setAttribute('dominant-baseline', 'middle');
      val.setAttribute('class', 'radar-value');
      val.setAttribute('fill', color);
      val.textContent = `${axis.value}/10`;
      group.appendChild(val);
    }
  });
}

function _renderExpandedPanel(panel, svg, axes, activeIdx, toolsLabelStr) {
  const axis = axes[activeIdx];
  const color = axis.color ?? '#c084fc';
  panel.textContent = '';

  // Header with colored accent stripe
  const header = document.createElement('div');
  header.className = 'radar-panel__header';
  header.style.borderLeftColor = color;
  header.textContent = axis.label;
  panel.appendChild(header);

  // Score
  const score = document.createElement('div');
  score.className = 'radar-panel__score';
  score.style.color = color;
  score.textContent = `${axis.value}/10`;
  panel.appendChild(score);

  // Progress bar
  const barWrap = document.createElement('div');
  barWrap.className = 'radar-panel__bar';
  const barFill = document.createElement('div');
  barFill.className = 'radar-panel__bar-fill';
  barFill.style.background = color;
  barFill.style.width = '0%';
  barWrap.appendChild(barFill);
  panel.appendChild(barWrap);
  requestAnimationFrame(() => {
    barFill.style.width = `${(axis.value / 10) * 100}%`;
  });

  // Tools
  const toolsLabel = document.createElement('div');
  toolsLabel.className = 'radar-panel__tools-label';
  toolsLabel.textContent = toolsLabelStr ?? 'TOOLS';
  panel.appendChild(toolsLabel);

  const toolsWrap = document.createElement('div');
  toolsWrap.className = 'radar-panel__tools';
  (axis.tools ?? []).forEach(tool => {
    const badge = document.createElement('span');
    badge.className = 'radar-panel__tool';
    badge.textContent = tool;
    toolsWrap.appendChild(badge);
  });
  panel.appendChild(toolsWrap);

  // Category navigation — all 6 axes
  const nav = document.createElement('div');
  nav.className = 'radar-nav';
  axes.forEach((a, i) => {
    const rowColor = a.color ?? '#c084fc';
    const row = document.createElement('div');
    row.className = 'radar-nav-row' + (i === activeIdx ? ' radar-nav-row--active' : '');
    row.dataset.navIndex = String(i);
    row.style.setProperty('--row-color', rowColor);

    const dot = document.createElement('span');
    dot.className = 'radar-nav-row__dot';
    dot.style.background = rowColor;
    row.appendChild(dot);

    const name = document.createElement('span');
    name.className = 'radar-nav-row__name';
    name.textContent = a.label;
    row.appendChild(name);

    const val = document.createElement('span');
    val.className = 'radar-nav-row__value';
    val.textContent = `${a.value}/10`;
    row.appendChild(val);

    nav.appendChild(row);
  });
  panel.appendChild(nav);

  // Highlight active axis label in SVG
  svg.querySelectorAll('.radar-label').forEach(el => el.classList.remove('radar-label--active'));
  const active = svg.querySelector(`.radar-label[data-axis-index="${activeIdx}"]`);
  if (active) active.classList.add('radar-label--active');
}

/**
 * Threat Radar expanded view — large SVG + clickable side panel with tools.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].radar
 */
export function renderRadarExpanded(container, data) {
  if (!container || !data || !Array.isArray(data.axes)) return;
  container.textContent = '';

  // Outer flex container — all sizing via inline styles
  const wrap = document.createElement('div');
  wrap.className = 'exp-radar-layout';
  wrap.style.cssText =
    'display:flex; flex-direction:row; align-items:flex-start; justify-content:center; ' +
    'gap:48px; padding:0 48px; width:100%; box-sizing:border-box;';

  // Left column — 623×623 SVG box (33% smaller than 930)
  const svgBox = document.createElement('div');
  svgBox.style.cssText = 'flex:0 0 623px; width:623px; height:623px; margin-top:-16px;';

  // SVG: cx=250, cy=250, maxR=200 (size:500 → cx=cy=250)
  const svg = _buildRadarSvg(data, { showValueLabels: true, clickableLabels: true, labelOffset: 22, size: 500, maxR: 200 });
  svg.classList.add('exp-radar-svg');
  svg.setAttribute('width', '623');
  svg.setAttribute('height', '623');
  svg.setAttribute('viewBox', '0 0 500 500');
  svg.style.display = 'block';
  svgBox.appendChild(svg);
  wrap.appendChild(svgBox);

  // Right column — 280px panel, vertically centered next to the radar
  const panelBox = document.createElement('div');
  panelBox.style.cssText = 'flex:0 0 280px; width:280px; align-self:center;';

  const panel = document.createElement('div');
  panel.className = 'radar-panel radar-panel--expanded';
  panelBox.appendChild(panel);
  wrap.appendChild(panelBox);

  container.appendChild(wrap);

  let activeIdx = 0;
  _renderExpandedPanel(panel, svg, data.axes, activeIdx, data.toolsLabel);

  svg.addEventListener('click', e => {
    const label = e.target.closest('.radar-label');
    if (!label) return;
    e.stopPropagation();
    const idx = Number(label.dataset.axisIndex);
    if (!Number.isInteger(idx) || idx === activeIdx) return;
    activeIdx = idx;
    _renderExpandedPanel(panel, svg, data.axes, activeIdx, data.toolsLabel);
  });

  panel.addEventListener('click', e => {
    const row = e.target.closest('.radar-nav-row');
    if (!row) return;
    e.stopPropagation();
    const idx = Number(row.dataset.navIndex);
    if (!Number.isInteger(idx) || idx === activeIdx) return;
    activeIdx = idx;
    _renderExpandedPanel(panel, svg, data.axes, activeIdx, data.toolsLabel);
  });
}

/**
 * Secure Channel tile — 2-column grid (190px | 1fr):
 *   left:  header, contact vectors, encryption status
 *   right: terminal-style contact form (Formspree)
 *
 * stopPropagation on all form interactions prevents spurious tile-click events.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].contact
 * @param {object} uiStrings - DATA[lang].ui.contact
 * @param {HTMLElement} [badge]
 */
export function renderContactTile(container, data, uiStrings, badge) {
  if (!container) return;
  container.textContent = '';

  const layoutEl = document.createElement('div');
  layoutEl.className = 'sc-layout';

  // ══════════════════════════════════════════════════════════════
  // LEFT COLUMN
  // ══════════════════════════════════════════════════════════════
  const leftEl = document.createElement('div');
  leftEl.className = 'sc-left';

  // ── "CONTACT VECTORS" label ──────────────────────────────────
  const vectorsLabel = document.createElement('div');
  vectorsLabel.className = 'sc-vectors-label';
  vectorsLabel.textContent = uiStrings.contactVectorsLabel ?? 'CONTACT VECTORS';
  leftEl.appendChild(vectorsLabel);

  // ── Contact vectors ──────────────────────────────────────────
  const channelsEl = document.createElement('div');
  channelsEl.className = 'contact-channels';

  const ICONS = {
    email: '<path d="M2 4h20v16H2V4zm2 2v.01L12 13l8-6.99V6H4zm0 12h16V8.83l-8 7-8-7V18z"/>',
    linkedin: '<path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H6.5v-7H9v7zM7.7 8.7c-.8 0-1.3-.5-1.3-1.2s.5-1.2 1.4-1.2 1.3.5 1.3 1.2-.5 1.2-1.4 1.2zM18 17h-2.5v-3.8c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.6V17H10.3V10H12.8v1c.3-.5 1-1.2 2.2-1.2 1.6 0 2.9 1 2.9 3.3V17z"/>',
    github: '<path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7C6.7 20 6.1 18 6.1 18c-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.8-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0022 12c0-5.5-4.5-10-10-10z"/>'
  };

  const channels = [
    { key: 'email',    label: uiStrings.emailLabel,    value: data.email,    href: `mailto:${data.email}`,  external: false, icon: ICONS.email },
    { key: 'linkedin', label: uiStrings.linkedinLabel, value: data.linkedin, href: data.linkedin,             external: true,  icon: ICONS.linkedin },
    { key: 'github',   label: uiStrings.githubLabel,   value: data.github,   href: data.github,               external: true,  icon: ICONS.github }
  ];

  channels.forEach(ch => {
    const isPlaceholder = typeof ch.value !== 'string' || ch.value.startsWith('{{');
    const isMailto      = typeof ch.href  === 'string' && ch.href.startsWith('mailto:');
    const hasLink       = !isPlaceholder && (isMailto || _isSafeUrl(ch.href));

    const rowEl = document.createElement(hasLink ? 'a' : 'div');
    rowEl.className = 'sc-vector';
    if (hasLink) {
      rowEl.href = ch.href;
      if (ch.external) { rowEl.rel = 'noopener noreferrer'; rowEl.target = '_blank'; }
      rowEl.addEventListener('click', e => { e.stopPropagation(); });
    }

    // Icon box (SVG via DOMParser — no innerHTML)
    const iconBox = document.createElement('span');
    iconBox.className = 'sc-vector-icon';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '11');
    svg.setAttribute('height', '11');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(`<svg xmlns="${svgNS}">${ch.icon}</svg>`, 'image/svg+xml');
    Array.from(svgDoc.documentElement.childNodes).forEach(n => svg.appendChild(document.importNode(n, true)));
    iconBox.appendChild(svg);
    rowEl.appendChild(iconBox);

    const textEl = document.createElement('span');
    textEl.className = 'sc-vector-text';
    textEl.textContent = ch.label;
    rowEl.appendChild(textEl);

    const arrow = document.createElement('span');
    arrow.className = 'sc-vector-arrow';
    arrow.textContent = '\u203A';
    rowEl.appendChild(arrow);

    // Keep .contact-channel__link class on link elements for existing tests
    if (hasLink) rowEl.classList.add('contact-channel__link');

    channelsEl.appendChild(rowEl);
  });

  leftEl.appendChild(channelsEl);

  // ── Encryption status (bottom of left col) ───────────────────
  const secureEl = document.createElement('div');
  secureEl.className = 'sc-secure';

  const secureDot = document.createElement('span');
  secureDot.className = 'sc-secure-dot';
  secureEl.appendChild(secureDot);

  const secureLabel = document.createElement('span');
  secureLabel.className = 'sc-secure-label';
  secureLabel.textContent = uiStrings.channelSecureLabel ?? 'CHANNEL SECURE';
  secureEl.appendChild(secureLabel);

  const secureSub = document.createElement('div');
  secureSub.className = 'sc-secure-sub';
  secureSub.textContent = uiStrings.channelSecureSub ?? 'TLS 1.3 // AES-256-GCM';
  secureEl.appendChild(secureSub);

  leftEl.appendChild(secureEl);
  layoutEl.appendChild(leftEl);

  // ══════════════════════════════════════════════════════════════
  // RIGHT COLUMN — form
  // ══════════════════════════════════════════════════════════════
  const rightEl = document.createElement('div');
  rightEl.className = 'sc-right';

  // ── Form header ──────────────────────────────────────────────
  const formHeader = document.createElement('div');
  formHeader.className = 'sc-form-header';

  const composeLabel = document.createElement('span');
  composeLabel.className = 'sc-compose-label';
  composeLabel.textContent = uiStrings.composeLabel ?? 'COMPOSE TRANSMISSION';
  formHeader.appendChild(composeLabel);

  const txId = document.createElement('span');
  txId.className = 'sc-tx-id';
  txId.textContent = 'TX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  formHeader.appendChild(txId);

  rightEl.appendChild(formHeader);

  // ── Form ─────────────────────────────────────────────────────
  const form = document.createElement('form');
  form.id = 'contact-form';
  form.className = 'sc-form';
  form.setAttribute('novalidate', '');

  ['click', 'keydown', 'focus', 'input'].forEach(evt => {
    form.addEventListener(evt, e => { e.stopPropagation(); });
  });

  // Honeypot
  const hpField = document.createElement('div');
  hpField.className = 'form-field form-field--hp';
  hpField.setAttribute('aria-hidden', 'true');
  const hpInput = document.createElement('input');
  hpInput.type = 'text';
  hpInput.id   = 'website';
  hpInput.name = '_gotcha';
  hpInput.setAttribute('tabindex', '-1');
  hpInput.setAttribute('autocomplete', 'off');
  hpField.appendChild(hpInput);
  form.appendChild(hpField);

  // Fields — Sender ID + Return Address in a 2-col row, message below
  const topRow = document.createElement('div');
  topRow.className = 'sc-field-row';
  topRow.appendChild(_scField('contact-name',  uiStrings.senderIdLabel ?? 'SENDER ID',           'text',  'name',  100));
  topRow.appendChild(_scField('contact-email', uiStrings.returnAddressLabel ?? 'RETURN ADDRESS', 'email', 'email', 254));
  form.appendChild(topRow);
  form.appendChild(_scTextarea('contact-message', uiStrings.messagePayloadLabel ?? 'MESSAGE PAYLOAD', 500));

  // Actions row
  const actionsEl = document.createElement('div');
  actionsEl.className = 'sc-actions';

  const submitBtn = document.createElement('button');
  submitBtn.id        = 'contact-submit';
  submitBtn.className = 'sc-submit';
  submitBtn.type      = 'submit';
  submitBtn.textContent = uiStrings.submitLabel ?? '\u25B6 TRANSMIT';
  actionsEl.appendChild(submitBtn);

  const statusEl = document.createElement('span');
  statusEl.id        = 'form-status';
  statusEl.className = 'form-status';
  statusEl.setAttribute('role', 'alert');
  statusEl.setAttribute('aria-live', 'polite');
  actionsEl.appendChild(statusEl);

  form.appendChild(actionsEl);
  rightEl.appendChild(form);
  layoutEl.appendChild(rightEl);

  container.appendChild(layoutEl);

  if (badge) badge.textContent = 'E2E';
}

/** Secure-channel text input field with terminal prompt. */
function _scField(id, labelText, inputType, autocomplete, maxLength) {
  const field = document.createElement('div');
  field.className = 'sc-field';

  const label = document.createElement('label');
  label.className = 'sc-field-label';
  label.setAttribute('for', id);

  const prompt = document.createElement('span');
  prompt.className = 'sc-prompt';
  prompt.textContent = '>_';
  label.appendChild(prompt);

  const labelSpan = document.createElement('span');
  labelSpan.textContent = ` ${labelText}`;
  label.appendChild(labelSpan);
  field.appendChild(label);

  const input = document.createElement('input');
  input.className = 'sc-input';
  input.type = inputType;
  input.id = id;
  input.name = id;
  input.setAttribute('required', '');
  if (autocomplete) input.setAttribute('autocomplete', autocomplete);
  if (maxLength) input.setAttribute('maxlength', String(maxLength));
  field.appendChild(input);

  const error = document.createElement('span');
  error.className = 'form-field__error';
  error.id = `${id}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  field.appendChild(error);

  return field;
}

/** Secure-channel textarea with terminal prompt + char counter. */
function _scTextarea(id, labelText, maxLength) {
  const field = document.createElement('div');
  field.className = 'sc-field';

  const labelRow = document.createElement('div');
  labelRow.className = 'sc-field-label-row';

  const label = document.createElement('label');
  label.className = 'sc-field-label';
  label.setAttribute('for', id);

  const prompt = document.createElement('span');
  prompt.className = 'sc-prompt';
  prompt.textContent = '>_';
  label.appendChild(prompt);

  const labelSpan = document.createElement('span');
  labelSpan.textContent = ` ${labelText}`;
  label.appendChild(labelSpan);
  labelRow.appendChild(label);

  const counter = document.createElement('span');
  counter.className = 'sc-char-counter';
  counter.textContent = `0 / ${maxLength}`;
  labelRow.appendChild(counter);

  field.appendChild(labelRow);

  const textarea = document.createElement('textarea');
  textarea.className = 'sc-textarea';
  textarea.id = id;
  textarea.name = id;
  textarea.setAttribute('required', '');
  textarea.setAttribute('maxlength', String(maxLength));
  field.appendChild(textarea);

  // Live char counter
  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${maxLength}`;
    counter.classList.toggle('sc-char-counter--warn', len >= 400);
  });

  const error = document.createElement('span');
  error.className = 'form-field__error';
  error.id = `${id}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  field.appendChild(error);

  return field;
}

// ─────────────────────────────────────────────────────────────
// Expanded-view renderers (Phase 3)
//
// Each function: render{Id}Expanded(container, data?)
//   container — the .exp-body div inside the expanded panel
//
// Security contract: textContent + createElement + createElementNS only.
// ─────────────────────────────────────────────────────────────

/**
 * Profile expanded — 2-column: identification / specializations.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].profile
 */
export function renderProfileExpanded(container, data) {
  if (!container || !data) return;
  container.textContent = '';

  const layout = document.createElement('div');
  layout.className = 'profile-expanded-layout';

  // ── LEFT COLUMN ───────────────────────────────────────────
  const leftEl = document.createElement('div');
  leftEl.className = 'profile-expanded-left';

  const labelIdent = document.createElement('div');
  labelIdent.className = 'profile-section-label';
  labelIdent.textContent = data.labels?.identification ?? 'IDENTIFICATION';
  leftEl.appendChild(labelIdent);

  const nameEl = document.createElement('div');
  nameEl.className = 'profile-name-large';
  nameEl.textContent = data.name;
  leftEl.appendChild(nameEl);

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'profile-subtitle-expanded';
  subtitleEl.textContent = `${data.title} // ${data.location}`;
  leftEl.appendChild(subtitleEl);

  if (data.specializations && data.specializations.length > 0) {
    const tagsRowEl = document.createElement('div');
    tagsRowEl.className = 'profile-tags-row';
    data.specializations.forEach(spec => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = spec;
      tagsRowEl.appendChild(tagEl);
    });
    leftEl.appendChild(tagsRowEl);
  }

  const div1 = document.createElement('div');
  div1.className = 'profile-divider';
  leftEl.appendChild(div1);

  const labelBio = document.createElement('div');
  labelBio.className = 'profile-section-label';
  labelBio.textContent = data.labels?.aboutMe ?? 'ÜBER MICH';
  leftEl.appendChild(labelBio);

  if (data.bio) {
    const bioShortEl = document.createElement('p');
    bioShortEl.className = 'profile-bio-short';
    bioShortEl.textContent = data.bio;
    leftEl.appendChild(bioShortEl);
  }

  const div2 = document.createElement('div');
  div2.className = 'profile-divider';
  leftEl.appendChild(div2);

  const labelStory = document.createElement('div');
  labelStory.className = 'profile-section-label';
  labelStory.textContent = data.labels?.myStory ?? 'MEINE GESCHICHTE';
  leftEl.appendChild(labelStory);

  if (data.expandedBio) {
    const bioLongEl = document.createElement('p');
    bioLongEl.className = 'profile-bio-long';
    bioLongEl.textContent = data.expandedBio;
    leftEl.appendChild(bioLongEl);
  }

  layout.appendChild(leftEl);

  // ── RIGHT COLUMN ──────────────────────────────────────────
  const rightEl = document.createElement('div');
  rightEl.className = 'profile-expanded-right';

  const labelStatus = document.createElement('div');
  labelStatus.className = 'profile-section-label';
  labelStatus.textContent = data.labels?.status ?? 'STATUS';
  rightEl.appendChild(labelStatus);

  const statusBlockEl = document.createElement('div');
  statusBlockEl.className = 'profile-status-block';

  [
    { key: 'CLEARANCE',    val: data.labels?.clearance ?? 'B.SC. Y3',  color: null },
    { key: 'AVAILABILITY', val: data.labels?.available ?? 'IMMEDIATE', color: 'var(--status-open, #22c55e)' },
    { key: 'SECTOR',       val: 'STUTTGART',                           color: null },
    { key: 'MISSION',      val: data.status,                           color: 'var(--accent, #00d4ff)' }
  ].forEach(({ key, val, color }) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'profile-status-row';

    const keyEl = document.createElement('span');
    keyEl.className = 'profile-status-key';
    keyEl.textContent = key;
    rowEl.appendChild(keyEl);

    const valEl = document.createElement('span');
    valEl.className = 'profile-status-val';
    valEl.textContent = val;
    if (color) valEl.style.color = color;
    rowEl.appendChild(valEl);

    statusBlockEl.appendChild(rowEl);
  });

  rightEl.appendChild(statusBlockEl);

  const div3 = document.createElement('div');
  div3.className = 'profile-divider';
  rightEl.appendChild(div3);

  const labelEdu = document.createElement('div');
  labelEdu.className = 'profile-section-label';
  labelEdu.textContent = data.labels?.education ?? 'AUSBILDUNG';
  rightEl.appendChild(labelEdu);

  const eduBlockEl = document.createElement('div');
  eduBlockEl.className = 'profile-edu-block';

  const eduTitleEl = document.createElement('div');
  eduTitleEl.className = 'profile-edu-title';
  eduTitleEl.textContent = data.labels?.eduTitle ?? 'B.Eng. IT-Sicherheit';
  eduBlockEl.appendChild(eduTitleEl);

  const eduSubEl = document.createElement('div');
  eduSubEl.className = 'profile-edu-sub';
  eduSubEl.textContent = data.labels?.eduSub ?? 'Hochschule Esslingen · 2023 – heute';
  eduBlockEl.appendChild(eduSubEl);

  const eduNoteEl = document.createElement('div');
  eduNoteEl.className = 'profile-edu-note';
  eduNoteEl.textContent = data.labels?.eduNote ?? 'Gewechselt von Technischer Informatik nach 4 Semestern';
  eduBlockEl.appendChild(eduNoteEl);

  rightEl.appendChild(eduBlockEl);

  const div4 = document.createElement('div');
  div4.className = 'profile-divider';
  rightEl.appendChild(div4);

  const labelLang = document.createElement('div');
  labelLang.className = 'profile-section-label';
  labelLang.textContent = data.labels?.languages ?? 'SPRACHEN';
  rightEl.appendChild(labelLang);

  const langBlockEl = document.createElement('div');
  langBlockEl.className = 'profile-lang-block';

  (data.labels?.langRows ?? [
    { key: 'DEUTSCH', val: 'Muttersprache' },
    { key: 'ENGLISCH', val: 'Fließend' }
  ]).forEach(({ key, val }) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'profile-status-row';

    const keyEl = document.createElement('span');
    keyEl.className = 'profile-status-key';
    keyEl.textContent = key;
    rowEl.appendChild(keyEl);

    const valEl = document.createElement('span');
    valEl.className = 'profile-status-val';
    valEl.textContent = val;
    rowEl.appendChild(valEl);

    langBlockEl.appendChild(rowEl);
  });

  rightEl.appendChild(langBlockEl);
  layout.appendChild(rightEl);
  container.appendChild(layout);
}

// renderTopologyExpanded is defined above (next to renderTopologyTile)

/**
 * Threat Intel Feed expanded — all articles sorted newest-first,
 * each with title link, source, date, and tag badges.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].threatFeed
 */
export function renderThreatFeedExpanded(container, data) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));

  const listEl = document.createElement('div');
  listEl.className = 'exp-tfeed-list';

  sorted.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'exp-tfeed-entry';

    // Title as external link
    const linkEl = document.createElement('a');
    linkEl.href      = entry.url;
    linkEl.target    = '_blank';
    linkEl.rel       = 'noopener noreferrer';
    linkEl.className = 'exp-tfeed-link';
    linkEl.textContent = entry.title;
    entryEl.appendChild(linkEl);

    // Meta: source // date
    const metaEl = document.createElement('div');
    metaEl.className = 'exp-tfeed-meta';

    const sourceEl = document.createElement('span');
    sourceEl.className   = 'exp-tfeed-source';
    sourceEl.textContent = entry.source;
    metaEl.appendChild(sourceEl);

    const sepEl = document.createElement('span');
    sepEl.className   = 'exp-tfeed-sep';
    sepEl.textContent = '//';
    metaEl.appendChild(sepEl);

    const dateEl = document.createElement('span');
    dateEl.className   = 'exp-tfeed-date';
    dateEl.textContent = entry.date;
    metaEl.appendChild(dateEl);

    entryEl.appendChild(metaEl);

    // Tag badges
    if (entry.tags && entry.tags.length > 0) {
      const tagsEl = document.createElement('div');
      tagsEl.className = 'exp-tfeed-tags';
      entry.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className   = 'exp-tfeed-tag';
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
      });
      entryEl.appendChild(tagsEl);
    }

    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);
}

/**
 * Projects expanded — cards grouped by status (active → planned → completed).
 * Each card drills to Level 3; cards carry data-project-id for navigation.js delegation.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].projects
 * @param {object} uiStrings - DATA[lang].ui.cases
 */
export function renderProjectsExpanded(container, data, uiStrings) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const VALID_STATUSES = ['completed', 'active', 'planned'];
  const STATUS_ORDER   = ['active', 'planned', 'completed'];

  const wrapEl = document.createElement('div');
  wrapEl.className = 'exp-projects-wrap';

  // Group by status (preserving STATUS_ORDER)
  const groups = new Map(STATUS_ORDER.map(s => [s, []]));
  data.forEach(proj => {
    const s = VALID_STATUSES.includes(proj.status) ? proj.status : 'planned';
    groups.get(s).push(proj);
  });

  STATUS_ORDER.forEach(statusKey => {
    const group = groups.get(statusKey);
    if (group.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'exp-projects-group';

    const groupHeaderEl = document.createElement('div');
    groupHeaderEl.className = 'exp-projects-group__header';
    groupHeaderEl.textContent = uiStrings?.statusLabels?.[statusKey] ?? statusKey.toUpperCase();
    groupEl.appendChild(groupHeaderEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'exp-projects-grid';

    group.forEach(proj => {
      const cardEl = document.createElement('div');
      cardEl.className = 'exp-project-card';
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('data-project-id', proj.id);

      const headerEl = document.createElement('div');
      headerEl.className = 'exp-project-card__header';

      const dotEl = document.createElement('span');
      dotEl.className = `proj-dot proj-dot--${statusKey}`;
      if (statusKey === 'active') dotEl.classList.add('proj-dot--pulse');
      headerEl.appendChild(dotEl);

      const nameEl = document.createElement('span');
      nameEl.className = 'exp-project-card__title';
      nameEl.textContent = proj.name;
      headerEl.appendChild(nameEl);

      cardEl.appendChild(headerEl);

      if (proj.summary) {
        const summaryEl = document.createElement('p');
        summaryEl.className = 'exp-project-card__desc';
        summaryEl.textContent = proj.summary;
        cardEl.appendChild(summaryEl);
      }

      if (proj.tools && proj.tools.length > 0) {
        const toolsEl = document.createElement('div');
        toolsEl.className = 'exp-project-card__tech';
        proj.tools.forEach(t => {
          const tagEl = document.createElement('span');
          tagEl.className = 'tile-tag';
          tagEl.textContent = t;
          toolsEl.appendChild(tagEl);
        });
        cardEl.appendChild(toolsEl);
      }

      const drillEl = document.createElement('div');
      drillEl.className = 'exp-project-card__drill';
      drillEl.setAttribute('aria-hidden', 'true');
      drillEl.textContent = '→ DETAILS';
      cardEl.appendChild(drillEl);

      gridEl.appendChild(cardEl);
    });

    groupEl.appendChild(gridEl);
    wrapEl.appendChild(groupEl);
  });

  container.appendChild(wrapEl);
}

/**
 * Certifications expanded — full list with larger badges.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].certs
 */
export function renderCertsExpanded(container, data) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const listEl = document.createElement('div');
  listEl.className = 'exp-certs-list';

  data.forEach(cert => {
    const entryEl = document.createElement('div');
    entryEl.className = 'exp-cert-entry';

    const abbrEl = document.createElement('div');
    abbrEl.className = 'exp-cert-abbr';
    abbrEl.textContent = cert.abbr;
    entryEl.appendChild(abbrEl);

    const infoEl = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.className = 'exp-cert-name';
    nameEl.textContent = cert.name;
    infoEl.appendChild(nameEl);

    const metaEl = document.createElement('div');
    metaEl.className = 'exp-cert-meta';
    metaEl.textContent = `${cert.issuer} // ${cert.year}`;
    infoEl.appendChild(metaEl);

    entryEl.appendChild(infoEl);
    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);
}

/**
 * Skills Matrix expanded — SOC dashboard style.
 *
 * Structure:
 *   [41 TOOLS // 6 KATEGORIEN]          ← prominent header
 *   [████][██████][███][████████]        ← distribution bar
 *
 *   ▌ NETWORK & ANALYSIS          5     ← category header (accent stripe)
 *   [NMAP ●●○]  [WIRESHARK ●●○]  …      ← horizontal badge flow
 *
 * Badge: [NAME] [●●○] [2y?]
 * Proficiency: beginner=1/3, intermediate=2/3, advanced/expert=3/3 filled dots.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].skills
 */
export function renderSkillsExpanded(container, data) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];
  const PROF_FILL = Object.freeze({ beginner: 1, intermediate: 2, advanced: 3, expert: 3 });

  // Group by category (insertion order preserved)
  const categories = new Map();
  data.forEach(skill => {
    const cat = skill.category;
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat).push(skill);
  });

  if (categories.size === 0) {
    container.appendChild(_emptyState('—'));
    return;
  }

  // ── Summary header ───────────────────────────────────────────
  const summaryEl = document.createElement('div');
  summaryEl.className = 'exp-skills-summary';

  const totalEl = document.createElement('span');
  totalEl.className = 'exp-skills-summary__total';
  totalEl.textContent = `${data.length} TOOLS`;
  summaryEl.appendChild(totalEl);

  const sepEl = document.createElement('span');
  sepEl.className = 'exp-skills-summary__sep';
  sepEl.setAttribute('aria-hidden', 'true');
  sepEl.textContent = '//';
  summaryEl.appendChild(sepEl);

  const catLabelEl = document.createElement('span');
  catLabelEl.className = 'exp-skills-summary__cats';
  catLabelEl.textContent = `${categories.size} KATEGORIEN`;
  summaryEl.appendChild(catLabelEl);

  container.appendChild(summaryEl);

  // ── Distribution bar ─────────────────────────────────────────
  const distbarEl = document.createElement('div');
  distbarEl.className = 'exp-skills-distbar';

  let barIdx = 0;
  categories.forEach(skills => {
    const segEl = document.createElement('div');
    segEl.className = `exp-skills-distbar__seg skills-cat--${barIdx % 7}`;
    segEl.style.flex = String(skills.length);
    distbarEl.appendChild(segEl);
    barIdx++;
  });

  container.appendChild(distbarEl);

  // ── Category sections ────────────────────────────────────────
  const gridEl = document.createElement('div');
  gridEl.className = 'exp-skills-grid';

  let idx = 0;
  categories.forEach((skills, category) => {
    const catEl = document.createElement('div');
    catEl.className = `exp-skills-category skills-cat--${idx % 7}`;

    // Header bar with left accent stripe
    const headerEl = document.createElement('div');
    headerEl.className = 'exp-skills-category__header';

    const labelEl = document.createElement('span');
    labelEl.className = 'exp-skills-category__label';
    labelEl.textContent = category;
    headerEl.appendChild(labelEl);

    const catCountEl = document.createElement('span');
    catCountEl.className = 'exp-skills-category__count';
    catCountEl.textContent = String(skills.length);
    headerEl.appendChild(catCountEl);

    catEl.appendChild(headerEl);

    // Tool badges — horizontal flow
    const listEl = document.createElement('div');
    listEl.className = 'exp-skills-category__list';

    skills.forEach(skill => {
      const prof = validProficiencies.includes(skill.proficiency) ? skill.proficiency : 'beginner';
      const filledCount = PROF_FILL[prof] ?? 1;

      const badgeEl = document.createElement('span');
      badgeEl.className = 'exp-skill-badge';

      const nameEl = document.createElement('span');
      nameEl.className = 'exp-skill-badge__name';
      nameEl.textContent = skill.tool;
      badgeEl.appendChild(nameEl);

      // Proficiency dots (3 squares, filled = category color)
      const dotsEl = document.createElement('span');
      dotsEl.className = 'exp-skill-badge__dots';
      for (let i = 0; i < 3; i++) {
        const dotEl = document.createElement('span');
        dotEl.className = i < filledCount
          ? 'exp-skill-badge__dot exp-skill-badge__dot--filled'
          : 'exp-skill-badge__dot';
        dotsEl.appendChild(dotEl);
      }
      badgeEl.appendChild(dotsEl);

      // Years tag (only when set)
      if (skill.years !== null && skill.years !== undefined) {
        const yearsEl = document.createElement('span');
        yearsEl.className = 'exp-skill-badge__years';
        yearsEl.textContent = `${skill.years}y`;
        badgeEl.appendChild(yearsEl);
      }

      listEl.appendChild(badgeEl);
    });

    catEl.appendChild(listEl);
    gridEl.appendChild(catEl);
    idx++;
  });

  container.appendChild(gridEl);
}

/**
 * Career Timeline expanded — all entries with vertical line.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].cv
 */
export function renderCvExpanded(container, data) {
  if (!container || !Array.isArray(data)) return;
  container.textContent = '';

  const listEl = document.createElement('div');
  listEl.className = 'exp-cv-list';

  data.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'exp-cv-entry';

    const dotEl = document.createElement('span');
    dotEl.className = entry.current ? 'exp-cv-dot exp-cv-dot--current' : 'exp-cv-dot exp-cv-dot--past';
    dotEl.setAttribute('aria-hidden', 'true');
    entryEl.appendChild(dotEl);

    const contentEl = document.createElement('div');

    const titleEl = document.createElement('div');
    titleEl.className = 'exp-cv-entry__title';
    titleEl.textContent = entry.title;
    contentEl.appendChild(titleEl);

    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'exp-cv-entry__subtitle';
    subtitleEl.textContent = entry.subtitle;
    contentEl.appendChild(subtitleEl);

    const dateEl = document.createElement('div');
    dateEl.className = 'exp-cv-entry__date';
    dateEl.textContent = entry.date;
    contentEl.appendChild(dateEl);

    entryEl.appendChild(contentEl);
    listEl.appendChild(entryEl);
  });

  container.appendChild(listEl);
}



/**
 * Project Detail — Level 3 drill-down for a single project.
 *
 * @param {HTMLElement} container
 * @param {object} project - One entry from DATA[lang].projects
 * @param {object} uiStrings - DATA[lang].ui.cases
 */
export function renderProjectDetail(container, project, uiStrings) {
  if (!container || !project) return;
  container.textContent = '';

  const VALID_STATUSES = ['completed', 'active', 'planned'];

  const detailEl = document.createElement('div');
  detailEl.className = 'exp-project-detail';

  // Header: status dot + name + status pill
  const headerEl = document.createElement('div');
  headerEl.className = 'exp-project-detail__header';

  const status = VALID_STATUSES.includes(project.status) ? project.status : 'planned';
  const dotEl = document.createElement('span');
  dotEl.className = `proj-dot proj-dot--${status}`;
  if (status === 'active') dotEl.classList.add('proj-dot--pulse');
  dotEl.setAttribute('aria-label', `Status: ${status}`);
  headerEl.appendChild(dotEl);

  const nameEl = document.createElement('h1');
  nameEl.className = 'exp-project-detail__title';
  nameEl.textContent = project.name;
  headerEl.appendChild(nameEl);

  const statusLabel = uiStrings?.statusLabels?.[status] ?? status.toUpperCase();
  const pillEl = document.createElement('span');
  pillEl.className = `proj-status proj-status--${status}`;
  pillEl.textContent = statusLabel;
  headerEl.appendChild(pillEl);

  detailEl.appendChild(headerEl);

  // Full description (skip if placeholder)
  if (project.description && !project.description.includes('{{')) {
    const descLabelEl = document.createElement('div');
    descLabelEl.className = 'exp-project-detail__label';
    descLabelEl.textContent = uiStrings?.descriptionLabel ?? 'DESCRIPTION';
    detailEl.appendChild(descLabelEl);

    const descEl = document.createElement('p');
    descEl.className = 'exp-project-detail__desc';
    descEl.textContent = project.description;
    detailEl.appendChild(descEl);
  }

  // Tools
  if (project.tools && project.tools.length > 0) {
    const toolsLabelEl = document.createElement('div');
    toolsLabelEl.className = 'exp-project-detail__label';
    toolsLabelEl.textContent = uiStrings?.toolsLabel ?? 'TOOLS';
    detailEl.appendChild(toolsLabelEl);

    const toolsEl = document.createElement('div');
    toolsEl.className = 'tile-tags';
    project.tools.forEach(t => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tile-tag';
      tagEl.textContent = t;
      toolsEl.appendChild(tagEl);
    });
    detailEl.appendChild(toolsEl);
  }

  // Links (array of { label, url })
  if (project.links && project.links.length > 0) {
    const safeLinks = project.links.filter(lnk => _isSafeUrl(lnk.url));
    if (safeLinks.length > 0) {
      const linksLabelEl = document.createElement('div');
      linksLabelEl.className = 'exp-project-detail__label';
      linksLabelEl.textContent = uiStrings?.linksLabel ?? 'LINKS';
      detailEl.appendChild(linksLabelEl);

      const linksEl = document.createElement('div');
      linksEl.className = 'exp-project-detail__links';
      safeLinks.forEach(lnk => {
        const linkEl = document.createElement('a');
        linkEl.href      = lnk.url;
        linkEl.rel       = 'noopener noreferrer';
        linkEl.target    = '_blank';
        linkEl.className = 'tile-tag';
        linkEl.textContent = lnk.label;
        linksEl.appendChild(linkEl);
      });
      detailEl.appendChild(linksEl);
    }
  }

  container.appendChild(detailEl);
}

/**
 * Dispatch tile content render for one tile based on cfg.id.
 * Switch-dispatch avoids ESLint detect-object-injection on bracket notation.
 *
 * @param {object} cfg      - One TILES_CONFIG entry
 * @param {HTMLElement} tileEl - The built tile shell from _buildTile
 * @param {object} langData - DATA[lang]
 */
function _renderTileContent(cfg, tileEl, langData) {
  const body  = tileEl.querySelector('.tile-body');
  const badge = tileEl.querySelector('.tile-badge'); // null for topology, radar

  switch (cfg.id) {
    case 'profile':
      renderProfileTile(body, langData.profile, badge);
      break;
    case 'cv':
      renderCvTile(body, langData.cv, badge);
      break;
    case 'skills':
      renderSkillsTile(body, langData.skills, badge);
      break;
    case 'projects':
      renderProjectsTile(body, langData.projects, badge, langData.ui.cases);
      break;
    case 'certs':
      renderCertsTile(body, langData.certs, badge);
      break;
    case 'topology':
      renderTopologyTile(body, badge);
      break;
    case 'threatFeed':
      renderThreatFeedTile(body, langData.threatFeed, badge);
      break;
    case 'uptime':
      renderUptimeTile(body, langData.uptime, badge);
      break;
    case 'radar':
      renderRadarTile(body, langData.radar);
      break;
    case 'contact':
      renderContactTile(body, langData.contact, langData.ui.contact, badge);
      break;
  }
}

// ─────────────────────────────────────────────────────────────
// Public API (legacy — kept for test compatibility)
// ─────────────────────────────────────────────────────────────

/**
 * Render all sections for a given language.
 * Accepts an optional dataOverride for testing with synthetic DATA.
 *
 * @param {'de' | 'en'} lang
 * @param {object} [dataOverride] - Replaces DATA when provided (for tests).
 */
export function renderAll(lang, dataOverride) {
  const source = dataOverride ?? DATA;
  const langData = source[lang];

  if (!langData) {
    throw new Error(`renderAll: unsupported language "${lang}"`);
  }

  _renderTopbar(langData.ui.topbar);
  _renderNav(document.getElementById('sidebar-nav'), langData.ui.nav);
  _renderSectionHeadings(langData.ui.sections);

  renderStatusPanel(document.getElementById('status-panel-content'), langData.status);
  renderThreatIntel(document.getElementById('threat-intel-content'), langData.threatIntel, langData.ui.threatIntel);
  renderSkillsMatrix(document.getElementById('skills-matrix-content'), langData.skills, langData.ui.skillsTable);
  renderActiveCases(document.getElementById('active-cases-content'), langData.cases, langData.ui.cases);
  renderContact(document.getElementById('contact-content'), langData.contact, langData.ui.contact);
}

// ─────────────────────────────────────────────────────────────
// Section render functions (exported for unit tests)
// ─────────────────────────────────────────────────────────────

/**
 * Render the Status Panel section.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].status
 */
export function renderStatusPanel(container, data) {
  if (!container) return;
  container.textContent = '';

  const panel = document.createElement('div');
  panel.className = 'status-panel';

  // Name
  const nameEl = document.createElement('h1');
  nameEl.className = 'status-panel__name';
  nameEl.textContent = data.name;
  panel.appendChild(nameEl);

  // Title // Location
  const metaEl = document.createElement('div');
  metaEl.className = 'status-panel__meta';

  const titleEl = document.createElement('span');
  titleEl.className = 'status-panel__title';
  titleEl.textContent = data.title;
  metaEl.appendChild(titleEl);

  const sepEl = document.createElement('span');
  sepEl.className = 'status-panel__separator';
  sepEl.setAttribute('aria-hidden', 'true');
  sepEl.textContent = '//';
  metaEl.appendChild(sepEl);

  const locationEl = document.createElement('span');
  locationEl.className = 'status-panel__location';
  locationEl.textContent = data.location;
  metaEl.appendChild(locationEl);

  panel.appendChild(metaEl);

  // Status with pulsing dot
  const statusRowEl = document.createElement('div');
  statusRowEl.className = 'status-panel__status';

  const dotEl = document.createElement('span');
  dotEl.className = 'status-dot status-dot--active';
  dotEl.setAttribute('aria-hidden', 'true');
  statusRowEl.appendChild(dotEl);

  const statusTextEl = document.createElement('span');
  statusTextEl.className = 'status-panel__status-text';
  statusTextEl.textContent = data.status;
  statusRowEl.appendChild(statusTextEl);

  panel.appendChild(statusRowEl);

  // Bio
  if (data.bio) {
    const bioEl = document.createElement('p');
    bioEl.className = 'status-panel__bio';
    bioEl.textContent = data.bio;
    panel.appendChild(bioEl);
  }

  // Specializations
  if (data.specializations.length > 0) {
    const specsEl = document.createElement('div');
    specsEl.className = 'status-panel__specializations';

    data.specializations.forEach(spec => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = spec;
      specsEl.appendChild(tagEl);
    });

    panel.appendChild(specsEl);
  }

  container.appendChild(panel);
}

/**
 * Render the Threat Intel Feed section.
 * Entries are displayed newest-first (sorted by date descending).
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].threatIntel
 * @param {object} uiStrings - DATA[lang].ui.threatIntel
 */
export function renderThreatIntel(container, data, uiStrings) {
  if (!container) return;
  container.textContent = '';

  if (!data.length) {
    container.appendChild(_emptyState(uiStrings.noEntries));
    return;
  }

  const feed = document.createElement('div');
  feed.className = 'threat-feed';

  // Sort newest first — do not mutate original array
  const sorted = [...data].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    // Invalid dates sort to the end
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  sorted.forEach(entry => {
    const entryEl = document.createElement('div');
    entryEl.className = 'threat-entry';
    entryEl.setAttribute('data-id', entry.id);

    // Severity dot
    const dotEl = document.createElement('span');
    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    const severity = validSeverities.includes(entry.severity) ? entry.severity : 'info';
    dotEl.className = `severity-dot severity--${severity}`;
    dotEl.setAttribute('aria-label', `Severity: ${severity}`);
    entryEl.appendChild(dotEl);

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'threat-entry__body';

    // Header row: ID // date // category
    const headerEl = document.createElement('div');
    headerEl.className = 'threat-entry__header';

    const idEl = document.createElement('span');
    idEl.className = 'id-badge';
    idEl.textContent = entry.id;
    headerEl.appendChild(idEl);

    const dateEl = document.createElement('time');
    dateEl.className = 'threat-entry__date';
    dateEl.setAttribute('datetime', entry.date);
    dateEl.textContent = entry.date;
    headerEl.appendChild(dateEl);

    const validCategories = ['project', 'ctf', 'research', 'certification'];
    const category = validCategories.includes(entry.category) ? entry.category : 'project';
    const categoryLabel = uiStrings.categoryLabels[category] ?? category.toUpperCase();
    const categoryEl = document.createElement('span');
    categoryEl.className = 'category-badge';
    categoryEl.textContent = categoryLabel;
    headerEl.appendChild(categoryEl);

    bodyEl.appendChild(headerEl);

    // Title
    const titleEl = document.createElement('h3');
    titleEl.className = 'threat-entry__title';
    titleEl.textContent = entry.title;
    bodyEl.appendChild(titleEl);

    // Summary
    if (entry.summary) {
      const summaryEl = document.createElement('p');
      summaryEl.className = 'threat-entry__summary';
      summaryEl.textContent = entry.summary;
      bodyEl.appendChild(summaryEl);
    }

    // Tags
    if (entry.tags.length > 0) {
      const tagsEl = document.createElement('div');
      tagsEl.className = 'threat-entry__tags';

      entry.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.textContent = tag;
        tagsEl.appendChild(tagEl);
      });

      bodyEl.appendChild(tagsEl);
    }

    // Link — only rendered if URL is a valid https:// address
    if (_isSafeUrl(entry.link)) {
      const linkEl = document.createElement('a');
      linkEl.className = 'threat-entry__link';
      linkEl.href = entry.link;
      linkEl.rel = 'noopener noreferrer';
      linkEl.target = '_blank';
      linkEl.textContent = '→ View';
      bodyEl.appendChild(linkEl);
    }

    entryEl.appendChild(bodyEl);
    feed.appendChild(entryEl);
  });

  container.appendChild(feed);
}

/**
 * Render the Skills Matrix section as a table.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].skills
 * @param {object} uiStrings - DATA[lang].ui.skillsTable
 */
export function renderSkillsMatrix(container, data, uiStrings) {
  if (!container) return;
  container.textContent = '';

  if (!data.length) {
    container.appendChild(_emptyState('—'));
    return;
  }

  const table = document.createElement('table');
  table.className = 'skills-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  [uiStrings.tool, uiStrings.category, uiStrings.proficiency, uiStrings.years].forEach(label => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.textContent = label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  const validProficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];

  data.forEach(skill => {
    const row = document.createElement('tr');

    const toolCell = document.createElement('td');
    toolCell.className = 'skills-table__tool';
    toolCell.textContent = skill.tool;
    row.appendChild(toolCell);

    const catCell = document.createElement('td');
    catCell.textContent = skill.category;
    row.appendChild(catCell);

    const profCell = document.createElement('td');
    const proficiency = validProficiencies.includes(skill.proficiency) ? skill.proficiency : 'beginner';
    const profSpan = document.createElement('span');
    profSpan.className = `proficiency-badge proficiency--${proficiency}`;
    profSpan.textContent = proficiency;
    profCell.appendChild(profSpan);
    row.appendChild(profCell);

    const yearsCell = document.createElement('td');
    yearsCell.className = 'skills-table__years';
    yearsCell.textContent = (skill.years !== null && skill.years !== undefined)
      ? String(skill.years)
      : '—';
    row.appendChild(yearsCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Render the Active Cases section.
 * Sort order: open → in-progress → closed.
 *
 * @param {HTMLElement} container
 * @param {Array} data - DATA[lang].cases
 * @param {object} uiStrings - DATA[lang].ui.cases
 */
export function renderActiveCases(container, data, uiStrings) {
  if (!container) return;
  container.textContent = '';

  if (!data.length) {
    container.appendChild(_emptyState(uiStrings.noEntries));
    return;
  }

  const statusOrder = { 'open': 0, 'in-progress': 1, 'closed': 2 };

  const sorted = [...data].sort((a, b) => {
    return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
  });

  const grid = document.createElement('div');
  grid.className = 'cases-grid';

  sorted.forEach(caseItem => {
    const card = document.createElement('div');
    card.className = 'case-card';
    card.setAttribute('data-id', caseItem.id);

    // Header: ID + status pill
    const headerEl = document.createElement('div');
    headerEl.className = 'case-card__header';

    const idEl = document.createElement('span');
    idEl.className = 'case-card__id';
    idEl.textContent = caseItem.id;
    headerEl.appendChild(idEl);

    const validStatuses = ['open', 'in-progress', 'closed'];
    const status = validStatuses.includes(caseItem.status) ? caseItem.status : 'open';
    const statusLabel = uiStrings.statusLabels[status] ?? status.toUpperCase();
    const cssStatus = status.replace('-', '');

    const pillEl = document.createElement('span');
    pillEl.className = `status-pill status--${cssStatus}`;
    pillEl.textContent = statusLabel;
    headerEl.appendChild(pillEl);

    card.appendChild(headerEl);

    // Title
    const titleEl = document.createElement('h3');
    titleEl.className = 'case-card__title';
    titleEl.textContent = caseItem.title;
    card.appendChild(titleEl);

    // Description
    if (caseItem.description) {
      const descEl = document.createElement('p');
      descEl.className = 'case-card__description';
      descEl.textContent = caseItem.description;
      card.appendChild(descEl);
    }

    // Tech tags
    if (caseItem.tech.length > 0) {
      const techEl = document.createElement('div');
      techEl.className = 'case-card__tech';

      caseItem.tech.forEach(tech => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag tag--tech';
        tagEl.textContent = tech;
        techEl.appendChild(tagEl);
      });

      card.appendChild(techEl);
    }

    // Dates
    const datesEl = document.createElement('div');
    datesEl.className = 'case-card__dates';

    const startedEl = document.createElement('time');
    startedEl.className = 'case-card__date';
    startedEl.setAttribute('datetime', caseItem.started ?? '');
    startedEl.textContent = `${uiStrings.labelStarted}: ${caseItem.started ?? '—'}`;
    datesEl.appendChild(startedEl);

    if (caseItem.closed !== null && caseItem.closed !== undefined) {
      const closedEl = document.createElement('time');
      closedEl.className = 'case-card__date';
      closedEl.setAttribute('datetime', caseItem.closed);
      closedEl.textContent = `${uiStrings.labelClosed}: ${caseItem.closed}`;
      datesEl.appendChild(closedEl);
    }

    card.appendChild(datesEl);

    // Link — only rendered if URL is a valid https:// address
    if (_isSafeUrl(caseItem.link)) {
      const linkEl = document.createElement('a');
      linkEl.className = 'case-card__link';
      linkEl.href = caseItem.link;
      linkEl.rel = 'noopener noreferrer';
      linkEl.target = '_blank';
      linkEl.textContent = uiStrings.linkLabel;
      card.appendChild(linkEl);
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

/**
 * Render the Contact section (links + form structure).
 * Event handling is in contact.js, not here.
 *
 * @param {HTMLElement} container
 * @param {object} data - DATA[lang].contact
 * @param {object} uiStrings - DATA[lang].ui.contact
 */
export function renderContact(container, data, uiStrings) {
  if (!container) return;
  container.textContent = '';

  const layout = document.createElement('div');
  layout.className = 'contact-layout';

  // ── Links column ──────────────────────────────────────────────
  const linksEl = document.createElement('div');
  linksEl.className = 'contact__links';

  _appendContactLink(linksEl, uiStrings.emailLabel, data.email, `mailto:${data.email}`, false);
  _appendContactLink(linksEl, uiStrings.linkedinLabel, data.linkedin, data.linkedin, true);
  _appendContactLink(linksEl, uiStrings.githubLabel, data.github, data.github, true);

  layout.appendChild(linksEl);

  // ── Form column ───────────────────────────────────────────────
  const formWrapper = document.createElement('div');
  formWrapper.className = 'contact__form-wrapper';

  const formTitle = document.createElement('h3');
  formTitle.className = 'section__heading';
  formTitle.textContent = uiStrings.formTitle;
  formWrapper.appendChild(formTitle);

  const form = document.createElement('form');
  form.id = 'contact-form';
  form.className = 'contact-form';
  form.setAttribute('novalidate', '');

  // Honeypot — visually hidden via CSS class, NOT display:none
  // (many bots detect display:none and skip honeypot fields)
  const hpField = _createFormField('website', 'Website', 'text', false);
  hpField.className = 'form-field form-field--hp';
  hpField.setAttribute('aria-hidden', 'true');
  const hpInput = hpField.querySelector('input');
  if (hpInput) {
    hpInput.setAttribute('tabindex', '-1');
    hpInput.setAttribute('autocomplete', 'off');
  }
  form.appendChild(hpField);

  // Name field
  form.appendChild(_createFormField('contact-name', uiStrings.nameLabel, 'text', true, 'name', 100));

  // Email field
  form.appendChild(_createFormField('contact-email', uiStrings.emailFieldLabel, 'email', true, 'email', 254));

  // Message field
  form.appendChild(_createTextareaField('contact-message', uiStrings.messageLabel, true, 1000));

  // Submit + status
  const actionsEl = document.createElement('div');
  actionsEl.className = 'form-actions';

  const submitBtn = document.createElement('button');
  submitBtn.id = 'contact-submit';
  submitBtn.className = 'form-submit-btn';
  submitBtn.type = 'submit';
  submitBtn.textContent = uiStrings.submitLabel;
  actionsEl.appendChild(submitBtn);

  const statusEl = document.createElement('span');
  statusEl.id = 'form-status';
  statusEl.className = 'form-status';
  statusEl.setAttribute('role', 'alert');
  statusEl.setAttribute('aria-live', 'polite');
  actionsEl.appendChild(statusEl);

  form.appendChild(actionsEl);
  formWrapper.appendChild(form);
  layout.appendChild(formWrapper);

  container.appendChild(layout);
}

// ─────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────

function _renderTopbar(uiStrings) {
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = uiStrings.title;

  const statusEl = document.getElementById('topbar-status');
  if (statusEl) statusEl.textContent = uiStrings.statusLabel;
}

function _renderNav(container, navStrings) {
  if (!container) return;
  container.textContent = '';

  const sections = [
    { key: 'status',     href: '#status-panel' },
    { key: 'threatIntel', href: '#threat-intel' },
    { key: 'skills',     href: '#skills-matrix' },
    { key: 'cases',      href: '#active-cases' },
    { key: 'contact',    href: '#contact' }
  ];

  sections.forEach(({ key, href }) => {
    const li = document.createElement('li');
    li.className = 'nav__item';

    const a = document.createElement('a');
    a.className = 'nav__link';
    a.href = href;
    a.textContent = navStrings[key] ?? key;
    li.appendChild(a);

    container.appendChild(li);
  });
}

function _renderSectionHeadings(sections) {
  const map = {
    'heading-status':  sections.status,
    'heading-threat':  sections.threatIntel,
    'heading-skills':  sections.skills,
    'heading-cases':   sections.cases,
    'heading-contact': sections.contact
  };

  Object.entries(map).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}

/**
 * Append a contact link item to the links container.
 * Placeholders ({{...}}) are shown as muted text, not as links.
 */
function _appendContactLink(container, label, value, href, isExternal) {
  const item = document.createElement('div');
  item.className = 'contact__link-item';

  const labelEl = document.createElement('span');
  labelEl.className = 'contact__label';
  labelEl.textContent = label;
  item.appendChild(labelEl);

  const isPlaceholder = typeof value !== 'string' || value.startsWith('{{');
  const isMailto = typeof href === 'string' && href.startsWith('mailto:');

  if (!isPlaceholder && (isMailto || _isSafeUrl(href))) {
    const linkEl = document.createElement('a');
    linkEl.className = 'contact__link';
    linkEl.href = href;
    linkEl.textContent = value;
    if (isExternal) {
      linkEl.rel = 'noopener noreferrer';
      linkEl.target = '_blank';
    }
    item.appendChild(linkEl);
  } else {
    const placeholderEl = document.createElement('span');
    placeholderEl.className = 'contact__placeholder';
    placeholderEl.textContent = isPlaceholder ? '— not yet configured —' : value;
    item.appendChild(placeholderEl);
  }

  container.appendChild(item);
}

/** Create an <input> form field with label and error span. */
function _createFormField(id, labelText, inputType, required, autocomplete, maxLength) {
  const field = document.createElement('div');
  field.className = 'form-field';

  const label = document.createElement('label');
  label.className = 'form-field__label';
  label.setAttribute('for', id);
  label.textContent = labelText;
  field.appendChild(label);

  const input = document.createElement('input');
  input.className = 'form-field__input';
  input.type = inputType;
  input.id = id;
  input.name = id;
  if (required) input.setAttribute('required', '');
  if (autocomplete) input.setAttribute('autocomplete', autocomplete);
  if (maxLength) input.setAttribute('maxlength', String(maxLength));
  field.appendChild(input);

  const error = document.createElement('span');
  error.className = 'form-field__error';
  error.id = `${id}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  field.appendChild(error);

  return field;
}

/** Create a <textarea> form field with label and error span. */
function _createTextareaField(id, labelText, required, maxLength, rows = 5) {
  const field = document.createElement('div');
  field.className = 'form-field';

  const label = document.createElement('label');
  label.className = 'form-field__label';
  label.setAttribute('for', id);
  label.textContent = labelText;
  field.appendChild(label);

  const textarea = document.createElement('textarea');
  textarea.className = 'form-field__textarea';
  textarea.id = id;
  textarea.name = id;
  textarea.rows = rows;
  if (required) textarea.setAttribute('required', '');
  if (maxLength) textarea.setAttribute('maxlength', String(maxLength));
  field.appendChild(textarea);

  const error = document.createElement('span');
  error.className = 'form-field__error';
  error.id = `${id}-error`;
  error.setAttribute('role', 'alert');
  error.setAttribute('aria-live', 'polite');
  field.appendChild(error);

  return field;
}

/** Create an empty-state element. */
function _emptyState(message) {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.textContent = message;
  return el;
}

/**
 * Validate that a URL is safe to use as an href.
 * Only allows https:// URLs — blocks javascript:, data:, etc.
 *
 * @param {unknown} url
 * @returns {boolean}
 */
function _isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('{{')) return false;
  return url.startsWith('https://');
}
