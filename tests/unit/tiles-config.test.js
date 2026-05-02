/**
 * tests/unit/tiles-config.test.js — TILES_CONFIG structural validation.
 *
 * Ensures every tile entry has the required fields, correct types,
 * and consistent relationships (e.g. expandable tiles have an expandRenderer).
 */

import { describe, it, expect } from 'vitest';
import { TILES_CONFIG } from '../../js/tiles-config.js';

const REQUIRED_FIELDS = ['id', 'labelKey', 'dataKey', 'accent', 'span', 'renderer', 'expandable'];
const VALID_SPANS = [1, 2, 3];

describe('TILES_CONFIG structure', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TILES_CONFIG)).toBe(true);
    expect(TILES_CONFIG.length).toBeGreaterThan(0);
  });

  it('contains exactly 10 tiles', () => {
    expect(TILES_CONFIG.length).toBe(10);
  });

  it('every entry has all required fields', () => {
    TILES_CONFIG.forEach(cfg => {
      REQUIRED_FIELDS.forEach(field => {
        expect(cfg, `tile "${cfg.id}" is missing field "${field}"`).toHaveProperty(field);
      });
    });
  });

  it('all tile ids are unique strings', () => {
    const ids = TILES_CONFIG.map(cfg => cfg.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(typeof id).toBe('string'));
  });

  it('all labelKey values are non-empty strings', () => {
    TILES_CONFIG.forEach(cfg => {
      expect(typeof cfg.labelKey).toBe('string');
      expect(cfg.labelKey.length).toBeGreaterThan(0);
    });
  });

  it('all span values are 1, 2, or 3', () => {
    TILES_CONFIG.forEach(cfg => {
      expect(VALID_SPANS).toContain(cfg.span);
    });
  });

  it('all renderer values are non-empty strings', () => {
    TILES_CONFIG.forEach(cfg => {
      expect(typeof cfg.renderer).toBe('string');
      expect(cfg.renderer.length).toBeGreaterThan(0);
    });
  });
});

describe('TILES_CONFIG expandable contract', () => {
  it('expandable tiles have an expandRenderer string', () => {
    TILES_CONFIG.filter(cfg => cfg.expandable === true).forEach(cfg => {
      expect(typeof cfg.expandRenderer, `tile "${cfg.id}" has expandable=true but no expandRenderer`)
        .toBe('string');
      expect(cfg.expandRenderer.length).toBeGreaterThan(0);
    });
  });

  it('non-expandable tiles do not have an expandRenderer', () => {
    TILES_CONFIG.filter(cfg => cfg.expandable === false).forEach(cfg => {
      expect(cfg.expandRenderer).toBeUndefined();
    });
  });

  it('at least one tile has expandable=false (contact tile)', () => {
    const nonExpandable = TILES_CONFIG.filter(cfg => cfg.expandable === false);
    expect(nonExpandable.length).toBeGreaterThan(0);
  });
});

describe('TILES_CONFIG contact tile', () => {
  it('contact tile exists', () => {
    const contact = TILES_CONFIG.find(cfg => cfg.id === 'contact');
    expect(contact).toBeDefined();
  });

  it('contact tile has expandable=false', () => {
    const contact = TILES_CONFIG.find(cfg => cfg.id === 'contact');
    expect(contact.expandable).toBe(false);
  });

  it('contact tile has clickable=false', () => {
    const contact = TILES_CONFIG.find(cfg => cfg.id === 'contact');
    expect(contact.clickable).toBe(false);
  });
});

describe('TILES_CONFIG badge structure', () => {
  it('badge entries have textKey and color fields', () => {
    TILES_CONFIG.filter(cfg => cfg.badge !== null).forEach(cfg => {
      expect(cfg.badge).toHaveProperty('textKey');
      expect(cfg.badge).toHaveProperty('color');
      expect(typeof cfg.badge.textKey).toBe('string');
      expect(typeof cfg.badge.color).toBe('string');
    });
  });
});

describe('TILES_CONFIG immutability', () => {
  it('the config array is frozen', () => {
    expect(Object.isFrozen(TILES_CONFIG)).toBe(true);
  });

  it('each tile entry is frozen', () => {
    TILES_CONFIG.forEach(cfg => {
      expect(Object.isFrozen(cfg)).toBe(true);
    });
  });
});
