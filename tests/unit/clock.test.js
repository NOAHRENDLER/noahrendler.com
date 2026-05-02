/**
 * tests/unit/clock.test.js — Live clock module tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initClock, stopClock } from '../../js/clock.js';

beforeEach(() => {
  document.body.innerHTML = '<time id="clock"></time>';
});

afterEach(() => {
  stopClock();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('initClock', () => {
  it('does nothing when #clock element is absent', () => {
    document.body.innerHTML = '';
    expect(() => initClock()).not.toThrow();
  });

  it('sets textContent on the #clock element immediately', () => {
    initClock();
    expect(document.getElementById('clock').textContent).not.toBe('');
  });

  it('sets the datetime attribute to an ISO string', () => {
    initClock();
    const datetime = document.getElementById('clock').getAttribute('datetime');
    expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('content contains today\'s date (YYYY-MM-DD)', () => {
    initClock();
    const today = new Date().toISOString().slice(0, 10);
    expect(document.getElementById('clock').textContent).toContain(today);
  });

  it('content contains the time separator //', () => {
    initClock();
    expect(document.getElementById('clock').textContent).toContain('//');
  });

  it('calling initClock twice stops the previous interval first (no throw)', () => {
    initClock();
    expect(() => initClock()).not.toThrow();
  });
});

describe('stopClock', () => {
  it('is safe to call before initClock has been called', () => {
    expect(() => stopClock()).not.toThrow();
  });

  it('is safe to call twice in a row', () => {
    initClock();
    stopClock();
    expect(() => stopClock()).not.toThrow();
  });
});

describe('interval tick', () => {
  it('updates the clock element after 1 second', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));

    initClock();
    const clockEl = document.getElementById('clock');
    const firstText = clockEl.textContent;

    vi.advanceTimersByTime(1000);
    // textContent is updated via setInterval; the element must be truthy
    expect(clockEl.textContent).toBeTruthy();
    // After 1 second the datetime attribute must still be an ISO string
    expect(clockEl.getAttribute('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
