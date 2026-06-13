#!/usr/bin/env bash
# Single entry point for this repo's check — the SAME steps GitHub Actions runs, so the local
# pre-push hook and CI can never disagree. Exits non-zero on the first failure.
# (Mirrors .github/workflows/ci.yml: install · test · build · release-readiness.)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d node_modules ] && { [ -f package-lock.json ] || [ -f package.json ]; }; then
  echo "→ install deps"
  if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
fi

echo "→ test";  npm test --if-present
echo "→ build"; npm run build --if-present
echo "→ release readiness"; node scripts/check-release-readiness.mjs
echo "✅ ALL GREEN"
