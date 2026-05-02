import { describe, it, expect, beforeEach } from 'vitest';
import { DATA } from '../../js/data.js';
import { renderAll } from '../../js/renderer.js';

function _setupDOM() {
  document.body.innerHTML = `
    <span id="topbar-title"></span>
    <span id="topbar-status"></span>
    <ul id="sidebar-nav"></ul>
    <h2 id="heading-status"></h2>
    <h2 id="heading-threat"></h2>
    <h2 id="heading-skills"></h2>
    <h2 id="heading-cases"></h2>
    <h2 id="heading-contact"></h2>
    <div id="status-panel-content"></div>
    <div id="threat-intel-content"></div>
    <div id="skills-matrix-content"></div>
    <div id="active-cases-content"></div>
    <div id="contact-content"></div>
  `;
}

describe('renderAll — full pipeline', () => {
  beforeEach(_setupDOM);

  it('renders DE without throwing', () => {
    expect(() => renderAll('de')).not.toThrow();
  });

  it('renders EN without throwing', () => {
    expect(() => renderAll('en')).not.toThrow();
  });

  it('throws for an unsupported language', () => {
    expect(() => renderAll('fr')).toThrow();
  });

  it('renders the correct topbar title for DE', () => {
    renderAll('de');
    expect(document.getElementById('topbar-title').textContent).toBe(
      DATA.de.ui.topbar.title
    );
  });

  it('renders the correct topbar title for EN', () => {
    renderAll('en');
    expect(document.getElementById('topbar-title').textContent).toBe(
      DATA.en.ui.topbar.title
    );
  });

  it('populates the nav with the correct number of items', () => {
    renderAll('de');
    const navItems = document.querySelectorAll('#sidebar-nav .nav__link');
    expect(navItems.length).toBe(5);
  });

  it('renders content in the status panel', () => {
    renderAll('de');
    const content = document.getElementById('status-panel-content');
    expect(content.children.length).toBeGreaterThan(0);
  });

  it('renders the analyst name', () => {
    renderAll('de');
    expect(document.querySelector('.status-panel__name').textContent).toBe('Noah Rendler');
  });
});

describe('renderAll — language switch (idempotency)', () => {
  beforeEach(_setupDOM);

  it('switching DE → EN → DE does not duplicate nav items', () => {
    renderAll('de');
    renderAll('en');
    renderAll('de');
    expect(document.querySelectorAll('#sidebar-nav .nav__link').length).toBe(5);
  });

  it('switching language updates the topbar status label', () => {
    renderAll('de');
    const deLabel = document.getElementById('topbar-status').textContent;

    renderAll('en');
    const enLabel = document.getElementById('topbar-status').textContent;

    expect(deLabel).toBe(DATA.de.ui.topbar.statusLabel);
    expect(enLabel).toBe(DATA.en.ui.topbar.statusLabel);
    expect(deLabel).not.toBe(enLabel);
  });

  it('switching language updates section headings', () => {
    renderAll('de');
    const deHeading = document.getElementById('heading-status').textContent;

    renderAll('en');
    const enHeading = document.getElementById('heading-status').textContent;

    expect(deHeading).toBe(DATA.de.ui.sections.status);
    expect(enHeading).toBe(DATA.en.ui.sections.status);
  });

  it('re-render does not duplicate status panel children', () => {
    renderAll('de');
    renderAll('de');
    const panels = document.querySelectorAll('.status-panel');
    expect(panels.length).toBe(1);
  });
});

describe('renderAll — DATA integrity in rendered output', () => {
  beforeEach(_setupDOM);

  it('does not render any script tags in the output', () => {
    renderAll('de');
    expect(document.body.innerHTML).not.toMatch(/<script/i);
  });

  it('does not render any inline event handlers', () => {
    renderAll('de');
    expect(document.body.innerHTML).not.toMatch(/\s(on\w+)=/i);
  });
});

// ─────────────────────────────────────────────────────────────
// Renderer edge cases (covering previously uncovered branches)
// ─────────────────────────────────────────────────────────────

describe('renderActiveCases — closed date', () => {
  beforeEach(_setupDOM);

  it('renders the closed date when caseItem.closed is not null', () => {
    const data = _buildDataWithClosedCase();
    renderAll('de', data);
    // The closed date should appear as a <time> element with the case-card__date class
    const closedDates = document.querySelectorAll('.case-card__date');
    const closedEl = Array.from(closedDates).find(el =>
      el.textContent.includes('2025-06-01')
    );
    expect(closedEl).toBeDefined();
  });
});

describe('renderContact — external links', () => {
  beforeEach(_setupDOM);

  it('renders external github link with rel=noopener noreferrer', () => {
    const data = _buildDataWithExternalLinks();
    renderAll('de', data);
    const links = document.querySelectorAll('a.contact__link');
    const githubLink = Array.from(links).find(a => a.href.includes('github.com'));
    expect(githubLink).not.toBeNull();
    expect(githubLink.rel).toContain('noopener');
    expect(githubLink.target).toBe('_blank');
  });

  it('renders external linkedin link with rel=noopener noreferrer', () => {
    const data = _buildDataWithExternalLinks();
    renderAll('de', data);
    const links = document.querySelectorAll('a.contact__link');
    const linkedinLink = Array.from(links).find(a => a.href.includes('linkedin.com'));
    expect(linkedinLink).not.toBeNull();
    expect(linkedinLink.rel).toContain('noopener');
  });
});

// ─────────────────────────────────────────────────────────────
// Helpers for edge-case data
// ─────────────────────────────────────────────────────────────

function _buildDataWithClosedCase() {
  return {
    de: {
      ...DATA.de,
      cases: [
        {
          id: 'CASE-CLOSED',
          status: 'closed',
          title: 'Closed Case',
          description: 'A case that was resolved.',
          tech: ['Python'],
          started: '2025-01-01',
          closed: '2025-06-01',
          link: null
        }
      ]
    }
  };
}

function _buildDataWithExternalLinks() {
  return {
    de: {
      ...DATA.de,
      contact: {
        ...DATA.de.contact,
        email: 'test@example.com',
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test'
      }
    }
  };
}
