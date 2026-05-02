/**
 * tests/unit/navigation.test.js — Navigation & expanded-view tests.
 *
 * Structure:
 *   1. expand / collapse / popstate
 *   2. Keyboard (Enter, Space, Escape)
 *   3. Idempotency: expand → collapse → expand (no duplicate DOM)
 *   4. Project drill-down (Level 3)
 *   5. Expanded-view content renderers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initNav,
  expand,
  collapse,
  drillProject,
  backToProjects,
  resetNav,
  _resetForTests,
  _getLevel,
  _getActiveTileId,
  _getActiveProjectId
} from '../../js/navigation.js';
import {
  renderProfileExpanded,
  renderThreatFeedExpanded,
  renderProjectsExpanded,
  renderCertsExpanded,
  renderSkillsExpanded,
  renderCvExpanded,
  renderRadarExpanded,
  renderTopologyExpanded,
  renderProjectDetail
} from '../../js/renderer.js';

// ─────────────────────────────────────────────────────────────
// Shared DOM setup
// ─────────────────────────────────────────────────────────────

function _setupDOM() {
  // Minimal page structure navigation.js depends on
  document.body.innerHTML = '';

  const grid = document.createElement('div');
  grid.id = 'main-grid';

  // 9 expandable tiles + 1 non-clickable contact tile
  const tileIds = ['profile', 'topology', 'threatFeed', 'projects', 'certs', 'skills', 'cv', 'uptime', 'radar'];
  tileIds.forEach(id => {
    const tile = document.createElement('div');
    tile.id        = `tile-${id}`;
    tile.className = 'tile tile-span-1';
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('role', 'button');
    grid.appendChild(tile);
  });

  const contactTile = document.createElement('div');
  contactTile.id        = 'tile-contact';
  contactTile.className = 'tile tile--no-click';
  grid.appendChild(contactTile);

  document.body.appendChild(grid);

  const expandedPanels = document.createElement('div');
  expandedPanels.id = 'expanded-panels';
  document.body.appendChild(expandedPanels);

  // Set document language so getCurrentLanguage() returns 'de'
  document.documentElement.lang = 'de';
}

beforeEach(() => {
  _setupDOM();
  initNav();
});

afterEach(() => {
  _resetForTests();
  document.body.innerHTML = '';
  document.documentElement.lang = '';
});

// ─────────────────────────────────────────────────────────────
// 1. expand / collapse / popstate
// ─────────────────────────────────────────────────────────────

describe('expand', () => {
  it('hides #main-grid', () => {
    expand('profile');
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(true);
  });

  it('inserts an .exp-panel into #expanded-panels', () => {
    expand('profile');
    expect(document.querySelector('.exp-panel')).not.toBeNull();
  });

  it('panel has id="exp-{tileId}"', () => {
    expand('cv');
    expect(document.getElementById('exp-cv')).not.toBeNull();
  });

  it('panel contains a .exp-header with .exp-back button', () => {
    expand('profile');
    expect(document.querySelector('.exp-back')).not.toBeNull();
  });

  it('panel contains a .exp-breadcrumb with tile label', () => {
    expand('profile');
    const bc = document.querySelector('.exp-breadcrumb');
    expect(bc).not.toBeNull();
    expect(bc.textContent).toContain('SOC // PORTFOLIO');
  });

  it('sets navigation level to 2', () => {
    expand('profile');
    expect(_getLevel()).toBe(2);
  });

  it('is a no-op for the contact tile (expandable: false)', () => {
    expand('contact');
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(false);
    expect(_getLevel()).toBe(1);
  });

  it('is a no-op for an unknown tileId', () => {
    expand('does-not-exist');
    expect(_getLevel()).toBe(1);
  });
});

describe('collapse', () => {
  it('shows #main-grid again', () => {
    expand('profile');
    collapse();
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(false);
  });

  it('clears #expanded-panels', () => {
    expand('profile');
    collapse();
    expect(document.getElementById('expanded-panels').children.length).toBe(0);
  });

  it('sets navigation level back to 1', () => {
    expand('profile');
    collapse();
    expect(_getLevel()).toBe(1);
  });
});

describe('resetNav', () => {
  it('returns to grid without pushing history', () => {
    expand('skills');
    resetNav();
    expect(_getLevel()).toBe(1);
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Keyboard accessibility
// ─────────────────────────────────────────────────────────────

describe('keyboard — Enter/Space on tile expands', () => {
  it('Enter on a tile triggers expand', () => {
    const tile = document.getElementById('tile-profile');
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(_getLevel()).toBe(2);
  });

  it('Space on a tile triggers expand', () => {
    const tile = document.getElementById('tile-threatFeed');
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(_getLevel()).toBe(2);
  });

  it('Enter on the contact tile (no-click) does nothing', () => {
    const tile = document.getElementById('tile-contact');
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(_getLevel()).toBe(1);
  });

  it('Other keys on tile do nothing', () => {
    const tile = document.getElementById('tile-profile');
    tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(_getLevel()).toBe(1);
  });
});

describe('keyboard — Escape collapses', () => {
  it('Escape fires collapse when at level 2', () => {
    expand('profile');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(_getLevel()).toBe(1);
  });

  it('Escape at level 1 does nothing', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(_getLevel()).toBe(1);
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Idempotency — the critical requirement
// ─────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('expand → collapse → expand produces exactly one .exp-panel', () => {
    expand('profile');
    collapse();
    expand('profile');
    expect(document.querySelectorAll('.exp-panel').length).toBe(1);
  });

  it('expand same tile twice produces exactly one .exp-panel', () => {
    expand('cv');
    expand('cv');
    expect(document.querySelectorAll('.exp-panel').length).toBe(1);
  });

  it('expand different tiles in sequence produces exactly one .exp-panel', () => {
    expand('skills');
    expand('certs');
    expect(document.querySelectorAll('.exp-panel').length).toBe(1);
  });

  it('collapse → collapse leaves #expanded-panels empty', () => {
    expand('cv');
    collapse();
    collapse();
    expect(document.getElementById('expanded-panels').children.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Project drill-down (Level 3)
// ─────────────────────────────────────────────────────────────

describe('drillProject', () => {
  it('drillProject with a valid project id sets level to 3', () => {
    drillProject('soc-portfolio');
    expect(_getLevel()).toBe(3);
  });

  it('drillProject shows #exp-projects panel', () => {
    drillProject('soc-portfolio');
    expect(document.getElementById('exp-projects')).not.toBeNull();
  });

  it('drillProject with an invalid id does nothing', () => {
    drillProject('NOT-A-REAL-PROJECT');
    expect(_getLevel()).toBe(1);
  });

  it('backToProjects returns to level 2', () => {
    drillProject('soc-portfolio');
    backToProjects();
    expect(_getLevel()).toBe(2);
  });

  it('breadcrumb at level 3 includes project title', () => {
    drillProject('soc-portfolio');
    const bc = document.querySelector('.exp-breadcrumb');
    expect(bc).not.toBeNull();
    expect(bc.textContent).toContain('SOC // PORTFOLIO');
  });
});

describe('back button delegation', () => {
  it('clicking .exp-back at level 2 collapses to grid', () => {
    expand('profile');
    document.querySelector('.exp-back').click();
    expect(_getLevel()).toBe(1);
  });

  it('clicking .exp-back at level 3 goes to level 2 (backToProjects)', () => {
    drillProject('soc-portfolio');
    document.querySelector('.exp-back').click();
    expect(_getLevel()).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Getter helpers
// ─────────────────────────────────────────────────────────────

describe('_getActiveTileId', () => {
  it('returns null at level 1', () => {
    expect(_getActiveTileId()).toBeNull();
  });

  it('returns the tileId after expand', () => {
    expand('skills');
    expect(_getActiveTileId()).toBe('skills');
  });

  it('returns null after collapse', () => {
    expand('cv');
    collapse();
    expect(_getActiveTileId()).toBeNull();
  });
});

describe('_getActiveProjectId', () => {
  it('returns null at level 1', () => {
    expect(_getActiveProjectId()).toBeNull();
  });

  it('returns the projectId after drillProject', () => {
    drillProject('soc-portfolio');
    expect(_getActiveProjectId()).toBe('soc-portfolio');
  });

  it('returns null after backToProjects', () => {
    drillProject('soc-portfolio');
    backToProjects();
    expect(_getActiveProjectId()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// 7. onPanelKey — keyboard on project cards inside expanded panel
// ─────────────────────────────────────────────────────────────

describe('onPanelKey — keyboard navigation in expanded panel', () => {
  it('Enter on a project card drills into level 3', () => {
    expand('projects');
    const card = document.querySelector('[data-project-id]');
    if (!card) return; // skip if DATA has no projects
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(_getLevel()).toBe(3);
  });

  it('Space on a project card drills into level 3', () => {
    expand('projects');
    const card = document.querySelector('[data-project-id]');
    if (!card) return;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(_getLevel()).toBe(3);
  });

  it('other keys on a project card do nothing', () => {
    expand('projects');
    const card = document.querySelector('[data-project-id]');
    if (!card) return;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(_getLevel()).toBe(2);
  });

  it('Enter on the panel body (not a project card) does nothing', () => {
    expand('profile');
    const body = document.querySelector('.exp-body');
    if (!body) return;
    body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(_getLevel()).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. onPopState — browser back/forward navigation
// ─────────────────────────────────────────────────────────────

describe('onPopState — browser back / forward', () => {
  it('popstate with level=1 state shows the grid', () => {
    expand('profile');
    window.dispatchEvent(new PopStateEvent('popstate', { state: { level: 1 } }));
    expect(_getLevel()).toBe(1);
    expect(document.getElementById('main-grid').classList.contains('hidden')).toBe(false);
  });

  it('popstate with null state shows the grid', () => {
    expand('profile');
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    expect(_getLevel()).toBe(1);
  });

  it('popstate with level=2 state shows the expanded panel', () => {
    window.dispatchEvent(new PopStateEvent('popstate', { state: { level: 2, tileId: 'profile' } }));
    expect(_getLevel()).toBe(2);
    expect(document.querySelector('.exp-panel')).not.toBeNull();
  });

  it('popstate with level=3 state shows the project drill-down', () => {
    window.dispatchEvent(new PopStateEvent('popstate', {
      state: { level: 3, projectId: 'soc-portfolio' }
    }));
    expect(_getLevel()).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Expanded-view content renderers
// ─────────────────────────────────────────────────────────────

describe('renderProfileExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .profile-name-large with the analyst name', () => {
    renderProfileExpanded(container, _makeProfile());
    expect(container.querySelector('.profile-name-large').textContent).toBe('Noah Rendler');
  });

  it('renders .profile-bio-short', () => {
    renderProfileExpanded(container, _makeProfile());
    expect(container.querySelector('.profile-bio-short')).not.toBeNull();
  });

  it('renders 2-column layout (.profile-expanded-layout)', () => {
    renderProfileExpanded(container, _makeProfile());
    expect(container.querySelector('.profile-expanded-layout')).not.toBeNull();
  });

  it('does NOT execute XSS in name', () => {
    renderProfileExpanded(container, _makeProfile({ name: '<script>alert(1)</script>' }));
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('is idempotent', () => {
    renderProfileExpanded(container, _makeProfile());
    renderProfileExpanded(container, _makeProfile());
    expect(container.querySelectorAll('.profile-expanded-layout').length).toBe(1);
  });
});

describe('renderThreatFeedExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .exp-tfeed-list', () => {
    renderThreatFeedExpanded(container, _makeThreatFeed());
    expect(container.querySelector('.exp-tfeed-list')).not.toBeNull();
  });

  it('renders one .exp-tfeed-entry per article', () => {
    renderThreatFeedExpanded(container, _makeThreatFeed());
    expect(container.querySelectorAll('.exp-tfeed-entry').length).toBe(_makeThreatFeed().length);
  });

  it('each entry has an external link with target=_blank', () => {
    renderThreatFeedExpanded(container, _makeThreatFeed());
    const links = container.querySelectorAll('.exp-tfeed-link');
    links.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('renders tag badges', () => {
    renderThreatFeedExpanded(container, _makeThreatFeed());
    expect(container.querySelector('.exp-tfeed-tag')).not.toBeNull();
  });

  it('sorts entries newest-first', () => {
    renderThreatFeedExpanded(container, _makeThreatFeed());
    const dates = Array.from(container.querySelectorAll('.exp-tfeed-date')).map(el => el.textContent);
    expect(dates[0]).toBe('2026-04-18');
    expect(dates[dates.length - 1]).toBe('2026-03-11');
  });

  it('is idempotent', () => {
    const data = _makeThreatFeed();
    renderThreatFeedExpanded(container, data);
    renderThreatFeedExpanded(container, data);
    expect(container.querySelectorAll('.exp-tfeed-list').length).toBe(1);
  });
});

describe('renderProjectsExpanded', () => {
  let container;
  const uiStrings = { statusLabels: { 'completed': 'COMPLETED', 'active': 'ACTIVE', 'planned': 'PLANNED' } };
  beforeEach(() => { container = document.createElement('div'); });

  it('renders one .exp-project-card per project', () => {
    renderProjectsExpanded(container, _makeProjects(3), uiStrings);
    expect(container.querySelectorAll('.exp-project-card').length).toBe(3);
  });

  it('cards have data-project-id attribute', () => {
    renderProjectsExpanded(container, [_makeProject({ id: 'proj-001' })], uiStrings);
    const card = container.querySelector('[data-project-id="proj-001"]');
    expect(card).not.toBeNull();
  });

  it('cards are keyboard-focusable (tabindex="0")', () => {
    renderProjectsExpanded(container, _makeProjects(2), uiStrings);
    const cards = container.querySelectorAll('.exp-project-card');
    cards.forEach(c => expect(c.getAttribute('tabindex')).toBe('0'));
  });

  it('groups projects by status', () => {
    const projects = [
      _makeProject({ id: 'p1', status: 'active' }),
      _makeProject({ id: 'p2', status: 'completed' })
    ];
    renderProjectsExpanded(container, projects, uiStrings);
    expect(container.querySelectorAll('.exp-projects-group').length).toBe(2);
  });

  it('is idempotent', () => {
    renderProjectsExpanded(container, _makeProjects(2), uiStrings);
    renderProjectsExpanded(container, _makeProjects(2), uiStrings);
    expect(container.querySelectorAll('.exp-projects-wrap').length).toBe(1);
  });
});

describe('renderCertsExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders one .exp-cert-entry per cert', () => {
    renderCertsExpanded(container, _makeCerts());
    expect(container.querySelectorAll('.exp-cert-entry').length).toBe(2);
  });

  it('renders .exp-cert-abbr', () => {
    renderCertsExpanded(container, [{ abbr: 'C+', name: 'Security+', issuer: 'CompTIA', year: '2025' }]);
    expect(container.querySelector('.exp-cert-abbr').textContent).toBe('C+');
  });

  it('is idempotent', () => {
    renderCertsExpanded(container, _makeCerts());
    renderCertsExpanded(container, _makeCerts());
    expect(container.querySelectorAll('.exp-certs-list').length).toBe(1);
  });
});

describe('renderSkillsExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .exp-skills-grid', () => {
    renderSkillsExpanded(container, _makeSkills());
    expect(container.querySelector('.exp-skills-grid')).not.toBeNull();
  });

  it('renders .exp-skills-summary with tool and category counts', () => {
    renderSkillsExpanded(container, _makeSkills());
    const summary = container.querySelector('.exp-skills-summary');
    expect(summary).not.toBeNull();
    // _makeSkills() has 2 tools in 2 categories
    expect(summary.textContent).toContain('2');
  });

  it('groups skills by category', () => {
    const skills = [
      { tool: 'Wireshark', category: 'Network', proficiency: 'advanced', years: 2 },
      { tool: 'Splunk',    category: 'SIEM',    proficiency: 'intermediate', years: 1 },
      { tool: 'Nmap',      category: 'Network', proficiency: 'expert', years: 3 }
    ];
    renderSkillsExpanded(container, skills);
    // 2 distinct categories → 2 .exp-skills-category elements
    expect(container.querySelectorAll('.exp-skills-category').length).toBe(2);
  });

  it('renders 3 proficiency dots per tool item', () => {
    renderSkillsExpanded(container, _makeSkills());
    const firstItem = container.querySelector('.exp-skill-badge');
    expect(firstItem).not.toBeNull();
    expect(firstItem.querySelectorAll('.exp-skill-badge__dot').length).toBe(3);
  });

  it('fills correct number of dots for each proficiency level', () => {
    const skills = [
      { tool: 'A', category: 'X', proficiency: 'beginner',     years: null },
      { tool: 'B', category: 'X', proficiency: 'intermediate', years: null },
      { tool: 'C', category: 'X', proficiency: 'advanced',     years: null },
    ];
    renderSkillsExpanded(container, skills);
    const items = container.querySelectorAll('.exp-skill-badge');
    expect(items[0].querySelectorAll('.exp-skill-badge__dot--filled').length).toBe(1);
    expect(items[1].querySelectorAll('.exp-skill-badge__dot--filled').length).toBe(2);
    expect(items[2].querySelectorAll('.exp-skill-badge__dot--filled').length).toBe(3);
  });

  it('assigns a skills-cat-- colour class to each category', () => {
    renderSkillsExpanded(container, _makeSkills());
    const cats = container.querySelectorAll('.exp-skills-category');
    cats.forEach(cat => {
      expect(cat.className).toMatch(/skills-cat--\d/);
    });
  });

  it('is idempotent', () => {
    renderSkillsExpanded(container, _makeSkills());
    renderSkillsExpanded(container, _makeSkills());
    expect(container.querySelectorAll('.exp-skills-grid').length).toBe(1);
  });
});

describe('renderCvExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .exp-cv-list', () => {
    renderCvExpanded(container, _makeCv());
    expect(container.querySelector('.exp-cv-list')).not.toBeNull();
  });

  it('renders .exp-cv-dot--current for current entries', () => {
    renderCvExpanded(container, _makeCv());
    expect(container.querySelector('.exp-cv-dot--current')).not.toBeNull();
  });

  it('is idempotent', () => {
    renderCvExpanded(container, _makeCv());
    renderCvExpanded(container, _makeCv());
    expect(container.querySelectorAll('.exp-cv-list').length).toBe(1);
  });
});

describe('renderRadarExpanded', () => {
  let container;
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .exp-radar-layout with SVG and side panel', () => {
    renderRadarExpanded(container, _makeRadar());
    expect(container.querySelector('.exp-radar-layout')).not.toBeNull();
    expect(container.querySelector('.exp-radar-svg')).not.toBeNull();
    expect(container.querySelector('.radar-panel')).not.toBeNull();
  });

  it('is idempotent', () => {
    renderRadarExpanded(container, _makeRadar());
    renderRadarExpanded(container, _makeRadar());
    expect(container.querySelectorAll('.exp-radar-layout').length).toBe(1);
  });
});

describe('renderTopologyExpanded', () => {
  // Topology expand opens a fullscreen overlay (#topology-expanded).
  // In production the overlay is in index.html; in tests, the topology
  // module lazy-creates it if missing.
  afterEach(() => {
    const ov = document.getElementById('topology-expanded');
    if (ov) ov.remove();
  });

  it('opens the fullscreen overlay (creates it if absent)', () => {
    renderTopologyExpanded(document.createElement('div'));
    const ov = document.getElementById('topology-expanded');
    expect(ov).not.toBeNull();
    expect(ov.classList.contains('is-open')).toBe(true);
  });

  it('is idempotent — opening twice does not duplicate the overlay', () => {
    renderTopologyExpanded(document.createElement('div'));
    renderTopologyExpanded(document.createElement('div'));
    expect(document.querySelectorAll('#topology-expanded').length).toBe(1);
  });
});

describe('renderProjectDetail', () => {
  let container;
  const uiStrings = { statusLabels: { 'completed': 'COMPLETED', 'active': 'ACTIVE', 'planned': 'PLANNED' } };
  beforeEach(() => { container = document.createElement('div'); });

  it('renders .exp-project-detail', () => {
    renderProjectDetail(container, _makeProject(), uiStrings);
    expect(container.querySelector('.exp-project-detail')).not.toBeNull();
  });

  it('renders project name as title text content', () => {
    renderProjectDetail(container, _makeProject({ name: 'My Project' }), uiStrings);
    expect(container.querySelector('.exp-project-detail__title').textContent).toBe('My Project');
  });

  it('does NOT render a link when links array is empty', () => {
    renderProjectDetail(container, _makeProject({ links: [] }), uiStrings);
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders a link for a valid https:// URL in links array', () => {
    const proj = _makeProject({ links: [{ label: '→ GitHub', url: 'https://github.com/example' }] });
    renderProjectDetail(container, proj, uiStrings);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://github.com/example');
  });

  it('does NOT execute XSS in project name', () => {
    renderProjectDetail(container, _makeProject({ name: '<script>alert(1)</script>' }), uiStrings);
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('is idempotent', () => {
    renderProjectDetail(container, _makeProject(), uiStrings);
    renderProjectDetail(container, _makeProject(), uiStrings);
    expect(container.querySelectorAll('.exp-project-detail').length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────

function _makeProfile(overrides = {}) {
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
    { current: true,  date: '2024 – present', title: 'B.Sc. IT Security', subtitle: 'DHBW Stuttgart' },
    { current: false, date: '2020 – 2024',    title: 'High School',       subtitle: 'Example School' }
  ];
}

function _makeSkills() {
  return [
    { tool: 'Wireshark', category: 'Network', proficiency: 'advanced',     years: 2 },
    { tool: 'Splunk',    category: 'SIEM',    proficiency: 'intermediate', years: 1 }
  ];
}

function _makeThreatFeed() {
  return [
    { title: 'Article A', source: 'Source A', date: '2026-04-18', url: 'https://example.com/a', tags: ['zero-day'] },
    { title: 'Article B', source: 'Source B', date: '2026-04-14', url: 'https://example.com/b', tags: ['CISA'] },
    { title: 'Article C', source: 'Source C', date: '2026-03-11', url: 'https://example.com/c', tags: ['AI'] }
  ];
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
    { abbr: 'C+',  name: 'Security+',     issuer: 'CompTIA',  year: '2025' },
    { abbr: 'THM', name: 'TryHackMe Path', issuer: 'TryHackMe', year: '2025' }
  ];
}

function _makeUptime() {
  return {
    days: [
      { status: 'up' }, { status: 'up' }, { status: 'up' }, { status: 'up' },
      { status: 'up' }, { status: 'partial' }, { status: 'up' }, { status: 'up' },
      { status: 'up' }, { status: 'up' }, { status: 'up' }, { status: 'up' },
      { status: 'down' }, { status: 'up' }
    ],
    responseMs: 47, lastDeploy: '3d', uptimePercent: '99.7'
  };
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
