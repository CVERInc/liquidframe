# Changelog

All notable changes to liquidframe are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

## [0.1.0]

- Initial release: pure-CSS iPhone 16 Pro mockup with iOS 26 Liquid Glass Safari
  chrome (Compact / Bottom / Top / PWA), zero dependencies.
