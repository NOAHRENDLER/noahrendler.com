import { describe, it, expect } from 'vitest';
import { renderAll } from '../../js/renderer.js';

/**
 * XSS resistance tests.
 *
 * Approach: DOM API checks — NOT innerHTML regex.
 *
 * Checking innerHTML with regex produces false positives: a payload like
 * '<svg onload=alert(1)>' rendered safely via textContent serializes to
 * '&lt;svg onload=alert(1)&gt;' — the string contains ' onload=' as plain
 * text, which fools a naive regex but is completely harmless.
 *
 * Instead, we inspect the actual DOM:
 *   - No <script> elements without a src attribute (no injected scripts)
 *   - No element has an on* attribute (no injected event handlers)
 *   - No <a href> points to a javascript: or data: URL
 *
 * If these three hold, the renderer has correctly sandboxed all payloads.
 */

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  "<img src=x onerror=alert(String.fromCharCode(88,83,83))>",
  '<svg onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  'javascript:alert(1)',
  '\"><script>alert(document.cookie)</script>',
  '<img src=x onerror=alert(1)//',
  '{{constructor.constructor("alert(1)")()}}',
  '<details open ontoggle=alert(1)>',
  '<<SCRIPT>alert("XSS");//<</SCRIPT>'
];

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

function _buildMaliciousData(payload) {
  return {
    de: {
      status: {
        name: payload,
        title: payload,
        location: payload,
        status: payload,
        specializations: [payload],
        bio: payload
      },
      threatIntel: [{
        id: 'TI-EVIL-001',
        date: '2025-01-01',
        severity: 'high',
        category: 'project',
        title: payload,
        summary: payload,
        tags: [payload],
        link: null
      }],
      skills: [{
        tool: payload,
        category: payload,
        proficiency: 'advanced',
        years: 1
      }],
      cases: [{
        id: 'CASE-EVIL',
        status: 'open',
        title: payload,
        description: payload,
        tech: [payload],
        started: '2025-01-01',
        closed: null,
        link: null
      }],
      contact: {
        email: payload,
        linkedin: payload,
        github: payload,
        formAction: 'https://formspree.io/f/test'
      },
      ui: {
        topbar: { title: payload, statusLabel: payload },
        nav: {
          status: payload, threatIntel: payload,
          skills: payload, cases: payload, contact: payload
        },
        sections: {
          status: payload, threatIntel: payload,
          skills: payload, cases: payload, contact: payload
        },
        skillsTable: { tool: payload, category: payload, proficiency: payload, years: payload },
        threatIntel: {
          noEntries: payload,
          categoryLabels: { project: payload, ctf: payload, research: payload, certification: payload }
        },
        cases: {
          noEntries: payload,
          statusLabels: { 'open': payload, 'in-progress': payload, 'closed': payload },
          labelStarted: payload,
          labelClosed: payload,
          linkLabel: payload
        },
        contact: {
          emailLabel: payload, linkedinLabel: payload, githubLabel: payload,
          formTitle: payload, nameLabel: payload, emailFieldLabel: payload,
          messageLabel: payload, submitLabel: payload,
          validation: {
            nameRequired: payload, emailInvalid: payload,
            messageRequired: payload, tooManyRequests: payload,
            sending: payload, success: payload, error: payload
          }
        }
      }
    }
  };
}

/**
 * Assert that no element in the document has an on* event handler attribute.
 * This checks actual DOM attributes — not the serialized innerHTML string.
 * A payload rendered via textContent is safe even if it *contains* 'onload='
 * as text, because textContent never creates attributes.
 */
function _assertNoEventHandlerAttributes() {
  document.querySelectorAll('*').forEach(el => {
    el.getAttributeNames().forEach(attr => {
      expect(attr, `Element <${el.tagName}> has on* attribute: ${attr}`)
        .not.toMatch(/^on/i);
    });
  });
}

/**
 * Assert that no inline <script> element was injected.
 * Scripts with a src attribute are acceptable (they come from the static HTML);
 * inline <script> blocks would indicate a DOM injection attack.
 */
function _assertNoInlineScripts() {
  document.querySelectorAll('script').forEach(script => {
    const hasSrc = script.hasAttribute('src');
    if (!hasSrc) {
      expect(script.textContent.trim(), 'Inline <script> with content found').toBe('');
    }
  });
}

/**
 * Assert that no anchor element uses an unsafe URL scheme.
 */
function _assertNoUnsafeHrefs() {
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    expect(href, `Unsafe href: ${href}`).not.toMatch(/^javascript:/i);
    expect(href, `Data URI href: ${href}`).not.toMatch(/^data:/i);
  });
}

describe('XSS resistance — DOM API checks', () => {
  XSS_PAYLOADS.forEach((payload, index) => {
    it(`resists XSS vector #${index + 1}: ${payload.slice(0, 40)}`, () => {
      _setupDOM();

      const maliciousData = _buildMaliciousData(payload);
      expect(() => renderAll('de', maliciousData)).not.toThrow();

      _assertNoInlineScripts();
      _assertNoEventHandlerAttributes();
      _assertNoUnsafeHrefs();
    });
  });
});

describe('XSS resistance — URL fields', () => {
  it('does not render javascript: URLs as hrefs', () => {
    _setupDOM();
    const data = _buildMaliciousData('safe text');
    data.de.threatIntel[0].link = 'javascript:alert(1)';
    data.de.cases[0].link = 'javascript:alert(1)';
    renderAll('de', data);
    _assertNoUnsafeHrefs();
  });

  it('does not render data: URLs as hrefs', () => {
    _setupDOM();
    const data = _buildMaliciousData('safe text');
    data.de.threatIntel[0].link = 'data:text/html,<script>alert(1)</script>';
    data.de.cases[0].link = 'data:text/html,<h1>injected</h1>';
    renderAll('de', data);
    _assertNoUnsafeHrefs();
  });

  it('renders valid https:// links without stripping them', () => {
    _setupDOM();
    const data = _buildMaliciousData('safe text');
    data.de.threatIntel[0].link = 'https://github.com/example';
    renderAll('de', data);

    const link = document.querySelector('.threat-entry__link');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://github.com/example');
    expect(link.rel).toContain('noopener');
  });
});
