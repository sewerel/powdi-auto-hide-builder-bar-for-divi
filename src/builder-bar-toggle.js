import { name as toggleMenuIconName } from './icons/toggle-menu';

const { registerBuilderBarButton } = window.divi.appUi;
const { dispatch } = window.divi.data;

const ELEMENT_NAME = 'builderBar';
const BUTTON_NAME = 'powdiabb/toggle-builder-bar';

// Divi derives the icon wrapper's CSS class by replacing "/" with "-" in its
// registered name (see app-ui.js's button-row renderer).
const ICON_CLASS = `et-vb-icon--${ toggleMenuIconName.replace( /\//g, '-' ) }`;

// Divi re-renders our button on hover (its own local hover state in the
// button-row component), which resets any className/attribute we set
// directly on its DOM node - a third-party button's `active` field and
// iconSvg color are frozen at registration time (the ADD_BUILDER_BAR_BUTTON
// reducer dedupes/no-ops on re-registration), so there's no supported way to
// make Divi's own re-render reflect our state. Instead of fighting React's
// reconciliation on elements it owns, we keep a persistent <style> tag
// (outside Divi's render tree, so React never touches it) and flip a class
// on <body> (also outside that tree) to drive it via the CSS cascade -
// immune to re-renders since nothing here is DOM Divi manages. This class
// tracks whether the auto-hide FEATURE is enabled, not the bar's momentary
// shown/hidden state.
const FEATURE_ENABLED_CLASS = 'powdiabb-auto-hide-enabled';
const STYLE_ID = 'powdiabb-active-style';

// The BuilderBar component watches its own wrapper with a ResizeObserver and
// self-corrects this back to 48 or 60 (depending on whether its icons wrap to a
// second row) as soon as it remounts, so this is only a placeholder value for
// the single frame between "visibility:true" and that observer firing.
const RESTORED_WIDTH = 48;

const HOVER_DELAY_MS = 300;
const EDGE_ZONE_PX = 15;

// Whether the auto-hide feature is turned on (toggled by the button).
let featureEnabled = false;
// Whether the bar is currently hidden as a result of that feature.
let barHidden = false;

let hideTimer = null;
let showTimer = null;
let trackingAttached = false;

function clearHideTimer() {
	if ( hideTimer ) {
		clearTimeout( hideTimer );
		hideTimer = null;
	}
}

function clearShowTimer() {
	if ( showTimer ) {
		clearTimeout( showTimer );
		showTimer = null;
	}
}

function injectActiveStyles( topDocument ) {
	if ( topDocument.getElementById( STYLE_ID ) ) {
		return;
	}

	const style = topDocument.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = `
body.${ FEATURE_ENABLED_CLASS } .${ ICON_CLASS } svg g {
	stroke: #326BFF !important;
}
`;
	topDocument.head.appendChild( style );
}

/**
 * Hide/show the builder bar and keep the app-ui store's builderBar width in
 * sync, so #et-vb-app-frame's margin-left/width/scale (and the sidebars'
 * offsets) recompute to reclaim/restore the freed space. See docs/ for the
 * research trail on why this can't be done with CSS alone.
 */
function applyBarHidden( hidden ) {
	barHidden = hidden;

	const appUi = dispatch( 'divi/app-ui' );

	appUi.setElementVisibility( { elementName: ELEMENT_NAME, visibility: ! hidden } );
	appUi.setElementProperty( {
		elementName: ELEMENT_NAME,
		propertyGroup: 'dimension',
		propertyName: 'width',
		value: hidden ? 0 : RESTORED_WIDTH,
	} );
}

function isPointInRect( x, y, rect ) {
	return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Starts the show-delay timer once the given (document-local) x is within
 * the left-edge zone, cancelling it if the cursor drifts back out first.
 * Shared by both the top-window and iframe mousemove handlers, each passing
 * their own local event.clientX - no cross-window coordinate conversion.
 */
function maybeStartShowTimer( clientX ) {
	if ( clientX <= EDGE_ZONE_PX ) {
		if ( ! showTimer ) {
			showTimer = setTimeout( () => {
				showTimer = null;
				applyBarHidden( false );
			}, HOVER_DELAY_MS );
		}
	} else {
		clearShowTimer();
	}
}

/** Shared by both handlers' "cursor is outside the bar" branch. */
function maybeStartHideTimer() {
	if ( ! hideTimer ) {
		hideTimer = setTimeout( () => {
			hideTimer = null;
			applyBarHidden( true );
		}, HOVER_DELAY_MS );
	}
}

/**
 * Top-window mousemove handler. Only fires while the cursor is over the top
 * window's own DOM (the bar, sidebars, gutters) - NOT over #et-vb-app-frame,
 * which is a separate document/window that never forwards its own mouse
 * events here. See handleIframeMouseMove() for that coverage gap.
 */
function handleMouseMove( event, topDocument ) {
	if ( ! featureEnabled ) {
		return;
	}

	if ( barHidden ) {
		clearHideTimer();
		maybeStartShowTimer( event.clientX );
		return;
	}

	clearShowTimer();

	const wrap = topDocument.querySelector( '.et-vb-builder-bar-wrap' );
	const withinBar = !! wrap && isPointInRect( event.clientX, event.clientY, wrap.getBoundingClientRect() );

	if ( withinBar ) {
		clearHideTimer();
	} else {
		maybeStartHideTimer();
	}
}

/**
 * Our own script's `document` IS #et-vb-app-frame's contentDocument (it's
 * enqueued with enqueue_app_window:true) - so this needs no cross-frame
 * reaching. Covers all the mouse movement over the canvas/iframe area that
 * handleMouseMove() above can never see. Any event here already proves the
 * cursor isn't over the bar (the two areas are disjoint), so the hide side
 * needs no bounding-rect check - unlike the top-window handler.
 */
function handleIframeMouseMove( event ) {
	if ( ! featureEnabled ) {
		return;
	}

	if ( barHidden ) {
		clearHideTimer();
		maybeStartShowTimer( event.clientX );
		return;
	}

	clearShowTimer();
	maybeStartHideTimer();
}

function ensureMouseTracking( topDocument ) {
	if ( trackingAttached ) {
		return;
	}

	trackingAttached = true;
	topDocument.addEventListener( 'mousemove', ( event ) => handleMouseMove( event, topDocument ) );
	document.addEventListener( 'mousemove', handleIframeMouseMove );
}

export function isFeatureEnabled() {
	return featureEnabled;
}

export function setFeatureEnabled( enabled ) {
	featureEnabled = enabled;

	const topDocument = window.top.document;

	injectActiveStyles( topDocument );
	topDocument.body.classList.toggle( FEATURE_ENABLED_CLASS, enabled );
	ensureMouseTracking( topDocument );

	clearHideTimer();
	clearShowTimer();

	if ( ! enabled && barHidden ) {
		applyBarHidden( false );
	}
}

export function toggleBuilderBar() {
	setFeatureEnabled( ! isFeatureEnabled() );
}

registerBuilderBarButton( {
	name: BUTTON_NAME,
	label: 'Enable show/hide menu',
	iconSvg: { name: toggleMenuIconName },
	order: 1,
	onClick: toggleBuilderBar,
} );
