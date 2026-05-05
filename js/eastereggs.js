// ╔═══════════════════════════════════════════╗
// ║  You found the easter eggs file.          ║
// ║  That means you're reading my source.     ║
// ║  Hey, nice to meet you.                   ║
// ╚═══════════════════════════════════════════╝

// eastereggs.js — One-time name glitch on first hover over topbar title.
//                 Favicon blink alert when tab loses focus.

const GLITCH_CHARS  = '█▓▒░0123456789ABCDEF!@#$%&*<>{}[]';
const ITERATIONS    = 8;
const ITER_MS       = 45;
const ALERT_COLOR    = '#ff3b3b';
const BLINK_INTERVAL = 400;

let _triggered = false;

export function initEasterEggs() {
  const el = document.getElementById('topbar-title');
  if (!el) return;
  el.addEventListener('mouseenter', () => _runGlitch(el), { once: true });
  _initFaviconAlert();
}

function _initFaviconAlert() {
  const link = document.querySelector('link[rel="icon"][sizes="32x32"]')
             || document.querySelector('link[rel="icon"]');
  if (!link) return;

  const originalHref = link.href;
  let alertHref     = null;
  let blinkInterval = null;
  let isRed         = false;

  function _tintedFavicon(imgEl) {
    const canvas = document.createElement('canvas');
    canvas.width  = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 32, 32);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 40, 40, 0.45)';
    ctx.fillRect(0, 0, 32, 32);
    return canvas.toDataURL('image/png');
  }

  function _startBlink() {
    if (blinkInterval !== null) return;
    isRed     = true;
    link.href = alertHref;
    blinkInterval = setInterval(() => {
      isRed     = !isRed;
      link.href = isRed ? alertHref : originalHref;
    }, BLINK_INTERVAL);
  }

  function _stopBlink() {
    clearInterval(blinkInterval);
    blinkInterval = null;
    isRed     = false;
    link.href = originalHref;
  }

  function _setup(href) {
    alertHref = href;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        _startBlink();
      } else {
        _stopBlink();
      }
    });
  }

  const img = new Image();
  img.onload = () => {
    try {
      _setup(_tintedFavicon(img));
    } catch (_e) {
      _setup(_buildFallbackFavicon());
    }
  };
  img.onerror = () => {
    _setup(_buildFallbackFavicon());
  };
  img.src = originalHref;
}

function _buildFallbackFavicon() {
  const canvas = document.createElement('canvas');
  canvas.width  = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 32, 32);

  ctx.fillStyle = ALERT_COLOR;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NR', 16, 17);

  return canvas.toDataURL('image/png');
}

function _runGlitch(el) {
  if (_triggered) return;
  _triggered = true;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const original = el.textContent;
  const len      = original.length;

  el.style.pointerEvents = 'none';
  el.style.userSelect    = 'none';

  let iter = 0;
  el.textContent = _scramble(original, 0, len);

  const id = setInterval(() => {
    iter++;
    const resolved = Math.floor((iter / ITERATIONS) * len);
    el.textContent = _scramble(original, resolved, len);

    if (iter >= ITERATIONS) {
      clearInterval(id);
      el.textContent         = original;
      el.style.pointerEvents = '';
      el.style.userSelect    = '';
    }
  }, ITER_MS);
}

function _scramble(original, resolvedCount, len) {
  let out = '';
  for (let i = 0; i < len; i++) {
    if (original[i] === ' ') {
      out += ' ';
    } else if (i < resolvedCount) {
      out += original[i];
    } else {
      out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
  }
  return out;
}
