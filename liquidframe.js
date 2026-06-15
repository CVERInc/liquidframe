/* ===========================================================================
   liquidframe.js — OPTIONAL enhancements for the liquidframe iOS mockup.

   The mockup works with zero JavaScript: chrome modes and titanium finishes
   are plain CSS classes on .phone-frame. This file only adds nice-to-haves:

     • a live status-bar clock          (elements with [data-lf-clock])
     • desktop wheel-scroll into the screen
     • auto-fade the optional .scroll-prompt-overlay once the screen scrolls

   Plus two convenience helpers for swapping classes from your own UI:

     setChromeMode(frame, 'compact' | 'bottom' | 'top' | 'pwa')
     setTitanium(frame, 'natural' | 'desert' | 'black' | 'white')

   Usage (ES module):
     import { enhance, setChromeMode, setTitanium } from './liquidframe.js';
     enhance();                       // enhance every .phone-frame on the page

   Usage (plain script): the script auto-runs enhance() on DOMContentLoaded and
   exposes window.liquidframe = { enhance, setChromeMode, setTitanium }.

   MIT License.
   =========================================================================== */

const CHROME_MODES = ['compact', 'bottom', 'top', 'pwa'];
const TITANIUM_FINISHES = ['natural', 'desert', 'black', 'white'];

export function setChromeMode(frame, mode) {
  if (!frame || !CHROME_MODES.includes(mode)) return;
  CHROME_MODES.forEach((m) => frame.classList.remove('chrome-' + m));
  frame.classList.add('chrome-' + mode);
}

export function setTitanium(frame, finish) {
  if (!frame || !TITANIUM_FINISHES.includes(finish)) return;
  TITANIUM_FINISHES.forEach((f) => frame.classList.remove('frame-' + f));
  // "natural" is the base style (no class); the others override variables.
  if (finish !== 'natural') frame.classList.add('frame-' + finish);
}

// Render the current HH:MM into `el`. Exported for testing; not part of the
// public API surface documented in the README.
export function formatClock(now = new Date()) {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function startClock(el) {
  const tick = () => {
    el.textContent = formatClock();
    // Re-arm aligned to the next minute boundary so the displayed minute is
    // never stale (a fixed 30s interval can lag by up to ~30s after a minute
    // rolls over). +20ms guards against firing a hair early due to timer drift.
    const msToNextMinute = 60000 - (Date.now() % 60000);
    setTimeout(tick, msToNextMinute + 20);
  };
  tick();
}

// Decide whether a wheel delta can still be consumed by the screen in that
// direction. If the screen is already pinned at the top (scrolling up) or the
// bottom (scrolling down), the wheel should fall through to the page instead of
// being trapped on the frame. Exported for testing.
export function canScreenConsumeWheel(screen, deltaY) {
  const max = screen.scrollHeight - screen.clientHeight;
  if (max <= 0) return false; // nothing to scroll
  if (deltaY < 0) return screen.scrollTop > 0; // scrolling up
  if (deltaY > 0) return screen.scrollTop < max; // scrolling down
  return false; // no vertical delta
}

function wireScreen(frame) {
  const screen = frame.querySelector('.phone-screen');
  if (!screen) return;

  // Redirect desktop wheel events anywhere on the frame into the screen — but
  // only swallow the event while the screen can actually scroll further in that
  // direction. At the top/bottom edge we let the wheel bubble so the outer page
  // keeps scrolling instead of being trapped on the mockup.
  frame.addEventListener(
    'wheel',
    (e) => {
      if (!canScreenConsumeWheel(screen, e.deltaY)) return;
      screen.scrollTop += e.deltaY;
      e.preventDefault();
    },
    { passive: false }
  );

  // Fade the optional scroll prompt once the user scrolls.
  const prompt = frame.querySelector('.scroll-prompt-overlay');
  if (prompt) {
    screen.addEventListener(
      'scroll',
      () => {
        prompt.style.opacity = screen.scrollTop > 10 ? '0' : '1';
      },
      { passive: true }
    );
  }
}

// Wire an element at most once, so enhance() is safe to call repeatedly.
function once(el, tag) {
  const key = '__lf_' + tag;
  if (el[key]) return false;
  el[key] = true;
  return true;
}

export function enhance(root = document) {
  root.querySelectorAll('[data-lf-clock]').forEach((el) => once(el, 'clock') && startClock(el));
  root.querySelectorAll('.phone-frame').forEach((el) => once(el, 'frame') && wireScreen(el));
}

if (typeof window !== 'undefined') {
  window.liquidframe = { enhance, setChromeMode, setTitanium };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhance());
  } else {
    enhance();
  }
}
