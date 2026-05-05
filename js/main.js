// main.js — Entry point.

import { renderGrid } from './renderer.js';
import { initI18n } from './i18n.js';
import { initNav, getNavState, restoreNav } from './navigation.js';
import { initClock } from './clock.js';
import { initContact } from './contact.js';
import { initEasterEggs } from './eastereggs.js';

(function bootstrap() {
  let _langTimer = null;

  // On language switch: crossfade if an expanded panel is visible
  const initialLang = initI18n(lang => {
    const navState = getNavState();
    const panel = document.getElementById('expanded-panels');

    if (_langTimer) { clearTimeout(_langTimer); _langTimer = null; }

    if (navState.level > 1 && panel) {
      panel.style.transition = 'opacity 120ms ease-out';
      panel.style.opacity = '0';
      _langTimer = setTimeout(() => {
        _langTimer = null;
        renderGrid(lang);
        restoreNav(navState);
        requestAnimationFrame(() => { panel.style.opacity = '1'; });
      }, 120);
    } else {
      renderGrid(lang);
      restoreNav(navState);
    }
  });

  renderGrid(initialLang);
  initNav();
  initClock();
  initContact();
  initEasterEggs();
})();
