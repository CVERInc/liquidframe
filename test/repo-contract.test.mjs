// Repo contract tests — run with `node --test`.
// These pin down promises made outside the code (README, package.json, CI
// wiring) so they can't silently drift from what actually works.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(join(root, p), 'utf8');
const readme = await read('README.md');
const js = await read('liquidframe.js');
const ci = await read('.github/workflows/ci.yml');
const testSh = await read('scripts/test.sh');
const pkg = JSON.parse(await read('package.json'));

// --- liquidframe.js load instructions --------------------------------------

test('liquidframe.js is an ES module: it cannot load as a classic <script>', () => {
  // This is why the docs must say <script type="module">.
  assert.throws(() => new vm.Script(js), SyntaxError);
});

test('docs never promise a plain (classic) <script> load', () => {
  for (const [name, text] of [['README.md', readme], ['liquidframe.js header', js]]) {
    assert.doesNotMatch(text, /plain `?<?script>?`?/i, `${name} still documents a plain <script> load`);
    // Every <script ... src=...liquidframe.js> snippet must be a module script.
    for (const tag of text.match(/<script\b[^>]*liquidframe\.js[^>]*>/g) || []) {
      assert.match(tag, /type="module"/, `${name}: ${tag} must use type="module"`);
    }
  }
  assert.match(readme, /<script type="module" src="liquidframe\.js"><\/script>/);
});

// --- release gate wiring ---------------------------------------------------

test('CI runs on v* tag pushes, so the release-tag check is reachable', () => {
  const on = ci.slice(ci.indexOf('\non:'), ci.indexOf('\njobs:'));
  assert.match(on, /push:\s*\n\s+branches:[^\n]*\n\s+tags:\s*\[\s*["']?v\*["']?\s*\]/);
});

test('npm publish runs the release gate in release mode', () => {
  assert.match(pkg.scripts?.prepublishOnly ?? '', /check-release-readiness\.mjs --release\b/);
});

test('the build step says so when there is nothing to build', () => {
  // `npm run build --if-present` alone prints nothing and exits 0, which shows up
  // as a green "Build" step even though nothing was built.
  for (const [name, text] of [['ci.yml', ci], ['scripts/test.sh', testSh]]) {
    assert.match(text, /no build script/, `${name} must report a skipped build`);
  }
});

// --- package metadata -------------------------------------------------------

test('package.json declares the Node version `npm test` needs', () => {
  // `node --test "test/**/*.test.mjs"` relies on glob support added in Node 21.
  assert.equal(pkg.engines?.node, '>=21');
});

test('package.json links back to the GitHub repo', () => {
  assert.equal(pkg.repository?.url, 'git+https://github.com/CVERInc/liquidframe.git');
  assert.ok(pkg.homepage, 'homepage');
  assert.ok(pkg.bugs?.url, 'bugs.url');
});

test('README tells contributors how to enable the pre-push hook', () => {
  assert.match(readme, /git config core\.hooksPath hooks/);
});
