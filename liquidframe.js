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

function startClock(el) {
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${hh}:${mm}`;
  };
  tick();
  setInterval(tick, 30000);
}

function wireScreen(frame) {
  const screen = frame.querySelector('.phone-screen');
  if (!screen) return;

  // Redirect desktop wheel events anywhere on the frame into the screen.
  frame.addEventListener(
    'wheel',
    (e) => {
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
