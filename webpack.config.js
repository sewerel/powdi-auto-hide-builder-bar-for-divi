const path = require( 'path' );

module.exports = ( env, argv ) => ( {
	entry: './src/index.js',
	mode: argv.mode === 'development' ? 'development' : 'production',
	devtool: argv.mode === 'development' ? 'cheap-module-source-map' : false,
	// No externals: Divi/WP packages are read straight off window.divi.* / window.vendor.*
	// in source (see src/builder-bar-toggle.js, src/register-icon.js, src/icons/toggle-menu.js)
	// instead of going through import specifiers, so nothing needs mapping here.
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [ [ '@babel/preset-env', { targets: '> 0.5%, not dead' } ] ],
					},
				},
			},
		],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve( __dirname, 'build' ),
	},
} );
