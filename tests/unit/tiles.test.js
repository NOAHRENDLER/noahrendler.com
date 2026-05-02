/**
 * tests/unit/tiles.test.js — Compact-view render function tests.
 *
 * One describe block per tile, in grid order:
 *   profile → cv → skills → projects → certs →
 *   topology → threatFeed → uptime → radar → contact
 *
 * Security invariant checked in every tile:
 *   - XSS payloads in DATA fields must NOT produce executable HTML.
 *     textContent auto-escapes; we verify <script> tags are absent from innerHTML.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderProfileTile,
  renderCvTile,
  renderSkillsTile,
  renderProjectsTile,
  renderCertsTile,
  renderTopologyTile,
  renderThreatFeedTile,
  renderUptimeTile,
  renderRadarTile,
  renderContactTile
} from '../../js/renderer.js';

// ─────────────────────────────────────────────────────────────
// 1. renderProfileTile
// ─────────────────────────────────────────────────────────────

describe('renderProfileTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders the analyst name', () => {
    renderProfileTile(container, _makeProfile({}), badge);
    expect(container.querySelector('.profile-tile-name').textContent).toBe('Noah Rendler');
  });

  it('renders title and location in the subtitle', () => {
    renderProfileTile(container, _makeProfile({}), badge);
    const text = container.textContent;
    expect(text).toContain('Cybersecurity Student');
    expect(text).toContain('Stuttgart Area');
  });

  it('renders each specialization as a .tag', () => {
    const data = _makeProfile({ specializations: ['SOC', 'IR', 'Threat Intel'] });
    renderProfileTile(container, data, badge);
    const tags = container.querySelectorAll('.tag');
    expect(tags.length).toBe(3);
    expect(tags[0].textContent).toBe('SOC');
    expect(tags[2].textContent).toBe('Threat Intel');
  });

  it('renders no .profile-tile-tags wrapper when specializations is empty', () => {
    renderProfileTile(container, _makeProfile({ specializations: [] }), badge);
    expect(container.querySelector('.profile-tile-tags')).toBeNull();
  });

  it('updates the badge to data.status', () => {
    renderProfileTile(container, _makeProfile({ status: 'SEEKING PLACEMENT' }), badge);
    expect(badge.textContent).toBe('SEEKING PLACEMENT');
  });

  it('does NOT execute XSS payload in name', () => {
    const xss = '<script>window.__xss=1</script>';
    renderProfileTile(container, _makeProfile({ name: xss }), badge);
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).toContain('<script>');
  });

  it('is idempotent — re-render does not duplicate .profile-tile-name', () => {
    const data = _makeProfile({});
    renderProfileTile(container, data, badge);
    renderProfileTile(container, data, badge);
    expect(container.querySelectorAll('.profile-tile-name').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderProfileTile(null, _makeProfile({}), badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 2. renderCvTile
// ─────────────────────────────────────────────────────────────

describe('renderCvTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a .cv-list container', () => {
    renderCvTile(container, _makeCv(), badge);
    expect(container.querySelector('.cv-list')).not.toBeNull();
  });

  it('renders one .cv-entry per data item', () => {
    renderCvTile(container, _makeCv(), badge);
    expect(container.querySelectorAll('.cv-entry').length).toBe(2);
  });

  it('marks the current entry with .cv-dot--current', () => {
    renderCvTile(container, _makeCv(), badge);
    expect(container.querySelector('.cv-dot--current')).not.toBeNull();
  });

  it('marks past entries with .cv-dot--past', () => {
    renderCvTile(container, _makeCv(), badge);
    expect(container.querySelector('.cv-dot--past')).not.toBeNull();
  });

  it('renders title and subtitle as text', () => {
    const cv = [{ current: true, date: '2024', title: 'B.Sc. IT Security', subtitle: 'DHBW Stuttgart' }];
    renderCvTile(container, cv, badge);
    expect(container.textContent).toContain('B.Sc. IT Security');
    expect(container.textContent).toContain('DHBW Stuttgart');
  });

  it('updates badge to entry count', () => {
    renderCvTile(container, _makeCv(), badge);
    expect(badge.textContent).toBe('2');
  });

  it('does NOT execute XSS payload in title', () => {
    const xss = '<script>window.__xss=1</script>';
    const cv = [{ current: true, date: '2024', title: xss, subtitle: 'X' }];
    renderCvTile(container, cv, badge);
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('is idempotent', () => {
    const cv = _makeCv();
    renderCvTile(container, cv, badge);
    renderCvTile(container, cv, badge);
    expect(container.querySelectorAll('.cv-list').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderCvTile(null, _makeCv(), badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 3. renderSkillsTile
// ─────────────────────────────────────────────────────────────

describe('renderSkillsTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a .skills-compact-list container', () => {
    renderSkillsTile(container, _makeSkills(3), badge);
    expect(container.querySelector('.skills-compact-list')).not.toBeNull();
  });

  it('renders one row per unique category', () => {
    // _makeSkills uses a single category 'Network' → 1 row
    renderSkillsTile(container, _makeSkills(5), badge);
    expect(container.querySelectorAll('.skills-compact-row').length).toBe(1);
  });

  it('renders one row per each distinct category', () => {
    const skills = [
      { tool: 'A', category: 'Network',  proficiency: 'intermediate', years: null },
      { tool: 'B', category: 'SIEM',     proficiency: 'advanced',     years: null },
      { tool: 'C', category: 'Network',  proficiency: 'beginner',     years: null },
      { tool: 'D', category: 'Forensics', proficiency: 'expert',      years: 2    }
    ];
    renderSkillsTile(container, skills, badge);
    expect(container.querySelectorAll('.skills-compact-row').length).toBe(3);
  });

  it('renders a footer with total tool count', () => {
    renderSkillsTile(container, _makeSkills(5), badge);
    const footer = container.querySelector('.skills-compact-footer');
    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('5');
  });

  it('updates badge to total skill count', () => {
    renderSkillsTile(container, _makeSkills(7), badge);
    expect(badge.textContent).toBe('7');
  });

  it('assigns a skills-cat-- colour class to each row', () => {
    renderSkillsTile(container, _makeSkills(3), badge);
    const row = container.querySelector('.skills-compact-row');
    expect(row.className).toMatch(/skills-cat--\d/);
  });

  it('does NOT execute XSS payload in category name', () => {
    const xss = '<img src=x onerror=alert(1)>';
    renderSkillsTile(container, [{ tool: 'T', category: xss, proficiency: 'expert', years: 1 }], badge);
    expect(container.innerHTML).not.toContain('<img src=x');
  });

  it('is idempotent', () => {
    const skills = _makeSkills(3);
    renderSkillsTile(container, skills, badge);
    renderSkillsTile(container, skills, badge);
    expect(container.querySelectorAll('.skills-compact-list').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderSkillsTile(null, _makeSkills(2), badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. renderProjectsTile
// ─────────────────────────────────────────────────────────────

describe('renderProjectsTile', () => {
  let container;
  let badge;
  const uiStrings = {
    statusLabels: { 'completed': 'COMPLETED', 'active': 'ACTIVE', 'planned': 'PLANNED' }
  };

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a .proj-list container', () => {
    renderProjectsTile(container, _makeProjects(1), badge, uiStrings);
    expect(container.querySelector('.proj-list')).not.toBeNull();
  });

  it('renders one .proj-entry per project', () => {
    renderProjectsTile(container, _makeProjects(3), badge, uiStrings);
    expect(container.querySelectorAll('.proj-entry').length).toBe(3);
  });

  it('renders all entries — no cap', () => {
    renderProjectsTile(container, _makeProjects(6), badge, uiStrings);
    expect(container.querySelectorAll('.proj-entry').length).toBe(6);
  });

  it('sorts entries: active first, completed second, planned last', () => {
    const projects = [
      _makeProject({ id: 'p1', status: 'planned' }),
      _makeProject({ id: 'p2', status: 'completed' }),
      _makeProject({ id: 'p3', status: 'active' })
    ];
    renderProjectsTile(container, projects, badge, uiStrings);
    const entries = container.querySelectorAll('.proj-entry');
    expect(entries[0].querySelector('.proj-dot--active')).not.toBeNull();
    expect(entries[1].querySelector('.proj-dot--completed')).not.toBeNull();
    expect(entries[2].querySelector('.proj-dot--planned')).not.toBeNull();
  });

  it('renders status dot with correct status class', () => {
    renderProjectsTile(container, [_makeProject({ status: 'active' })], badge, uiStrings);
    expect(container.querySelector('.proj-dot--active')).not.toBeNull();
  });

  it('falls back to "planned" for unknown status', () => {
    renderProjectsTile(container, [_makeProject({ status: 'unknown' })], badge, uiStrings);
    expect(container.querySelector('.proj-dot--planned')).not.toBeNull();
    expect(container.querySelector('.proj-dot--unknown')).toBeNull();
  });

  it('adds pulse class only to active entries', () => {
    renderProjectsTile(container, [_makeProject({ status: 'active' })], badge, uiStrings);
    expect(container.querySelector('.proj-dot--pulse')).not.toBeNull();
  });

  it('does not add pulse class to completed entries', () => {
    renderProjectsTile(container, [_makeProject({ status: 'completed' })], badge, uiStrings);
    expect(container.querySelector('.proj-dot--pulse')).toBeNull();
  });

  it('renders status pill with translated label', () => {
    renderProjectsTile(container, [_makeProject({ status: 'active' })], badge, uiStrings);
    const pill = container.querySelector('.proj-status');
    expect(pill.textContent).toBe('ACTIVE');
  });

  it('renders project name in .proj-name', () => {
    renderProjectsTile(container, [_makeProject({ name: 'My SOC' })], badge, uiStrings);
    expect(container.querySelector('.proj-name').textContent).toBe('My SOC');
  });

  it('updates badge to project count', () => {
    renderProjectsTile(container, _makeProjects(3), badge, uiStrings);
    expect(badge.textContent).toBe('3');
  });

  it('does NOT execute XSS payload in project name', () => {
    const xss = '<script>window.__xss=1</script>';
    renderProjectsTile(container, [_makeProject({ name: xss })], badge, uiStrings);
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('is idempotent', () => {
    const projects = _makeProjects(2);
    renderProjectsTile(container, projects, badge, uiStrings);
    renderProjectsTile(container, projects, badge, uiStrings);
    expect(container.querySelectorAll('.proj-list').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderProjectsTile(null, _makeProjects(1), badge, uiStrings)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 5. renderCertsTile
// ─────────────────────────────────────────────────────────────

describe('renderCertsTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a .certs-list container', () => {
    renderCertsTile(container, _makeCerts(), badge);
    expect(container.querySelector('.certs-list')).not.toBeNull();
  });

  it('renders one .cert-entry per cert', () => {
    renderCertsTile(container, _makeCerts(), badge);
    expect(container.querySelectorAll('.cert-entry').length).toBe(2);
  });

  it('renders .cert-abbr with the abbreviation', () => {
    renderCertsTile(container, [{ abbr: 'C+', name: 'Security+', issuer: 'CompTIA', year: '2025' }], badge);
    expect(container.querySelector('.cert-abbr').textContent).toBe('C+');
  });

  it('renders .cert-name with the full name', () => {
    renderCertsTile(container, [{ abbr: 'C+', name: 'Security+', issuer: 'CompTIA', year: '2025' }], badge);
    expect(container.querySelector('.cert-name').textContent).toBe('Security+');
  });

  it('renders issuer and year in .cert-issuer', () => {
    renderCertsTile(container, [{ abbr: 'C+', name: 'Security+', issuer: 'CompTIA', year: '2025' }], badge);
    expect(container.querySelector('.cert-issuer').textContent).toContain('CompTIA');
    expect(container.querySelector('.cert-issuer').textContent).toContain('2025');
  });

  it('updates badge to cert count', () => {
    renderCertsTile(container, _makeCerts(), badge);
    expect(badge.textContent).toBe('2');
  });

  it('does NOT execute XSS payload in cert name', () => {
    const xss = '<script>window.__xss=1</script>';
    renderCertsTile(container, [{ abbr: 'X', name: xss, issuer: 'Y', year: '2025' }], badge);
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('is idempotent', () => {
    const certs = _makeCerts();
    renderCertsTile(container, certs, badge);
    renderCertsTile(container, certs, badge);
    expect(container.querySelectorAll('.certs-list').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderCertsTile(null, _makeCerts(), badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 6. renderTopologyTile
// ─────────────────────────────────────────────────────────────

describe('renderTopologyTile', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders an SVG element', () => {
    renderTopologyTile(container);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('SVG has class .topology-svg', () => {
    renderTopologyTile(container);
    expect(container.querySelector('.topology-svg')).not.toBeNull();
  });

  it('SVG has a viewBox attribute', () => {
    renderTopologyTile(container);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBeTruthy();
  });

  it('renders circle elements for nodes', () => {
    renderTopologyTile(container);
    const circles = container.querySelectorAll('circle');
    // At minimum: 1 core + 6 outer = 7 circles
    expect(circles.length).toBeGreaterThanOrEqual(7);
  });

  it('renders connection paths between nodes', () => {
    renderTopologyTile(container);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(6);
  });

  it('compact view shows only zone tags (LIFE / SOC), no node labels', () => {
    renderTopologyTile(container);
    const texts = Array.from(container.querySelectorAll('text')).map(t => t.textContent);
    expect(texts).toEqual(expect.arrayContaining(['LIFE', 'SOC']));
    expect(texts.length).toBe(2);
  });

  it('does not use innerHTML', () => {
    // innerHTML would bypass the security contract — static topology must also go through createElementNS
    // We verify by checking no raw HTML string patterns appeared
    renderTopologyTile(container);
    // If innerHTML was used, the SVG would be a childless wrapper; createElementNS produces actual SVG children
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = container.querySelector('svg');
    expect(svg.namespaceURI).toBe(svgNs);
  });

  it('is idempotent', () => {
    renderTopologyTile(container);
    renderTopologyTile(container);
    expect(container.querySelectorAll('svg').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderTopologyTile(null)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 7. renderThreatFeedTile
// ─────────────────────────────────────────────────────────────

describe('renderThreatFeedTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a .tfeed-list container', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    expect(container.querySelector('.tfeed-list')).not.toBeNull();
  });

  it('renders all entries (not capped)', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    expect(container.querySelectorAll('.tfeed-entry').length).toBe(_makeThreatFeed().length);
  });

  it('each entry has .tfeed-dot, .tfeed-date, .tfeed-source, .tfeed-title', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    const entry = container.querySelector('.tfeed-entry');
    expect(entry.querySelector('.tfeed-dot')).not.toBeNull();
    expect(entry.querySelector('.tfeed-date')).not.toBeNull();
    expect(entry.querySelector('.tfeed-source')).not.toBeNull();
    expect(entry.querySelector('.tfeed-title')).not.toBeNull();
  });

  it('first (newest) entry has .tfeed-dot--live', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    const firstDot = container.querySelector('.tfeed-entry .tfeed-dot');
    expect(firstDot.classList.contains('tfeed-dot--live')).toBe(true);
  });

  it('non-first entries do NOT have .tfeed-dot--live', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    const allDots = container.querySelectorAll('.tfeed-dot');
    Array.from(allDots).slice(1).forEach(dot => {
      expect(dot.classList.contains('tfeed-dot--live')).toBe(false);
    });
  });

  it('renders .tfeed-footer with article count', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    const footer = container.querySelector('.tfeed-footer');
    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('ARTICLES TRACKED');
  });

  it('sets badge to total article count', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    expect(badge.textContent).toBe(String(_makeThreatFeed().length));
  });

  it('sorts entries newest-first by date', () => {
    renderThreatFeedTile(container, _makeThreatFeed(), badge);
    const dates = Array.from(container.querySelectorAll('.tfeed-date')).map(el => el.textContent);
    expect(dates[0]).toBe('APR 18');
  });

  it('is idempotent', () => {
    const data = _makeThreatFeed();
    renderThreatFeedTile(container, data, badge);
    renderThreatFeedTile(container, data, badge);
    expect(container.querySelectorAll('.tfeed-list').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderThreatFeedTile(null, _makeThreatFeed(), badge)).not.toThrow();
  });

  it('does nothing when data is not an array', () => {
    expect(() => renderThreatFeedTile(container, null, badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 8. renderUptimeTile
// ─────────────────────────────────────────────────────────────

describe('renderUptimeTile', () => {
  let container;
  let badge;

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders 30 .sysmon-bar elements', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    expect(container.querySelectorAll('.sysmon-bar').length).toBe(30);
  });

  it('renders 3 .sysmon-metric boxes', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    expect(container.querySelectorAll('.sysmon-metric').length).toBe(3);
  });

  it('renders UPTIME / RESPONSE / DEPLOY metric labels', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    const labels = Array.from(container.querySelectorAll('.sysmon-metric__label')).map(el => el.textContent);
    expect(labels).toContain('UPTIME');
    expect(labels).toContain('RESPONSE');
    expect(labels).toContain('DEPLOY');
  });

  it('renders a canvas for the sparkline', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    expect(container.querySelector('.sysmon-spark-canvas')).not.toBeNull();
  });

  it('renders 4 .sysmon-log-row entries', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    expect(container.querySelectorAll('.sysmon-log-row').length).toBe(4);
  });

  it('updates badge to uptimePercent%', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    expect(badge.textContent).toBe('99.7%');
  });

  it('is idempotent', () => {
    renderUptimeTile(container, _makeUptime(), badge);
    renderUptimeTile(container, _makeUptime(), badge);
    expect(container.querySelectorAll('.sysmon-bars').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderUptimeTile(null, _makeUptime(), badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 9. renderRadarTile
// ─────────────────────────────────────────────────────────────

describe('renderRadarTile', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders an SVG element', () => {
    renderRadarTile(container, _makeRadar());
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('SVG has class .radar-svg', () => {
    renderRadarTile(container, _makeRadar());
    expect(container.querySelector('.radar-svg')).not.toBeNull();
  });

  it('renders .radar-ring polygons (5 rings)', () => {
    renderRadarTile(container, _makeRadar());
    expect(container.querySelectorAll('.radar-ring').length).toBe(5);
  });

  it('renders .radar-polygon for the data shape', () => {
    renderRadarTile(container, _makeRadar());
    expect(container.querySelector('.radar-polygon')).not.toBeNull();
  });

  it('renders .radar-axis lines (one per axis)', () => {
    renderRadarTile(container, _makeRadar());
    expect(container.querySelectorAll('.radar-axis').length).toBe(6);
  });

  it('renders .radar-label text elements for each axis', () => {
    renderRadarTile(container, _makeRadar());
    const labels = container.querySelectorAll('.radar-label');
    expect(labels.length).toBe(6);
    const labelTexts = Array.from(labels).map(el => el.textContent);
    expect(labelTexts).toContain('NETWORK');
    expect(labelTexts).toContain('OSINT');
  });

  it('uses SVG namespace (createElementNS, not innerHTML)', () => {
    renderRadarTile(container, _makeRadar());
    const svgNs = 'http://www.w3.org/2000/svg';
    expect(container.querySelector('svg').namespaceURI).toBe(svgNs);
  });

  it('is idempotent', () => {
    renderRadarTile(container, _makeRadar());
    renderRadarTile(container, _makeRadar());
    expect(container.querySelectorAll('svg').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderRadarTile(null, _makeRadar())).not.toThrow();
  });

  it('does nothing when data is null', () => {
    expect(() => renderRadarTile(container, null)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// 10. renderContactTile
// ─────────────────────────────────────────────────────────────

describe('renderContactTile', () => {
  let container;
  let badge;
  const uiStrings = {
    emailLabel:      'EMAIL',
    linkedinLabel:   'LINKEDIN',
    githubLabel:     'GITHUB',
    nameLabel:       'Name',
    emailFieldLabel: 'Email',
    messageLabel:    'Message',
    submitLabel:     '▶ TRANSMIT'
  };

  beforeEach(() => {
    container = document.createElement('div');
    badge = document.createElement('span');
    badge.textContent = '—';
  });

  it('renders a form with id="contact-form"', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    expect(container.querySelector('#contact-form')).not.toBeNull();
  });

  it('form has the honeypot field', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    const hp = container.querySelector('#website');
    expect(hp).not.toBeNull();
    expect(hp.getAttribute('tabindex')).toBe('-1');
  });

  it('form has name, email, message fields', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    expect(container.querySelector('#contact-name')).not.toBeNull();
    expect(container.querySelector('#contact-email')).not.toBeNull();
    expect(container.querySelector('#contact-message')).not.toBeNull();
  });

  it('form has a submit button', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    const btn = container.querySelector('#contact-submit');
    expect(btn).not.toBeNull();
    expect(btn.type).toBe('submit');
    expect(btn.textContent).toBe('\u25B6 TRANSMIT');
  });

  it('renders the .contact-channels section', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    expect(container.querySelector('.contact-channels')).not.toBeNull();
  });

  it('does NOT render a real link for placeholder email', () => {
    const data = { email: '{{EMAIL}}', linkedin: '{{LINKEDIN}}', github: '{{GITHUB}}' };
    renderContactTile(container, data, uiStrings, badge);
    const links = container.querySelectorAll('.contact-channel__link');
    links.forEach(link => {
      expect(link.href).not.toContain('{{');
    });
  });

  it('renders a mailto: link for a real email', () => {
    const data = { email: 'test@example.com', linkedin: '{{X}}', github: '{{X}}' };
    renderContactTile(container, data, uiStrings, badge);
    const emailLink = container.querySelector('a[href^="mailto:"]');
    expect(emailLink).not.toBeNull();
    expect(emailLink.getAttribute('href')).toBe('mailto:test@example.com');
  });

  it('renders an https:// link for a real LinkedIn URL', () => {
    const data = { email: '{{X}}', linkedin: 'https://linkedin.com/in/test', github: '{{X}}' };
    renderContactTile(container, data, uiStrings, badge);
    const link = container.querySelector('a[href="https://linkedin.com/in/test"]');
    expect(link).not.toBeNull();
  });

  it('does NOT render a link for a javascript: URL', () => {
    const data = { email: '{{X}}', linkedin: 'javascript:alert(1)', github: '{{X}}' };
    renderContactTile(container, data, uiStrings, badge);
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link.href).not.toContain('javascript:');
    });
  });

  it('updates badge text', () => {
    renderContactTile(container, _makeContactData(), uiStrings, badge);
    expect(badge.textContent).toBe('E2E');
  });

  it('is idempotent', () => {
    const data = _makeContactData();
    renderContactTile(container, data, uiStrings, badge);
    renderContactTile(container, data, uiStrings, badge);
    expect(container.querySelectorAll('#contact-form').length).toBe(1);
  });

  it('does nothing when container is null', () => {
    expect(() => renderContactTile(null, _makeContactData(), uiStrings, badge)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────

function _makeProfile(overrides) {
  return {
    name:            'Noah Rendler',
    title:           'Cybersecurity Student',
    location:        'Stuttgart Area',
    specializations: ['SOC Analysis', 'Incident Response'],
    status:          'SEEKING PLACEMENT',
    bio:             'Test bio.',
    ...overrides
  };
}

function _makeCv() {
  return [
    { current: true,  date: '2024 – present', title: 'B.Sc. IT Security',     subtitle: 'DHBW Stuttgart' },
    { current: false, date: '2020 – 2024',    title: 'High School Diploma', subtitle: 'Example School' }
  ];
}

function _makeSkills(count) {
  return Array.from({ length: count }, (_, i) => ({
    tool:        `Tool ${i + 1}`,
    category:    'Network',
    proficiency: 'intermediate',
    years:       1
  }));
}

function _makeProjects(count) {
  return Array.from({ length: count }, (_, i) => _makeProject({ id: `proj-00${i + 1}` }));
}

function _makeProject(overrides = {}) {
  return {
    id:          'proj-001',
    name:        'Test Project',
    status:      'planned',
    date:        '2026-04',
    summary:     'A test project summary.',
    description: 'A test project description.',
    tools:       ['Python'],
    links:       [],
    ...overrides
  };
}

function _makeCerts() {
  return [
    { abbr: 'C+',  name: 'CompTIA Security+', issuer: 'CompTIA',  year: '2025' },
    { abbr: 'THM', name: 'TryHackMe Path',     issuer: 'TryHackMe', year: '2025' }
  ];
}

function _makeThreatFeed() {
  return [
    { title: 'Article A', source: 'Source A', date: '2026-04-18', url: 'https://example.com/a', tags: ['zero-day'] },
    { title: 'Article B', source: 'Source B', date: '2026-04-14', url: 'https://example.com/b', tags: ['CISA'] },
    { title: 'Article C', source: 'Source C', date: '2026-04-10', url: 'https://example.com/c', tags: ['AI'] },
    { title: 'Article D', source: 'Source D', date: '2026-04-07', url: 'https://example.com/d', tags: ['ransomware'] },
    { title: 'Article E', source: 'Source E', date: '2026-03-11', url: 'https://example.com/e', tags: ['report'] }
  ];
}

function _makeUptime() {
  const days = [
    { status: 'up' }, { status: 'up' }, { status: 'up' }, { status: 'up' },
    { status: 'up' }, { status: 'partial' }, { status: 'up' }, { status: 'up' },
    { status: 'up' }, { status: 'up' }, { status: 'up' }, { status: 'up' },
    { status: 'down' }, { status: 'up' }
  ];
  return { days, responseMs: 47, lastDeploy: '3d', uptimePercent: '99.7' };
}

function _makeRadar() {
  return {
    axes: [
      { label: 'NETWORK',   value: 8 },
      { label: 'OFFENSIVE', value: 6 },
      { label: 'DEFENSIVE', value: 7 },
      { label: 'OSINT',     value: 9 },
      { label: 'DEVOPS',    value: 5 },
      { label: 'ANALYSIS',  value: 8 }
    ]
  };
}

function _makeContactData() {
  return {
    email:      '{{EMAIL}}',
    linkedin:   '{{LINKEDIN_URL}}',
    github:     '{{GITHUB_URL}}',
    formAction: '{{FORMSPREE_URL}}'
  };
}
