// CSS / markup contract tests for liquidframe — run with `node --test`.
// These assert structural invariants of the stylesheet and demo so a future
// edit can't silently drop a safe-area inset, the corner-shape fallback, the
// container query, or the viewport-fit meta. Pure text parsing, zero deps.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = await readFile(join(root, 'liquidframe.css'), 'utf8');
const html = await readFile(join(root, 'index.html'), 'utf8');

const CHROME_MODES = ['compact', 'bottom', 'top', 'pwa'];

// Pull the body of a `.phone-frame.chrome-X { ... }` rule.
function modeRuleBody(mode) {
  const re = new RegExp(`\\.phone-frame\\.chrome-${mode}\\s*\\{([^}]*)\\}`);
  const m = css.match(re);
  return m ? m[1] : null;
}

// --- every chrome mode sets BOTH safe-area insets ---------------------------

for (const mode of CHROME_MODES) {
  test(`chrome-${mode} sets both --sim-safe-top and --sim-safe-bottom`, () => {
    const body = modeRuleBody(mode);
    assert.ok(body, `rule .phone-frame.chrome-${mode} must exist`);
    assert.match(body, /--sim-safe-top:\s*\d+px/, `chrome-${mode} must set --sim-safe-top`);
    assert.match(body, /--sim-safe-bottom:\s*\d+px/, `chrome-${mode} must set --sim-safe-bottom`);
  });
}

test('.phone-frame base sets safe-area fallbacks (so a bare frame still has insets)', () => {
  const m = css.match(/\.phone-frame\s*\{([\s\S]*?)\}/);
  assert.ok(m, '.phone-frame rule must exist');
  assert.match(m[1], /--sim-safe-top:\s*\d+px/);
  assert.match(m[1], /--sim-safe-bottom:\s*\d+px/);
});

// --- corner-shape fallback --------------------------------------------------

test('every corner-shape declaration is paired with a border-radius fallback', () => {
  // Each rule that uses corner-shape must also declare border-radius so older
  // browsers (no corner-shape support) fall back to a rounded arc.
  const ruleRe = /([^{}]*)\{([^}]*corner-shape[^}]*)\}/g;
  let m;
  let count = 0;
  while ((m = ruleRe.exec(css))) {
    const body = m[2];
    count++;
    assert.match(
      body,
      /border-radius:/,
      `rule "${m[1].trim()}" uses corner-shape but has no border-radius fallback`,
    );
  }
  assert.ok(count >= 3, 'expected several corner-shape rules');
});

test('corner-shape is driven by a single inheritable custom property', () => {
  assert.match(css, /--lf-corner:\s*squircle/, 'the squircle token must be defined once');
  assert.match(css, /corner-shape:\s*var\(--lf-corner\)/, 'corner-shape must read the token');
});

// --- container query for the phone viewport ---------------------------------

test('.phone-screen establishes the named "phone" container', () => {
  const m = css.match(/\.phone-screen\s*\{([\s\S]*?)\}/);
  assert.ok(m);
  assert.match(m[1], /container-type:\s*size/);
  assert.match(m[1], /container-name:\s*phone/);
});

test('demo content sizes to the container with cqh units', () => {
  // nested/scoped content must be able to fill the simulated viewport.
  assert.match(html, /min-height:\s*100cqh/);
});

// --- backdrop-filter always has the -webkit- prefix -------------------------

test('every backdrop-filter is paired with a -webkit-backdrop-filter prefix', () => {
  const plain = (css.match(/(?<!-webkit-)backdrop-filter:/g) || []).length;
  const prefixed = (css.match(/-webkit-backdrop-filter:/g) || []).length;
  assert.equal(plain, prefixed, 'each backdrop-filter needs a matching -webkit- prefix for Safari');
  assert.ok(plain >= 3);
});

// --- top capsule calc -------------------------------------------------------

test('top URL capsule is anchored relative to the safe-area-top inset', () => {
  const m = css.match(/\.sim-safari-top-capsule\s*\{([\s\S]*?)\}/);
  assert.ok(m);
  assert.match(m[1], /top:\s*calc\(var\(--sim-safe-top\)\s*-\s*50px\)/);
});

// --- demo accessibility / viewport -----------------------------------------

test('demo sets viewport-fit=cover so real-device safe areas engage', () => {
  assert.match(html, /viewport-fit=cover/);
});

test('demo uses semantic landmarks (header / main / footer)', () => {
  assert.match(html, /<header/);
  assert.match(html, /<main/);
  assert.match(html, /<footer/);
});

test('demo toggle controls expose selection state via aria-pressed', () => {
  // Every chrome-mode and titanium button is a toggle; selection must reach
  // assistive tech, not live only in a CSS .active class.
  const modeBtns = html.match(/<button[^>]*data-mode="[^"]*"[^>]*>/g) || [];
  const finishBtns = html.match(/<button[^>]*data-finish="[^"]*"[^>]*>/g) || [];
  assert.equal(modeBtns.length, 4, 'expected 4 chrome-mode buttons');
  assert.equal(finishBtns.length, 4, 'expected 4 titanium buttons');
  for (const b of [...modeBtns, ...finishBtns]) {
    assert.match(b, /aria-pressed="(true|false)"/, `toggle button needs aria-pressed: ${b}`);
    assert.match(b, /type="button"/, `control button should be type=button: ${b}`);
  }
  // The color swatches have no text, so they need an explicit accessible name.
  for (const b of finishBtns) {
    assert.match(b, /aria-label="[^"]+"/, `icon-only swatch needs an aria-label: ${b}`);
  }
});

test('demo control groups are labelled groups', () => {
  assert.match(html, /id="mode-seg"[^>]*role="group"[^>]*aria-labelledby="mode-label"/);
  assert.match(html, /id="frame-swatches"[^>]*role="group"[^>]*aria-labelledby="frame-label"/);
});

test('demo decorative footer separators are hidden from assistive tech', () => {
  // The "|" separators between footer links are decorative.
  const seps = html.match(/class="footer-separator"[^>]*>/g) || [];
  assert.ok(seps.length > 0, 'expected footer separators');
  for (const s of seps) {
    assert.match(s, /aria-hidden="true"/, `decorative separator must be aria-hidden: ${s}`);
  }
});
