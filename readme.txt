=== Powdi Auto-Hide Builder Bar for Divi ===
Contributors: sewerel
Tags: divi, divi 5, visual builder, builder bar, productivity
Requires at least: 5.8
Tested up to: 7.1
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Adds an auto-hide/show toggle to Divi 5's Visual Builder bar, freeing up canvas space while you work and bringing the bar back when you need it.

== Description ==

Divi 5's Visual Builder keeps its own vertical builder bar pinned to the left edge of the canvas at all times, even while you're focused on the page itself. **Powdi Auto-Hide Builder Bar for Divi** adds a single "Enable show/hide menu" button directly to that bar. Turn it on, and:

* The builder bar hides itself automatically a moment after you move the mouse away from it.
* It reappears automatically as soon as you move the mouse back near the left edge of the screen.
* The sidebars and the page preview reflow correctly each time, so no gap or overlap is left behind.

It works whether or not you have a left or right sidebar open, and it never touches your published page - this is purely a Visual Builder editing convenience.

= How It Works =

* **Activate the plugin**, then open any page in the Divi 5 Visual Builder.
* Click **"Enable show/hide menu"** on the builder bar itself to turn auto-hide on.
* Move the mouse away from the bar and it hides shortly after; rest the mouse near the left edge of the screen and it comes back.
* Click the button again to turn auto-hide off - if the bar was hidden, it's shown again immediately so you're never left without it.

= What This Plugin Does Not Do =

* It has no effect on the front end of your site - it ships no shortcodes and adds nothing to the published page.
* It only appears inside the Divi 5 Visual Builder; it does nothing on Divi 4's classic builder.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/powdi-auto-hide-builder-bar-for-divi` directory, or install the plugin through the WordPress plugins screen.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Open any page in the Divi 5 Visual Builder and click "Enable show/hide menu" on the builder bar.

== Frequently Asked Questions ==

= Does this affect my site's front end? =

No. This is strictly a Divi 5 Visual Builder editing convenience - it has no effect on the published page and ships no shortcodes.

= Does this work with Divi 4? =

No. It relies on Divi 5 Visual Builder APIs (the builder bar button API and the `divi/app-ui` store) that don't exist in Divi 4's classic builder.

= Does it work with the left/right sidebars open? =

Yes. The auto-hide/show behavior works correctly whether a sidebar is open or closed.

= How do I turn it off? =

Click "Enable show/hide menu" again. If the bar happens to be hidden at that moment, it's shown again immediately.

== Documentation ==

If you have any questions about this plugin, please check the FAQ section or post a thread in the WordPress.org forum. Please search existing threads before starting a new one.

== Source Code ==

The full, human-readable source code and build tools for `build/bundle.js` are available at:

https://github.com/sewerel/powdi-auto-hide-builder-bar-for-divi

The bundled file is built from the ES modules under `src/` using webpack and babel-loader (see `webpack.config.js` in the repository). To build it yourself:

1. `npm install`
2. `npm run build` (production) or `npm start` (webpack watch mode)

== Changelog ==

= 1.0.0 =
* Initial release.
* "Enable show/hide menu" button added to the Divi 5 Visual Builder's own left builder bar.
* Auto-hide/auto-show behavior based on mouse position, with sidebars and the preview iframe reflowing correctly.
* Works with and without a left/right sidebar open.
* Button's icon shows a live active-look highlight reflecting whether auto-hide is currently enabled.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
