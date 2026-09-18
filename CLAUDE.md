# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Divi 5 Visual Builder extension. It adds an "Enable show/hide menu" button to the VB's own
left vertical builder bar (`.et-vb-builder-bar-wrap`) that turns on an **auto-hide** behavior:
while enabled, the bar hides itself 300ms after the mouse stops hovering it, and reappears 300ms
after the mouse rests within 15px of the left edge of the screen — both via `divi/app-ui` store
dispatches, so the optional left/right sidebars and the `#et-vb-app-frame` preview iframe reflow
correctly to reclaim/restore the freed horizontal space each time. This is an editor-only
feature — it has no effect on the published frontend page, and ships no shortcodes.

(Earlier version of this plugin was a frontend shortcode-based show/hide modal popup, named
`divi-modal`. That feature was dropped entirely when the plugin's purpose changed. The
plugin was later renamed from `divi-modal` to its current slug/prefix once the auto-hide feature
was working, for a more descriptive WordPress.org-friendly name and to avoid leading with the
trademarked "Divi" in the plugin name. Both PHP (`POWDIABB_*` constants/`powdiabb_*` functions)
and JS-side namespacing (button/icon names, CSS classes, the icon-registration filter namespace,
all `powdiabb/...` or `powdiabb-...`) use the same `powdiabb` token — no separator between "powdi"
and "abb" anywhere, brand and feature-code read as one word.)

## Why this needs a build step

Divi 5's builder-bar button API (`registerBuilderBarButton`, on `window.divi.appUi`) and its
`divi/app-ui` Redux-style store (`dispatch` on `window.divi.data`) only exist as runtime globals
inside the Visual Builder's "app window" (the `#et-vb-app-frame` iframe) — code reads them
directly off `window.divi.*`/`window.vendor.*` (see Architecture below), so no external-package
mapping is needed. The build step exists purely to combine `src/`'s several ES modules into the
single `build/bundle.js` file `powdi-auto-hide-builder-bar-for-divi.php` enqueues.

## Architecture

- `powdi-auto-hide-builder-bar-for-divi.php` — plugin bootstrap. Defines `POWDIABB_*` constants
  (functions are prefixed `powdiabb_` too — no underscore between the brand and the rest, so
  WordPress.org's plugin-check tooling reads the whole thing as one `powdi`-prefixed token rather
  than splitting on the underscore) and, on the
  `divi_visual_builder_assets_before_enqueue_scripts` hook (gated behind
  `et_core_is_fb_enabled() && et_builder_d5_enabled()`), calls
  `\ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build()` to enqueue
  `build/bundle.js` into the VB's **app window** (`enqueue_app_window => true`), depending on the
  theme's own `divi-app-ui`/`divi-data` script handles, printed `in_footer` so it runs after the
  core VB bundle has actually registered the `divi/app-ui` store (registering it as a normal
  head-printed script raced that registration and threw on load).
