import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderStatusPanel,
  renderThreatIntel,
  renderSkillsMatrix,
  renderActiveCases
} from '../../js/renderer.js';

// ─────────────────────────────────────────────────────────────
// renderStatusPanel
// ─────────────────────────────────────────────────────────────

describe('renderStatusPanel', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders the name as textContent', () => {
    const data = _makeStatusData({ name: 'Noah Rendler' });
    renderStatusPanel(container, data);
    expect(container.querySelector('.status-panel__name').textContent).toBe('Noah Rendler');
  });

  it('does NOT render an XSS payload as executable HTML', () => {
    const payload = '<script>alert("xss")</script>';
    const data = _makeStatusData({ name: payload });
    renderStatusPanel(container, data);
    // Script tag must not appear as HTML in the DOM
    expect(container.innerHTML).not.toContain('<script>');
    // But the text content (escaped) must be present
    expect(container.textContent).toContain('<script>');
  });

  it('renders all specialization tags', () => {
    const data = _makeStatusData({ specializations: ['OSINT', 'SOC', 'IR'] });
    renderStatusPanel(container, data);
    const tags = container.querySelectorAll('.tag');
    expect(tags.length).toBe(3);
    expect(tags[0].textContent).toBe('OSINT');
    expect(tags[1].textContent).toBe('SOC');
    expect(tags[2].textContent).toBe('IR');
  });

  it('renders the bio when present', () => {
    const data = _makeStatusData({ bio: 'A test bio.' });
    renderStatusPanel(container, data);
    expect(container.querySelector('.status-panel__bio').textContent).toBe('A test bio.');
  });

  it('omits the bio element when bio is empty', () => {
    const data = _makeStatusData({ bio: '' });
    renderStatusPanel(container, data);
    expect(container.querySelector('.status-panel__bio')).toBeNull();
  });

  it('is idempotent — re-render does not duplicate content', () => {
    const data = _makeStatusData({});
    renderStatusPanel(container, data);
    renderStatusPanel(container, data);
    renderStatusPanel(container, data);
    const names = container.querySelectorAll('.status-panel__name');
    expect(names.length).toBe(1);
  });

  it('renders nothing when container is null', () => {
    expect(() => renderStatusPanel(null, _makeStatusData({}))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// renderThreatIntel
// ─────────────────────────────────────────────────────────────

describe('renderThreatIntel', () => {
  let container;
  const uiStrings = {
    noEntries: 'No entries.',
    categoryLabels: { project: 'PROJECT', ctf: 'CTF', research: 'RESEARCH', certification: 'CERT' }
  };

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders entries sorted newest-first', () => {
    const data = [
      _makeThreatEntry({ id: 'TI-001', date: '2024-01-01', title: 'Older' }),
      _makeThreatEntry({ id: 'TI-002', date: '2025-06-01', title: 'Newer' })
    ];
    renderThreatIntel(container, data, uiStrings);
    const titles = container.querySelectorAll('.threat-entry__title');
    expect(titles[0].textContent).toBe('Newer');
    expect(titles[1].textContent).toBe('Older');
  });

  it('applies the correct severity class', () => {
    const data = [_makeThreatEntry({ severity: 'critical' })];
    renderThreatIntel(container, data, uiStrings);
    expect(container.querySelector('.severity--critical')).not.toBeNull();
  });

  it('falls back to severity "info" for unknown severity values', () => {
    const data = [_makeThreatEntry({ severity: 'unknown-value' })];
    renderThreatIntel(container, data, uiStrings);
    expect(container.querySelector('.severity--info')).not.toBeNull();
    expect(container.querySelector('.severity--unknown-value')).toBeNull();
  });

  it('does NOT render a link for a javascript: URL', () => {
    const data = [_makeThreatEntry({ link: 'javascript:alert(1)' })];
    renderThreatIntel(container, data, uiStrings);
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link.href).not.toContain('javascript:');
    });
  });

  it('does NOT render a link for null', () => {
    const data = [_makeThreatEntry({ link: null })];
    renderThreatIntel(container, data, uiStrings);
    expect(container.querySelector('.threat-entry__link')).toBeNull();
  });

  it('renders a valid https:// link', () => {
    const data = [_makeThreatEntry({ link: 'https://github.com/example' })];
    renderThreatIntel(container, data, uiStrings);
    const link = container.querySelector('.threat-entry__link');
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://github.com/example');
    expect(link.rel).toContain('noopener');
  });

  it('shows empty state when data array is empty', () => {
    renderThreatIntel(container, [], uiStrings);
    expect(container.querySelector('.empty-state')).not.toBeNull();
  });

  it('is idempotent — re-render does not duplicate entries', () => {
    const data = [_makeThreatEntry({}), _makeThreatEntry({ id: 'TI-002' })];
    renderThreatIntel(container, data, uiStrings);
    renderThreatIntel(container, data, uiStrings);
    expect(container.querySelectorAll('.threat-entry').length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────
// renderSkillsMatrix
// ─────────────────────────────────────────────────────────────

describe('renderSkillsMatrix', () => {
  let container;
  const uiStrings = { tool: 'TOOL', category: 'CATEGORY', proficiency: 'PROFICIENCY', years: 'YRS' };

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders a table with a header row', () => {
    renderSkillsMatrix(container, [_makeSkill({})], uiStrings);
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelectorAll('thead th').length).toBe(4);
  });

  it('renders the correct number of rows', () => {
    const data = [_makeSkill({}), _makeSkill({ tool: 'Nmap' }), _makeSkill({ tool: 'Splunk' })];
    renderSkillsMatrix(container, data, uiStrings);
    expect(container.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('applies proficiency class to badge', () => {
    const data = [_makeSkill({ proficiency: 'advanced' })];
    renderSkillsMatrix(container, data, uiStrings);
    expect(container.querySelector('.proficiency--advanced')).not.toBeNull();
  });

  it('falls back to "beginner" for unknown proficiency', () => {
    const data = [_makeSkill({ proficiency: 'ninja' })];
    renderSkillsMatrix(container, data, uiStrings);
    expect(container.querySelector('.proficiency--beginner')).not.toBeNull();
    expect(container.querySelector('.proficiency--ninja')).toBeNull();
  });

  it('shows "—" when years is null', () => {
    const data = [_makeSkill({ years: null })];
    renderSkillsMatrix(container, data, uiStrings);
    expect(container.querySelector('.skills-table__years').textContent).toBe('—');
  });
});

// ─────────────────────────────────────────────────────────────
// renderActiveCases
// ─────────────────────────────────────────────────────────────

describe('renderActiveCases', () => {
  let container;
  const uiStrings = {
    noEntries: 'No cases.',
    statusLabels: { 'open': 'OPEN', 'in-progress': 'IN PROGRESS', 'closed': 'CLOSED' },
    labelStarted: 'Started',
    labelClosed: 'Closed',
    linkLabel: '→ GitHub'
  };

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders open cases before closed cases', () => {
    const data = [
      _makeCase({ id: 'CASE-002', status: 'closed', title: 'Closed Case' }),
      _makeCase({ id: 'CASE-001', status: 'open', title: 'Open Case' })
    ];
    renderActiveCases(container, data, uiStrings);
    const titles = container.querySelectorAll('.case-card__title');
    expect(titles[0].textContent).toBe('Open Case');
    expect(titles[1].textContent).toBe('Closed Case');
  });

  it('renders correct status pill class', () => {
    const data = [_makeCase({ status: 'in-progress' })];
    renderActiveCases(container, data, uiStrings);
    expect(container.querySelector('.status--inprogress')).not.toBeNull();
  });

  it('does NOT render a link for a data: URL', () => {
    const data = [_makeCase({ link: 'data:text/html,<script>alert(1)</script>' })];
    renderActiveCases(container, data, uiStrings);
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      expect(link.href).not.toContain('data:');
    });
  });

  it('renders a valid GitHub link', () => {
    const data = [_makeCase({ link: 'https://github.com/user/repo' })];
    renderActiveCases(container, data, uiStrings);
    const link = container.querySelector('.case-card__link');
    expect(link).not.toBeNull();
    expect(link.rel).toContain('noopener');
  });
});

// ─────────────────────────────────────────────────────────────
// Test data factories
// ─────────────────────────────────────────────────────────────

function _makeStatusData(overrides) {
  return {
    name: 'Test User',
    title: 'Security Analyst',
    location: 'Berlin',
    status: 'AVAILABLE',
    specializations: [],
    bio: '',
    ...overrides
  };
}

function _makeThreatEntry(overrides) {
  return {
    id: 'TI-001',
    date: '2025-01-01',
    severity: 'medium',
    category: 'project',
    title: 'Test Entry',
    summary: 'A test summary.',
    tags: ['test'],
    link: null,
    ...overrides
  };
}

function _makeSkill(overrides) {
  return {
    tool: 'Wireshark',
    category: 'Network Analysis',
    proficiency: 'intermediate',
    years: 2,
    ...overrides
  };
}

function _makeCase(overrides) {
  return {
    id: 'CASE-001',
    status: 'open',
    title: 'Test Case',
    description: 'A test description.',
    tech: ['Python'],
    started: '2025-01-01',
    closed: null,
    link: null,
    ...overrides
  };
}
