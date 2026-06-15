// Behavior tests for liquidframe.js — run with `node --test`.
// Zero dependencies: we hand-roll the tiny slice of the DOM the module touches,
// so there is no jsdom and no build step (matching the project's DNA).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  setChromeMode,
  setTitanium,
  enhance,
  formatClock,
  canScreenConsumeWheel,
} from '../liquidframe.js';

// --- minimal DOM stubs ------------------------------------------------------

class FakeClassList {
  #set = new Set();
  add(...c) { c.forEach((x) => this.#set.add(x)); }
  remove(...c) { c.forEach((x) => this.#set.delete(x)); }
  contains(c) { return this.#set.has(c); }
  toString() { return [...this.#set].join(' '); }
}

class FakeEl {
  constructor(tag = 'div') {
    this.tag = tag;
    this.classList = new FakeClassList();
    this.textContent = '';
    this.children = [];
    this._listeners = {};
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.clientHeight = 0;
    this.style = {};
  }
  addEventListener(type, fn, opts) {
    (this._listeners[type] ||= []).push({ fn, opts });
  }
  dispatch(type, ev) {
    (this._listeners[type] || []).forEach(({ fn }) => fn(ev));
  }
  querySelector(sel) {
    return this.children.find((c) => c._matches(sel)) || null;
  }
  querySelectorAll(sel) {
    return this.children.filter((c) => c._matches(sel));
  }
  _matches(sel) {
    if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
    if (sel.startsWith('[') && sel.endsWith(']')) return this._attrs?.[sel.slice(1, -1)] !== undefined;
    return false;
  }
}

// --- setChromeMode ----------------------------------------------------------

test('setChromeMode adds the requested mode and clears the others', () => {
  const f = new FakeEl();
  f.classList.add('chrome-compact');
  setChromeMode(f, 'top');
  assert.ok(f.classList.contains('chrome-top'));
  assert.ok(!f.classList.contains('chrome-compact'));
});

test('setChromeMode ignores invalid mode and missing frame', () => {
  const f = new FakeEl();
  f.classList.add('chrome-compact');
  setChromeMode(f, 'nope');
  assert.ok(f.classList.contains('chrome-compact'));
  assert.doesNotThrow(() => setChromeMode(null, 'top'));
});

// --- setTitanium ------------------------------------------------------------

test('setTitanium: natural clears finish classes (base style)', () => {
  const f = new FakeEl();
  setTitanium(f, 'black');
  assert.ok(f.classList.contains('frame-black'));
  setTitanium(f, 'natural');
  assert.ok(!f.classList.contains('frame-black'));
  assert.equal(f.classList.toString(), '');
});

test('setTitanium ignores invalid finish', () => {
  const f = new FakeEl();
  setTitanium(f, 'rainbow');
  assert.equal(f.classList.toString(), '');
});

// --- formatClock ------------------------------------------------------------

test('formatClock zero-pads hours and minutes', () => {
  assert.equal(formatClock(new Date(2026, 0, 1, 9, 5)), '09:05');
  assert.equal(formatClock(new Date(2026, 0, 1, 23, 59)), '23:59');
  assert.equal(formatClock(new Date(2026, 0, 1, 0, 0)), '00:00');
});

// --- canScreenConsumeWheel (wheel clamp / scroll-trap regression) -----------

test('wheel is consumed only while the screen can scroll in that direction', () => {
  const s = new FakeEl('.phone-screen');
  s.scrollHeight = 1000;
  s.clientHeight = 400; // max scrollTop = 600

  // mid-content: both directions consumable
  s.scrollTop = 300;
  assert.equal(canScreenConsumeWheel(s, 50), true);
  assert.equal(canScreenConsumeWheel(s, -50), true);

  // pinned at top: up should fall through to the page, down still consumed
  s.scrollTop = 0;
  assert.equal(canScreenConsumeWheel(s, -50), false, 'at top, scrolling up must not be trapped');
  assert.equal(canScreenConsumeWheel(s, 50), true);

  // pinned at bottom: down should fall through, up still consumed
  s.scrollTop = 600;
  assert.equal(canScreenConsumeWheel(s, 50), false, 'at bottom, scrolling down must not be trapped');
  assert.equal(canScreenConsumeWheel(s, -50), true);
});

test('wheel falls through entirely when content does not overflow', () => {
  const s = new FakeEl('.phone-screen');
  s.scrollHeight = 300;
  s.clientHeight = 400; // nothing to scroll
  assert.equal(canScreenConsumeWheel(s, 50), false);
  assert.equal(canScreenConsumeWheel(s, -50), false);
});

// --- enhance: wheel handler preventDefaults only when consuming -------------

function buildFrame() {
  const frame = new FakeEl('.phone-frame');
  const screen = new FakeEl();
  screen.classList.add('phone-screen');
  frame.children.push(screen);
  return { frame, screen };
}

test('enhance wires a non-passive wheel handler that respects the clamp', () => {
  const { frame, screen } = buildFrame();
  screen.scrollHeight = 1000;
  screen.clientHeight = 400;
  screen.scrollTop = 0;

  // emulate enhance(root) over a single frame
  const root = new FakeEl();
  root.querySelectorAll = (sel) => (sel === '.phone-frame' ? [frame] : []);
  enhance(root);

  const wheel = frame._listeners.wheel?.[0];
  assert.ok(wheel, 'a wheel listener must be attached');
  assert.equal(wheel.opts.passive, false, 'wheel listener must be non-passive to be able to preventDefault');

  // at top, scrolling up: must NOT preventDefault (lets the page scroll)
  let prevented = false;
  frame.dispatch('wheel', { deltaY: -50, preventDefault() { prevented = true; } });
  assert.equal(prevented, false, 'scroll-up at top must fall through to the page');
  assert.equal(screen.scrollTop, 0);

  // scrolling down with room: consumes + preventDefault
  prevented = false;
  frame.dispatch('wheel', { deltaY: 120, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(screen.scrollTop, 120);
});

// --- enhance idempotency (rapid re-entry must not double-wire) --------------

test('enhance is safe to call repeatedly: one wheel listener, one clock', () => {
  const { frame } = buildFrame();
  const root = new FakeEl();
  root.querySelectorAll = (sel) => (sel === '.phone-frame' ? [frame] : []);

  enhance(root);
  enhance(root);
  enhance(root);

  assert.equal(frame._listeners.wheel.length, 1, 'wheel must be wired exactly once');
});
