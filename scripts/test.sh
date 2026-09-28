#!/usr/bin/env bash
# Single entry point for this repo's check — the SAME steps GitHub Actions runs, so the local
# pre-push hook and CI can never disagree. Exits non-zero on the first failure.
# (Mirrors .github/workflows/ci.yml: install · test · build · release-readiness.)
set -euo pipefail
cd "$(dirname "$0")/.."

# Zero-dependency repos never get a node_modules/, so only install when something is declared.
has_deps=$(node -e "const p=require('./package.json');process.stdout.write(Object.keys({...p.dependencies,...p.devDependencies,...p.optionalDependencies}).length?'1':'')")
if [ -n "$has_deps" ] && [ ! -d node_modules ]; then
  echo "→ install deps"
  if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
fi

echo "→ test";  npm test --if-present
if node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)"; then
  echo "→ build"; npm run build
else
  echo "→ build: skipped (no build script in package.json)"
fi
echo "→ release readiness"; node scripts/check-release-readiness.mjs
echo "✅ ALL GREEN"
