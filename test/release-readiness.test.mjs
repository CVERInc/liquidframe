// Tests for scripts/check-release-readiness.mjs — run with `node --test`.
// Each case builds a throwaway repo fixture and runs the gate against it, with
// an explicit environment so a CI run on a tag can't leak GITHUB_REF_NAME in.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'check-release-readiness.mjs');

const RELEASED_ONLY = `# Changelog

## [Unreleased]

## [1.2.0]

- Something shipped.
`;

const PENDING_CHANGES = `# Changelog

## [Unreleased]

### Fixed
- A fix that has not been released yet.

## [1.2.0]

- Something shipped.
`;

async function runGate(t, { changelog, ref, args = [] }) {
  const dir = await mkdtemp(join(tmpdir(), 'lf-readiness-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name: 'fixture', version: '1.2.0' }));
  await writeFile(join(dir, 'CHANGELOG.md'), changelog);
  await writeFile(join(dir, '.release-readiness.json'), JSON.stringify({ pack: false }));
  const env = { PATH: process.env.PATH };
  if (ref) env.GITHUB_REF_NAME = ref;
  const res = spawnSync(process.execPath, [script, ...args], { cwd: dir, env, encoding: 'utf8' });
  return { status: res.status, out: res.stdout + res.stderr };
}

test('day-to-day (branch) runs accept pending [Unreleased] entries', async (t) => {
  const r = await runGate(t, { changelog: PENDING_CHANGES, ref: 'main' });
  assert.equal(r.status, 0, r.out);
});

test('a release tag run fails while [Unreleased] still has entries', async (t) => {
  const r = await runGate(t, { changelog: PENDING_CHANGES, ref: 'v1.2.0' });
  assert.notEqual(r.status, 0, `expected failure, got:\n${r.out}`);
  assert.match(r.out, /Unreleased/);
});

test('--release (used by prepublishOnly) fails while [Unreleased] still has entries', async (t) => {
  const r = await runGate(t, { changelog: PENDING_CHANGES, args: ['--release'] });
  assert.notEqual(r.status, 0, `expected failure, got:\n${r.out}`);
  assert.match(r.out, /Unreleased/);
});

test('a release run passes once [Unreleased] is emptied into the version section', async (t) => {
  assert.equal((await runGate(t, { changelog: RELEASED_ONLY, ref: 'v1.2.0' })).status, 0);
  assert.equal((await runGate(t, { changelog: RELEASED_ONLY, args: ['--release'] })).status, 0);
});

test('a release tag must match the package version', async (t) => {
  const r = await runGate(t, { changelog: RELEASED_ONLY, ref: 'v1.3.0' });
  assert.notEqual(r.status, 0);
  assert.match(r.out, /release tag v1\.3\.0 must match/);
});
