/**
 * navigation.js — 3-level drill-down navigation.
 *
 * Level 1: Dashboard grid (all tiles visible)
 * Level 2: Expanded panel (single tile full-screen)
 * Level 3: Project detail (drill-down from projects expanded view)
 *
 * History API:
 *   Level 1: state = { level: 1 },               url = pathname (no hash)
 *   Level 2: state = { level: 2, tileId },        url = #tileId
 *   Level 3: state = { level: 3, projectId },     url = #projects/projectId
 *
 * Keyboard:
 *   Enter / Space on .tile   — triggers expand()
 *   Escape (any level > 1)   — triggers collapse() to grid
 *
 * Security:
 *   tileId validated against TILES_CONFIG before any DOM operation.
 *   projectId looked up by exact match in DATA[lang].projects — never
 *   used as a raw selector or innerHTML target.
 */

import { TILES_CONFIG } from './tiles-config.js';
import { DATA } from './data.js';
import { getCurrentLanguage } from './i18n.js';
import {
  renderProfileExpanded,
  renderTopologyExpanded,
  renderThreatFeedExpanded,
  renderProjectsExpanded,
  renderCertsExpanded,
  renderSkillsExpanded,
  renderCvExpanded,
  renderRadarExpanded,
  renderProjectDetail
} from './renderer.js';
import { openTopology } from './topology.js';

// ─────────────────────────────────────────────────────────────
// Module state
// ─────────────────────────────────────────────────────────────

let _level         = 1;
let _activeTileId  = null;
let _activeProjectId = null;
let _initialized   = false;

// Stored handler refs for clean removal in _resetForTests()
const _handlers = [];

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export function initNav() {
  if (_initialized) return;
  _initialized = true;

  history.replaceState({ level: 1 }, '', location.href);

  const grid          = document.getElementById('main-grid');
  const expandedPanel = document.getElementById('expanded-panels');

  // ── Tile click ──────────────────────────────────────────────
  if (grid) {
    const onGridClick = e => {
      const tile = e.target.closest('.tile');
      if (!tile || tile.classList.contains('tile--no-click')) return;
      const tileId = tile.id.replace('tile-', '');
      expand(tileId);
    };
    _on(grid, 'click', onGridClick);

    // Enter / Space triggers expand on focused tile
    const onGridKey = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tile = e.target.closest('.tile');
      if (!tile || tile.classList.contains('tile--no-click')) return;
      e.preventDefault();
      const tileId = tile.id.replace('tile-', '');
      expand(tileId);
    };
    _on(grid, 'keydown', onGridKey);
  }

  // ── Expanded panel — back button + project card delegation ──
  if (expandedPanel) {
    const onPanelClick = e => {
      if (e.target.closest('.exp-back')) {
        if (_level === 3) backToProjects();
        else collapse();
        return;
      }
      const card = e.target.closest('[data-project-id]');
      if (card) {
        drillProject(card.dataset.projectId);
      }
    };
    _on(expandedPanel, 'click', onPanelClick);

    // Enter / Space on a focused project card
    const onPanelKey = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[data-project-id]');
      if (!card) return;
      e.preventDefault();
      drillProject(card.dataset.projectId);
    };
    _on(expandedPanel, 'keydown', onPanelKey);
  }

  // ── Escape collapses from any expanded level ────────────────
  const onDocKey = e => {
    if (e.key === 'Escape' && _level > 1) collapse();
  };
  _on(document, 'keydown', onDocKey);

  // ── Browser back / forward ──────────────────────────────────
  const onPopState = e => {
    const state = e.state;
    if (!state || state.level === 1) {
      _showGrid();
    } else if (state.level === 2) {
      _showExpanded(state.tileId);
    } else if (state.level === 3) {
      _showDrillDown(state.projectId);
    }
  };
  _on(window, 'popstate', onPopState);
}

export function expand(tileId) {
  const cfg = TILES_CONFIG.find(c => c.id === tileId);
  if (!cfg || cfg.expandable === false) return;

  // Topology gets a fullscreen overlay instead of the inline expanded panel
  if (tileId === 'topology') {
    openTopology();
    return;
  }

  history.pushState({ level: 2, tileId }, '', `#${tileId}`);
  _showExpanded(tileId);
}

export function collapse() {
  history.pushState({ level: 1 }, '', location.pathname + location.search);
  _showGrid();
}

export function drillProject(projectId) {
  history.pushState({ level: 3, projectId }, '', `#projects/${projectId}`);
  _showDrillDown(projectId);
}

export function backToProjects() {
  history.pushState({ level: 2, tileId: 'projects' }, '', '#projects');
  _showExpanded('projects');
}

export function resetNav() {
  _showGrid();
}

/** @returns {{ level: 1|2|3, tileId: string|null, projectId: string|null }} */
export function getNavState() {
  return { level: _level, tileId: _activeTileId, projectId: _activeProjectId };
}

export function restoreNav(state) {
  if (!state || state.level === 1) {
    _showGrid();
    return;
  }
  if (state.level === 2 && state.tileId) {
    _showExpanded(state.tileId, true);
    return;
  }
  if (state.level === 3 && state.projectId) {
    _showDrillDown(state.projectId, true);
  }
}

// ─────────────────────────────────────────────────────────────
// Internal — display functions (pure DOM, no history side-effects)
// ─────────────────────────────────────────────────────────────

function _showGrid() {
  _level          = 1;
  _activeTileId   = null;
  _activeProjectId = null;

  const grid          = document.getElementById('main-grid');
  const expandedPanel = document.getElementById('expanded-panels');

  if (grid) grid.classList.remove('hidden');
  if (expandedPanel) expandedPanel.textContent = '';
}

