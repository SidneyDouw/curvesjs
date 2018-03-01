const MinifyPlugin = require('babel-minify-webpack-plugin');
const UglifyPlugin = require('uglifyjs-webpack-plugin');


module.exports = {
	paths: {
		src: {
			html: 	'src/*.html',
			less:   'src/css/*.less',
			js:     'src/js/**/*.js',
			jsMain: 'src/js/index.js'
		},
		dest: {
			root:   'dist/'
		},
		test: {
			root: 	'test/',
			css:  	'test/css/',
			js:	  	'test/js/'
		}
	},

	browserSync: {
		server: 'test/'
	},
	
	webpack: {
		output: {
			filename: 'curves.min.js',
			library: 'Curve',
			libraryTarget: "umd",
			libraryExport: "default"
		},
		devtool: 'source-map',
		plugins: [
			new UglifyPlugin({
				sourceMap: true
			})
		]
    }
}