import { toggleMenu } from './icons';

const { addFilter } = window.vendor.wp.hooks;

addFilter( 'divi.iconLibrary.icon.map', 'powdiabb/register-icons', ( icons ) => ( {
	...icons, // Important: without this, every other registered icon gets overwritten.
	[ toggleMenu.name ]: toggleMenu,
} ) );