function _showExpanded(tileId, instant) {
  const cfg = TILES_CONFIG.find(c => c.id === tileId);
  if (!cfg) return;

  _level          = 2;
  _activeTileId   = tileId;
  _activeProjectId = null;

  const grid          = document.getElementById('main-grid');
  const expandedPanel = document.getElementById('expanded-panels');

  if (grid) grid.classList.add('hidden');
  if (!expandedPanel) return;

  // Clear and rebuild — idempotent, prevents duplicate panels
  expandedPanel.textContent = '';

  const lang     = getCurrentLanguage();
  const langData = DATA[lang];

  const panelEl = _buildPanelShell(cfg, langData, 2, null);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'exp-body';
  bodyEl.id        = `exp-body-${tileId}`;

  _dispatchExpandedRender(cfg, bodyEl, langData);

  panelEl.appendChild(bodyEl);
  expandedPanel.appendChild(panelEl);
  _scrollToExpanded(expandedPanel, instant);
}

function _showDrillDown(projectId, instant) {
  const lang     = getCurrentLanguage();
  const langData = DATA[lang];

  // Validate — never trust projectId as a raw selector
  const project = (langData.projects ?? []).find(p => p.id === projectId);
  if (!project) return;

  _level           = 3;
  _activeProjectId = projectId;

  const grid          = document.getElementById('main-grid');
  const expandedPanel = document.getElementById('expanded-panels');

  if (grid) grid.classList.add('hidden');
  if (!expandedPanel) return;

  expandedPanel.textContent = '';

  const cfg = TILES_CONFIG.find(c => c.id === 'projects');
  if (!cfg) return;

  const panelEl = _buildPanelShell(cfg, langData, 3, project.name);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'exp-body';
  bodyEl.id        = 'exp-body-project-detail';

  renderProjectDetail(bodyEl, project, langData.ui.cases);

  panelEl.appendChild(bodyEl);
  expandedPanel.appendChild(panelEl);
  _scrollToExpanded(expandedPanel, instant);
}

function _buildPanelShell(cfg, langData, level, projectTitle) {
  const panelEl = document.createElement('div');
  panelEl.className = 'exp-panel';
  panelEl.id        = `exp-${cfg.id}`;

  // ── Header ────────────────────────────────────────────────
  const headerEl = document.createElement('div');
  headerEl.className = 'exp-header';

  const backBtn = document.createElement('button');
  backBtn.className   = 'exp-back';
  backBtn.type        = 'button';
  backBtn.textContent = '◀ BACK';
  headerEl.appendChild(backBtn);

  const tileLabel = langData.ui.tiles?.[cfg.labelKey] ?? cfg.labelKey.toUpperCase();

  const titleEl = document.createElement('span');
  titleEl.className   = 'exp-title';
  titleEl.textContent = tileLabel;
  headerEl.appendChild(titleEl);

  const breadcrumbEl = document.createElement('span');
  breadcrumbEl.className = 'exp-breadcrumb';
  if (level === 3 && projectTitle) {
    breadcrumbEl.textContent = `SOC // PORTFOLIO / ${tileLabel} / ${projectTitle}`;
  } else {
    breadcrumbEl.textContent = `SOC // PORTFOLIO / ${tileLabel}`;
  }
  headerEl.appendChild(breadcrumbEl);

  panelEl.appendChild(headerEl);
  return panelEl;
}

// Switch avoids ESLint detect-object-injection on bracket notation.
function _dispatchExpandedRender(cfg, body, langData) {
  switch (cfg.id) {
    case 'profile':  renderProfileExpanded(body, langData.profile);                          break;
    case 'topology': renderTopologyExpanded(body);                                           break;
    case 'threatFeed':  renderThreatFeedExpanded(body, langData.threatFeed);                  break;
    case 'projects': renderProjectsExpanded(body, langData.projects, langData.ui.cases);     break;
    case 'certs':    renderCertsExpanded(body, langData.certs);                              break;
    case 'skills':   renderSkillsExpanded(body, langData.skills);                            break;
    case 'cv':       renderCvExpanded(body, langData.cv);                                    break;
    case 'radar':    renderRadarExpanded(body, langData.radar);                              break;
  }
}

// ─────────────────────────────────────────────────────────────
// Scroll helper
// ─────────────────────────────────────────────────────────────

function _scrollToExpanded(el, instant) {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  const topbar = document.querySelector('.topbar');
  const sysBar = document.querySelector('.sys-bar');
  const offset = (topbar ? topbar.offsetHeight : 0) + (sysBar ? sysBar.offsetHeight : 0);
  el.style.scrollMarginTop = `${offset}px`;
  el.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
}

// ─────────────────────────────────────────────────────────────
// Event listener helpers
// ─────────────────────────────────────────────────────────────

function _on(target, event, handler) {
  target.addEventListener(event, handler);
  _handlers.push({ target, event, handler });
}

// ─────────────────────────────────────────────────────────────
// Test utilities  (underscore prefix = internal / test-only)
// ─────────────────────────────────────────────────────────────

export function _resetForTests() {
  _handlers.forEach(({ target, event, handler }) => {
    target.removeEventListener(event, handler);
  });
  _handlers.length = 0;
  _level           = 1;
  _activeTileId    = null;
  _activeProjectId = null;
  _initialized     = false;
}

export function _getLevel()           { return _level; }
export function _getActiveTileId()    { return _activeTileId; }
export function _getActiveProjectId() { return _activeProjectId; }