- `src/index.js` — bundle entry point; imports `register-icon` and `builder-bar-toggle`.
- `src/builder-bar-toggle.js` — the core feature. Two pieces of state:
  `featureEnabled` (toggled by the button — is auto-hide turned on at all) and `barHidden` (is the
  bar currently hidden as a result of it), both plain module-level variables, not read from the
  store.
  - `registerBuilderBarButton({ name, label: 'Enable show/hide menu', iconSvg, order, onClick })`
    registers the button itself; `onClick` is `toggleBuilderBar()`, which flips `featureEnabled`
    via `setFeatureEnabled()`.
  - `setFeatureEnabled(enabled)` toggles the button's active look (see below), lazily attaches
    **two** `mousemove` listeners (`ensureMouseTracking()` — attached once, left attached forever,
    early-returning internally when the feature is off), and — if the feature is being turned off
    while the bar is hidden — force-shows it again so the user isn't left stuck.
  - **Why two listeners**: the page has two separate event-capturing documents — the top window
    (hosts `.et-vb-builder-bar-wrap`, the sidebars, `#et-vb-app-frame` as a plain iframe element)
    and the app window, which **is** `#et-vb-app-frame`'s own `contentDocument` (the same document
    this whole script runs in, since it's enqueued with `enqueue_app_window: true`). Mouse events
    never cross an iframe boundary, so a listener on only one of these documents goes silent
    whenever the cursor is over the other one. With a sidebar open there's enough top-window-native
    gutter space between the bar and the iframe for `handleMouseMove()` alone to work; with no
    sidebar, the iframe sits almost flush against the bar, so the cursor enters the iframe's own
    document almost immediately — hence `handleIframeMouseMove()`, attached to our own local
    `document` (no cross-frame reaching needed, we're already inside it).
  - `handleMouseMove(event, topDocument)` (top window) and `handleIframeMouseMove(event)` (canvas)
    share the same two timer helpers, `maybeStartShowTimer(clientX)` and `maybeStartHideTimer()`,
    each just passing their own document-local `event.clientX` — **no cross-window coordinate
    conversion**, deliberately: for the canvas listener, "iframe-local x ≈ 0" is treated as close
    enough to "screen's true left edge" for this UX affordance, since precise conversion
    (accounting for the iframe's own `transform: scale(...)`) was judged not worth the complexity.
    - Hide side: top-window handler re-queries `.et-vb-builder-bar-wrap` (its DOM node comes and
      goes, so this can't be cached) and only starts the 300ms (`HOVER_DELAY_MS`) hide timer once
      the cursor's outside its `getBoundingClientRect()`; the iframe handler skips that check
      entirely — any event there already proves the cursor isn't over the bar (the two areas are
      disjoint).
    - Show side (`maybeStartShowTimer`): starts a 300ms timer once `clientX <= 15`
      (`EDGE_ZONE_PX`), regardless of sidebar state (an earlier version also required the left
      sidebar to be closed, but that broke the real case where a sidebar is open and `x=0` is
      still reachable/expected to work). Only `clientX` is checked (no vertical range), per spec.
  - `applyBarHidden(hidden)` is the actual `divi/app-ui` dispatch: `setElementVisibility({
    elementName: 'builderBar', visibility: !hidden })` plus `setElementProperty({
    elementName: 'builderBar', propertyGroup: 'dimension', propertyName: 'width', value: hidden ?
    0 : 48 })`. Both are needed — visibility alone unmounts the bar but leaves its last-known
    width in the store, so `#et-vb-app-frame`'s margin-left/width/scale (computed from store state
    via the `getAppFrameStyle` selector, not DOM measurement) would still leave a gap.
  - The button's icon also gets a live active-look highlight (blue stroke) reflecting
    `featureEnabled` (not the momentary `barHidden`), driven entirely via CSS cascade, not by
    touching Divi's own DOM nodes: `injectActiveStyles()` injects one `<style>` tag (once) with a
    rule like `body.powdiabb-auto-hide-enabled .et-vb-icon--powdiabb-toggle-menu svg g {
    stroke: #326BFF !important }`, keyed off the icon's *stable* class name (which doesn't change
    with state); `setFeatureEnabled()` just toggles the `powdiabb-auto-hide-enabled` class on
    `<body>`.
    **Why not toggle classes/attributes directly on the button's own DOM node**: earlier attempts
    doing that (`classList.toggle('...--active', ...)`, `path.setAttribute('stroke', ...)`) worked
    until the button was hovered — Divi re-renders it on hover (its own local hover state in the
    button-row component), and React's reconciliation resets any className/attribute we'd set
    directly on elements it owns back to what its (frozen, registration-time) props dictate. A
    `<style>` tag and a class on `<body>` are both outside Divi's render tree, so nothing there is
    ever reset by a React re-render — the CSS cascade just keeps applying regardless. (There is no
    store-driven alternative either: Divi only live-updates a third-party button's `--active`
    class by matching a currently-active `divi/modal-library` entry sharing the button's `name`,
    confirmed against `d5-dev-tool`'s own button — registering a fake modal purely to borrow that
    mechanism was judged not worth the indirection for a feature that isn't a modal.)
- `src/register-icon.js` / `src/icons/` — registers a custom icon (vertical bar + a slashed eye,
  representing "toggle the builder bar's visibility") via
  `addFilter('divi.iconLibrary.icon.map', ...)` from `window.vendor.wp.hooks`, used by the in-bar
  button. **Gotcha**: Divi renders a registered icon via `React.createElement(component,
  iconComponentProps)` — React invokes `component` as `component(props)`, i.e. the icon's
  `component` export must destructure `{ color }` from a props object (matching built-in Divi
  icons' own signatures, e.g. `({color = '...'}) => ...`), **not** accept `color` as a bare first
  argument — the latter renders `stroke="[object Object]"` instead of an actual color (hit this
  live; root-caused against `includes/builder-5/visual-builder/build/icon-library.js` in the
  theme). A second Divi CSS rule, `svg *[fill]:not(.et-vb-svg-nofill)`, force-overwrites any
  fill-bearing shape to `var(--medium-gray)` — the icon's `rect`/`path` (which need
  `fill: 'none'`) carry the `et-vb-svg-nofill` class to opt back out of that rule.
- `webpack.config.js` — only bundles our own `src/` files together (ES `import`/`export`) via
  `babel-loader`. Divi/WP packages aren't imported at all; source reads them straight off the
  globals Divi's own enqueued packages expose at runtime — `window.divi.appUi`,
  `window.divi.data`, `window.vendor.wp.hooks`, `window.vendor.React` — so there's no
  `externals` config and nothing to install as a real npm dependency for them.

## Working in this repo

- Build step required: `npm install` once, then `npm run build` (production) or `npm start`
  (webpack watch mode) after any change under `src/`.
  `powdi-auto-hide-builder-bar-for-divi.php` only enqueues `build/bundle.js` if it exists.
  `build/bundle.js` is committed to git (not gitignored) so the plugin works when deployed without
  running a build step on the server.
- There are no automated tests. Verify changes by loading a page in the Divi 5 Visual Builder
  (`?et_fb=1`) and confirming the button appears/toggles correctly, and that the auto-hide/show
  behavior works both with and without a left/right sidebar open — this cannot be verified via
  static analysis.
- The `divi/app-ui` store's `elementName` enum (for `setElementProperty`/`setElementVisibility`/
  `getElementProperty`/`isElementVisible`) is: `adminBar`, `appArea`, `appFrame`,
  `brandedModalHeader`, `builderBar`, `diviTopMenu`, `pageBar`, `sidebarLeft`, `sidebarRight`.
  This is undocumented (extracted from the theme's minified `visual-builder/build/app-ui.js`) —
  don't assume other element names exist without verifying against that bundle.
