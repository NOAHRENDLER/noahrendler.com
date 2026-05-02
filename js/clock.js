// clock.js — Live clock in the topbar. Format: 2026-04-14 // 14:32:07 CET

let _intervalId = null;

export function initClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  stopClock();
  _tick(clockEl);
  _intervalId = setInterval(() => _tick(clockEl), 1000);
}

export function stopClock() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}

function _tick(el) {
  const now = new Date();

  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString('en-GB', { hour12: false });

  const tz = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now)
    .find(part => part.type === 'timeZoneName')
    ?.value ?? '';

  el.textContent = `${date} // ${time} ${tz}`.trim();
  el.setAttribute('datetime', now.toISOString());
}
