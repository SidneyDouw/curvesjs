/* gulp-config.js */
module.exports = {
	paths: {
		src: {
			index: 'src/index.php',
			php:   'src/php/**/*.php',
			less:  'src/css/**/*.less',
			js:    'src/js/**/*.js',
			img:   'src/img/**/*',
			font:  'src/font/**/*'
		},
		dest: {
			build: 'test/',
			php:   'test/php/',
			css:   'test/css/',
			js:    'test/js/',
			img:   'test/img/',
			font:  'test/font/',
			libs:  'test/js/libs/'
		}
	},
	options: {
		cssnext: {
     	   browsers: '> 1%, last 2 versions, Firefox ESR, Opera 12.1'
    	},
		csslint: {
			'ids': false,
			'fallback-colors': false,
			'box-model': false,
			'outline-none': false,
			'compatible-vendor-prefixes': false,
			'adjoining-classes': false
		}
	}
}
