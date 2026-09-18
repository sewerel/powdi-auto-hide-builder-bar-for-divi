/**
 * "Bar + eye-slash" glyph for the builder-bar toggle button: a vertical
 * rectangle (the builder bar itself) next to an eye with a diagonal strike
 * through it (visibility toggle), registered into Divi's icon library (see
 * ../register-icon.js) and referenced by name from
 * ../builder-bar-toggle.js's registerBuilderBarButton() call.
 */
export const name = 'powdiabb/toggle-menu';
export const viewBox = '0 0 28 28';
export const component = ( { color = '#A2B0C1' } = {} ) => {
	const React = window.vendor.React;

	return React.createElement(
		'g',
		{ fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
		// Divi forces `fill: var(--medium-gray)` on any svg child that has a `fill`
		// attribute at all (`.et-vb-builder-bar-wrap [type=button] svg *[fill]:not(.et-vb-svg-nofill)`),
		// so an explicit fill="none" needs the et-vb-svg-nofill class to opt back out of that rule.
		React.createElement( 'rect', {
			x: 4, y: 6, width: 5, height: 16, rx: 1,
			fill: 'none', className: 'et-vb-svg-nofill',
		} ),
		React.createElement( 'path', {
			d: 'M11 14c1.8-2.4 4.2-3.8 7-3.8s5.2 1.4 7 3.8c-1.8 2.4-4.2 3.8-7 3.8s-5.2-1.4-7-3.8z',
			fill: 'none', className: 'et-vb-svg-nofill',
		} ),
		React.createElement( 'circle', { cx: 18, cy: 14, r: 1.8 } ),
		React.createElement( 'line', { x1: 10, y1: 20, x2: 26, y2: 8 } )
	);
};
