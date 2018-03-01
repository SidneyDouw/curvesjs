const gulp 	= require('gulp');
const plugins = require('gulp-load-plugins')({pattern: ['*'],
											rename: {'jshint': 'jshintG'}});
const config 	= require('./gulp-config.js');



gulp.task('plugins', function() {
	console.log(plugins);
});


gulp.task('clear', clear);

gulp.task('html', html);
gulp.task('less', less);
gulp.task('js', js);

gulp.task('build', ['clear', 'html', 'less', 'js']);

gulp.task('browserSync', ['build'], browserSync);

gulp.task('default', ['build', 'browserSync'], function() {

	gulp.watch(config.paths.src.html, ['html']);
	gulp.watch(config.paths.src.less, ['less']);
	gulp.watch(config.paths.src.js, ['js']);

});

// Gulp Functions



function browserSync() {

	plugins.browserSync.init(config.browserSync);
    
}



function clear() {

	plugins.del(config.paths.dest.root);
	plugins.del(config.paths.test.root);

}



function html() {

	return gulp.src(config.paths.src.html)
	.pipe(gulp.dest(config.paths.test.root))
	.pipe(plugins.browserSync.stream());

}



function js() {

	gulp.src(config.paths.src.js)
	.pipe(plugins.jshint({
		esversion: 6
	}))
	.pipe(plugins.jshint.reporter('jshint-stylish'));

	return gulp.src(config.paths.src.jsMain)
	.pipe(plugins.webpackStream(config.webpack, plugins.webpack))
	.on('error', function() {
		this.emit('end');
	})
	.pipe(gulp.dest(config.paths.dest.root))
	.pipe(gulp.dest(config.paths.test.js))
	.pipe(plugins.browserSync.stream());

}



function less() {

    return gulp.src(config.paths.src.less)
	.pipe(plugins.plumber(function(error) {
		plugins.util.log(plugins.util.colors.red('--------------------------------------------------\n\n'))
		plugins.util.log(plugins.util.colors.red('Error (' + error.plugin + '):\n' + error.message + '\n\n'));
		plugins.util.log(plugins.util.colors.red('--------------------------------------------------\n'))
	}))
	.pipe(plugins.concat('styles.css'))
	.pipe(plugins.sourcemaps.init())
	.pipe(plugins.less())
	.on('error', function() {
		this.emit('end');
	})
	.pipe(plugins.sourcemaps.write())
	.pipe(gulp.dest(config.paths.test.css))
	.pipe(plugins.browserSync.stream());

}