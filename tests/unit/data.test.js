import { describe, it, expect } from 'vitest';
import { DATA } from '../../js/data.js';

const SUPPORTED_LANGS = ['de', 'en'];
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const VALID_CASE_STATUSES = ['open', 'in-progress', 'closed'];
const VALID_PROFICIENCIES = ['beginner', 'intermediate', 'advanced', 'expert'];
const VALID_CATEGORIES = ['project', 'ctf', 'research', 'certification'];

describe('DATA object — structure', () => {
  it('has a meta object with version and lastUpdated', () => {
    expect(DATA.meta).toBeDefined();
    expect(typeof DATA.meta.version).toBe('string');
    expect(typeof DATA.meta.lastUpdated).toBe('string');
  });

  it('has both language keys', () => {
    SUPPORTED_LANGS.forEach(lang => {
      expect(DATA[lang]).toBeDefined();
    });
  });

  it('has identical top-level keys for both languages', () => {
    const deKeys = Object.keys(DATA.de).sort();
    const enKeys = Object.keys(DATA.en).sort();
    expect(deKeys).toEqual(enKeys);
  });
});

describe('DATA object — status section', () => {
  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] has required status fields`, () => {
      const { status } = DATA[lang];
      expect(typeof status.name).toBe('string');
      expect(status.name.length).toBeGreaterThan(0);
      expect(typeof status.title).toBe('string');
      expect(typeof status.location).toBe('string');
      expect(typeof status.status).toBe('string');
      expect(Array.isArray(status.specializations)).toBe(true);
      expect(typeof status.bio).toBe('string');
    });

    it(`[${lang}] status.name is Noah Rendler`, () => {
      expect(DATA[lang].status.name).toBe('Noah Rendler');
    });
  });
});

describe('DATA object — threatIntel entries', () => {
  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] all entries have valid severity`, () => {
      DATA[lang].threatIntel.forEach(entry => {
        expect(VALID_SEVERITIES).toContain(entry.severity);
      });
    });

    it(`[${lang}] all entries have valid category`, () => {
      DATA[lang].threatIntel.forEach(entry => {
        expect(VALID_CATEGORIES).toContain(entry.category);
      });
    });

    it(`[${lang}] all IDs are unique`, () => {
      const ids = DATA[lang].threatIntel.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`[${lang}] all entries have required fields`, () => {
      DATA[lang].threatIntel.forEach(entry => {
        expect(typeof entry.id).toBe('string');
        expect(typeof entry.date).toBe('string');
        expect(typeof entry.title).toBe('string');
        expect(typeof entry.summary).toBe('string');
        expect(Array.isArray(entry.tags)).toBe(true);
        // link is allowed to be null
        expect(entry.link === null || typeof entry.link === 'string').toBe(true);
      });
    });
  });
});

describe('DATA object — skills entries', () => {
  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] all entries have valid proficiency`, () => {
      DATA[lang].skills.forEach(skill => {
        expect(VALID_PROFICIENCIES).toContain(skill.proficiency);
      });
    });

    it(`[${lang}] all entries have required fields`, () => {
      DATA[lang].skills.forEach(skill => {
        expect(typeof skill.tool).toBe('string');
        expect(typeof skill.category).toBe('string');
        expect(skill.years === null || typeof skill.years === 'number').toBe(true);
      });
    });
  });
});

describe('DATA object — cases entries', () => {
  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] all entries have valid status`, () => {
      DATA[lang].cases.forEach(c => {
        expect(VALID_CASE_STATUSES).toContain(c.status);
      });
    });

    it(`[${lang}] all case IDs are unique`, () => {
      const ids = DATA[lang].cases.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`[${lang}] all entries have required fields`, () => {
      DATA[lang].cases.forEach(c => {
        expect(typeof c.id).toBe('string');
        expect(typeof c.title).toBe('string');
        expect(typeof c.description).toBe('string');
        expect(Array.isArray(c.tech)).toBe(true);
        // link and closed are allowed to be null
        expect(c.link === null || typeof c.link === 'string').toBe(true);
        expect(c.closed === null || typeof c.closed === 'string').toBe(true);
      });
    });
  });
});

describe('DATA object — no HTML in text content fields', () => {
  const htmlTagRegex = /<[^>]+>/;

  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] threatIntel titles and summaries contain no HTML tags`, () => {
      DATA[lang].threatIntel.forEach(entry => {
        expect(entry.title).not.toMatch(htmlTagRegex);
        expect(entry.summary).not.toMatch(htmlTagRegex);
      });
    });

    it(`[${lang}] case titles and descriptions contain no HTML tags`, () => {
      DATA[lang].cases.forEach(c => {
        expect(c.title).not.toMatch(htmlTagRegex);
        expect(c.description).not.toMatch(htmlTagRegex);
      });
    });

    it(`[${lang}] status bio contains no HTML tags`, () => {
      expect(DATA[lang].status.bio).not.toMatch(htmlTagRegex);
    });
  });
});

describe('DATA object — UI strings', () => {
  SUPPORTED_LANGS.forEach(lang => {
    it(`[${lang}] has all required ui.nav keys`, () => {
      const { nav } = DATA[lang].ui;
      ['status', 'threatIntel', 'skills', 'cases', 'contact'].forEach(key => {
        expect(typeof nav[key]).toBe('string');
        expect(nav[key].length).toBeGreaterThan(0);
      });
    });

    it(`[${lang}] has all required ui.sections keys`, () => {
      const { sections } = DATA[lang].ui;
      ['status', 'threatIntel', 'skills', 'cases', 'contact'].forEach(key => {
        expect(typeof sections[key]).toBe('string');
        expect(sections[key].length).toBeGreaterThan(0);
      });
    });
  });
});
