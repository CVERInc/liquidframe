# Changelog

All notable changes to liquidframe are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- README and the `liquidframe.js` header no longer claim the script works as a
  classic `<script>`: it is an ES module, and that load fails with
  `Unexpected token 'export'`. The no-import usage is now documented as
  `<script type="module" src="liquidframe.js"></script>`.
- This changelog: the fixes below under 0.1.0 were already in the published
  0.1.0 tarball but had been listed as unreleased.

### Added
- `package.json`: `repository` / `homepage` / `bugs` links, `engines.node >=21`
  (what `npm test` needs), and a `prepublishOnly` release gate.
- Tests for the live clock's minute-boundary re-arm, one-clock-per-element
  idempotency, the browser auto-run path, the release gate, and repo contracts.

### Changed
- Release gate: on a `v*` tag run or with `--release` (as `prepublishOnly`
  runs it) it now fails while `[Unreleased]` still has entries. CI also runs on
  `v*` tag pushes so the tag/version check is actually exercised.
- CI and `scripts/test.sh` print that the build was skipped when there is no
  build script, instead of a silent green step; `scripts/test.sh` no longer
  re-runs `npm ci` on every run in a zero-dependency repo.

### Documentation
- README: how to enable the tracked pre-push hook (`git config core.hooksPath hooks`).

## [0.1.0] - 2026-08-04

- Initial release: pure-CSS iPhone 16 Pro mockup with iOS 26 Liquid Glass Safari
  chrome (Compact / Bottom / Top / PWA), zero dependencies.

### Fixed
- Desktop wheel-scroll no longer traps the page: the frame only swallows a wheel
  event while the screen can still scroll in that direction, so reaching the top
  or bottom of the mockup lets the outer page keep scrolling.
- Live status-bar clock re-arms on the minute boundary instead of a fixed 30s
  interval, so the displayed minute can no longer lag by up to ~30s.

### Accessibility
- Demo: chrome-mode and titanium toggle buttons now expose their selection
  state via `aria-pressed` (previously visual-only), color swatches carry an
  `aria-label`, and each control row is a labelled `role="group"`.

### Added
- A zero-dependency `node --test` suite (`npm test`) covering chrome-mode and
  titanium class swaps, clock formatting, the wheel clamp, `enhance()`
  idempotency, and CSS/markup contracts (per-mode safe-area insets, the
  `corner-shape` border-radius fallback, the `phone` container query,
  `-webkit-backdrop-filter` pairing, and demo a11y landmarks).

### Documentation
- README: documented `corner-shape` browser support + the automatic
  `border-radius` fallback, and clarified the auto-`enhance()` / idempotency
  behavior of the optional script.
