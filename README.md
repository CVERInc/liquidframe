# liquidframe

> **A pure-CSS iPhone 16 Pro with a realistic iOS 26 "Liquid Glass" Safari shell.** Titanium frame, Dynamic Island, protruding buttons — and the part nobody else mocks up: Safari's chrome in every layout (Compact, Bottom, Top) plus standalone PWA. Swap one class to change the mode. Drop your page into the screen. No build step, no dependencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-success)](#)
[![Pure CSS](https://img.shields.io/badge/core-pure%20CSS-blue)](#)

---

## Why

Plenty of device mockups draw a nice iPhone. Almost none draw the **browser chrome** correctly — and on iOS 26 that chrome is the hard part: the frosted "Liquid Glass" URL pill, the three different Safari layouts, and the fact that each layout reports **different safe-area insets** that push your content around.

`liquidframe` reproduces all of it in plain CSS so you can show a web page exactly as it appears on a real iPhone — in screenshots, marketing pages, design reviews, docs, or a library demo.

---

## Quick start

Copy `liquidframe.css` (and optionally `liquidframe.js`) into your project, then:

```html
<link rel="stylesheet" href="liquidframe.css">

<div class="phone-frame chrome-compact">
  <div class="phone-btn phone-btn-action"></div>
  <div class="phone-btn phone-btn-volup"></div>
  <div class="phone-btn phone-btn-voldown"></div>
  <div class="phone-btn phone-btn-power"></div>
  <div class="phone-notch"></div>

  <div class="phone-viewport">
    <div class="status-bar-info"><div><span data-lf-clock>9:41</span></div><div><!-- icons --></div></div>

    <!-- Safari chrome (all three included; CSS shows the right one per mode) -->
    <!-- copy these blocks from index.html -->

    <div class="home-indicator-area"></div>

    <div class="phone-screen">
      <!-- 👇 YOUR PAGE GOES HERE -->
    </div>
  </div>
</div>
```

The fastest path is to **open `index.html`, view source, and copy the whole `.phone-frame` block** — the Safari chrome markup (status bar icons, URL pills, button rows) is verbose and already wired up there.

---

## Chrome modes

Change the mode by swapping **one class** on `.phone-frame`. No JavaScript needed.

| Class | iOS layout | What shows |
|---|---|---|
| `chrome-compact` | Compact (default) | 3-capsule bottom bar: `[◁] [▢ url ↻] [···]` |
| `chrome-bottom` | Bottom | One card: URL row **+** buttons row |
| `chrome-top` | Top | URL pill up top, slim buttons bar at the bottom |
| `chrome-pwa` | Standalone PWA | No Safari chrome, minimal insets |

Each mode also sets the correct `--sim-safe-top` / `--sim-safe-bottom` insets, so content padded with `var(--sim-safe-bottom)` reflows just like on a real device.

---

## Theming

Set these CSS variables on `.phone-frame` (or `:root`):

| Variable | Default | Purpose |
|---|---|---|
| `--screen-bg` | `#ffffff` | Backdrop shown in the rubber-band / overscroll area |
| `--chrome-top` | `transparent` | Tint painted behind the status bar |
| `--chrome-bot` | `transparent` | Tint painted in the bottom safe-area band |
| `--status-fg` | `#fff` | Status bar text / icon color |

```html
<div class="phone-frame chrome-compact" style="--chrome-top:#0a8c8e; --chrome-bot:#0a8c8e; --status-fg:#fff;">
```

> Tinting `--chrome-top` / `--chrome-bot` is exactly how you'd demo a chrome-tinting library, or preview a themed app.

### Titanium finishes

Add a finish class to `.phone-frame` (no class = Natural Titanium):

`frame-desert` · `frame-black` · `frame-white`

---

## Optional JavaScript

The mockup is fully functional with zero JS. `liquidframe.js` only adds conveniences:

```js
import { enhance, setChromeMode, setTitanium } from './liquidframe.js';

enhance();                         // live clock, wheel-scroll, scroll-prompt fade
setChromeMode(phoneEl, 'top');     // swap chrome mode from your own UI
setTitanium(phoneEl, 'black');     // swap titanium finish
```

- `enhance(root?)` — starts a live clock on any `[data-lf-clock]` element, redirects desktop wheel scrolling into the screen, and fades any `.scroll-prompt-overlay`.
- Loaded as a plain `<script>`, it auto-runs `enhance()` and exposes `window.liquidframe`.

---

## Anatomy

```
.phone-frame.chrome-compact     ← mode + titanium classes live here
├── .phone-btn ×4               physical side buttons
├── .phone-notch                Dynamic Island
└── .phone-viewport
    ├── .status-bar-info        clock + signal/wifi/battery
    ├── .sim-safari-top-capsule       Safari "Top" URL pill
    ├── .sim-safari-bottom-liquid-bar Safari "Bottom" bar
    ├── .sim-safari-compact-bar       Safari "Compact" 3-capsule bar
    ├── .home-indicator-area    bottom safe-area band
    └── .phone-screen           ← your scrollable content
```

The screen is a [container](https://developer.mozilla.org/docs/Web/CSS/CSS_containment/Container_queries) named `phone`, so content can size to the viewport with `min-height: 100cqh`.

---

## Browser support

Works anywhere `backdrop-filter` and CSS container queries are supported — every current evergreen browser (Chrome, Safari, Firefox, Edge). It renders identically on desktop and mobile; it is a *visual mockup*, not a behavioral emulator.

## License

MIT
