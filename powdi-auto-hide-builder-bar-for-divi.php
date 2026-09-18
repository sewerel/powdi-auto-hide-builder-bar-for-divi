<?php
/**
 * Plugin Name:       Powdi Auto-Hide Builder Bar for Divi
 * Plugin URI:         https://wordpress.org/plugins/powdi-auto-hide-builder-bar-for-divi/
 * Description:        Adds an "Enable show/hide menu" button to the Divi 5 Visual Builder's builder bar: auto-hides it 300ms after the mouse leaves, and reveals it again 300ms after the mouse rests near the left edge (reflowing the sidebars/preview iframe to match).
 * Version:            1.0.0
 * Requires at least:  5.8
 * Requires PHP:       7.4
 * Author:             Powdi Themes
 * Author URI:         https://powdithemes.com
 * License:             GPL v2 or later
 * License URI:         https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:         powdi-auto-hide-builder-bar-for-divi
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'POWDIABB_VERSION', '1.0.0' );
define( 'POWDIABB_FILE', __FILE__ );
define( 'POWDIABB_PATH', plugin_dir_path( __FILE__ ) );
define( 'POWDIABB_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register the builder-bar-toggle bundle with Divi 5's Visual Builder.
 *
 * Only runs when the Divi 5 Visual Builder framework is active; the built bundle
 * (build/bundle.js) is loaded into the VB's "app window" (the iframe that hosts
 * window.divi.data and the React app), where it calls registerBuilderBarButton()
 * from @divi/app-ui and wires up the toggle via @divi/data's dispatch/select.
 */
function powdiabb_register_vb_assets() {
	if ( ! (
		function_exists( 'et_core_is_fb_enabled' ) && et_core_is_fb_enabled()
		&& function_exists( 'et_builder_d5_enabled' ) && et_builder_d5_enabled()
	) ) {
		return;
	}

	if ( ! class_exists( '\ET\Builder\VisualBuilder\Assets\PackageBuildManager' ) ) {
		return;
	}

	$bundle_path = POWDIABB_PATH . 'build/bundle.js';

	if ( ! file_exists( $bundle_path ) ) {
		return;
	}

	\ET\Builder\VisualBuilder\Assets\PackageBuildManager::register_package_build(
		array(
			'name'    => 'powdiabb-builder-bar-toggle',
			'version' => POWDIABB_VERSION,
			'script'  => array(
				'src'                => POWDIABB_URL . 'build/bundle.js',
				'deps'               => array( 'divi-app-ui', 'divi-data' ),
				'enqueue_top_window' => false,
				'enqueue_app_window' => true,
				// registerBuilderBarButton()/dispatch('divi/app-ui') require the app-ui
				// store to already be registered (done during the core VB bundle's own
				// bootstrap) - printing in the footer, like Elegant Themes' own
				// create-custom-builder-bar-button tutorial does, avoids a race where our
				// top-level registration call runs before that store exists yet.
				'args'               => array( 'in_footer' => true ),
			),
		)
	);
}
add_action( 'divi_visual_builder_assets_before_enqueue_scripts', 'powdiabb_register_vb_assets' );
