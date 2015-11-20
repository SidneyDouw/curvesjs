var gulp 			= require('gulp'),
	del 			= require('del'),
	rjs 			= require('gulp-requirejs-optimize'),
	util			= require('gulp-util'),
	watch 			= require('gulp-watch'),
 	sourcemaps 		= require('gulp-sourcemaps'),
	concat 			= require('gulp-concat'),
	less 			= require('gulp-less'),
	cssnext 		= require('gulp-cssnext'),
	csslint			= require('gulp-csslint'),
	minifyCss		= require('gulp-minify-css'),
	jshint			= require('gulp-jshint'),
	jsStylish 		= require('jshint-stylish'),
	mainBowerFiles 	= require('main-bower-files'),
	browserSync		= require('browser-sync'),
	config 			= require('./gulp-config.js'),
	src 			= config.paths.src,
	dest 			= config.paths.dest,
	options 		= config.options;


var makeSourcemap = util.env.sm ? true : false;

var buildScript = {
    paths: {
    	jquery: "../../bower_components/jquery/dist/jquery.min",
    	almond: "../../bower_components/almond/dist/almond"
    },

    include: ['almond', 'script'],
    exclude: ['jquery'],

    out: 'script.min.js',
    wrap: {
    	startFile: "wrapS.start",
    	endFile: "wrapS.end"
    }
}
var buildLib1 = {
    paths: {
    	jquery: "../../bower_components/jquery/dist/jquery.min",
    	almond: "../../bower_components/almond/dist/almond"
    },

    include: ['almond', 'main'],
    exclude: ['jquery'],

    out: 'curveEditor.min.js',
    wrap: {
    	startFile: "wrap.start",
    	endFile: "wrap.end"
    }
}
var buildLib2 = {
    paths: {
    	jquery: "../../bower_components/jquery/dist/jquery.min",
    	almond: "../../bower_components/almond/dist/almond"
    },

    include: ['almond', 'main'],
    exclude: ['jquery'],

    optimize: 'none',

    out: 'curveEditor.js',
    wrap: {
    	startFile: "wrap.start",
    	endFile: "wrap.end"
    }
}


gulp.task('test', function(){
	console.log("Gulp is up and running. Happy Coding!");
});

gulp.task('delete', function(cb) {
	return del([dest.build]);
});

gulp.task('index', function() {
	gulp.src(src.index)
	.pipe(gulp.dest(dest.build))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('php', function() {
	gulp.src(src.php)
	.pipe(gulp.dest(dest.php))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('css', function() {
	gulp.src(src.less)
	.pipe(less().on('error', function(err) {
		errorLog(err);
	}))
	.pipe(makeSourcemap ? sourcemaps.init() : util.noop())
	.pipe(cssnext(options.cssnext).on('error', function(err) {
		errorLog(err);
	}))
	.pipe(csslint(options.csslint))
	.pipe(csslint.reporter())
	.pipe(minifyCss())
	.pipe(concat('styles.min.css'))
	.pipe(makeSourcemap ? sourcemaps.write('./') : util.noop())
	.pipe(gulp.dest(dest.css))
	.pipe(browserSync.reload({stream: true}));
});

gulp.task('js', function() {
	gulp.src(src.js)
	.pipe(jshint().on('error', function(err) {
		errorLog(err);
	}))
	.pipe(jshint.reporter(jsStylish));

	return gulp.src('src/js/script.js')
		.pipe(makeSourcemap ? sourcemaps.init() : util.noop())
        .pipe(rjs(buildScript).on('error', function(err) {
			errorLog(err);
		}))
        .pipe(makeSourcemap ? sourcemaps.write('./') : util.noop())
        .pipe(gulp.dest(dest.js))
        .pipe(browserSync.reload({stream: true}));
});
gulp.task('buildLib', function() {	
		gulp.src('src/js/main.js')
		.pipe(sourcemaps.init())
        .pipe(rjs(buildLib1))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/'));

        gulp.src('src/js/main.js')
        .pipe(rjs(buildLib2))
        .pipe(gulp.dest('dist/'));
});

gulp.task('img', function() {	
	gulp.src(src.img)
	.pipe(gulp.dest(dest.img));
});

gulp.task('font', function() {	
	gulp.src(src.font)
	.pipe(gulp.dest(dest.font));
});

gulp.task('libs', function() {
	gulp.src(mainBowerFiles())
	.pipe(gulp.dest(dest.libs))
});

gulp.task('build', ['delete'], function(){
	gulp.start(['index', 'php', 'css', 'js', 'img', 'font', 'libs']);
});

gulp.task('browserSync', function(){
	browserSync({
		proxy: config.paths.proxy,
        port: 3000,
        open: true,
        notify: false
	});
});

gulp.task('watch', ['browserSync'], function(){
	watch(src.index, function(event){
		gulp.start('index');
	});
	watch(src.php, function(event){
		gulp.start('php');
	});
	watch(src.less, function(event){
		gulp.start('css');
	});
	watch(src.js, function(event){
		gulp.start('js');
	});
});

gulp.task('default', ['build', 'watch'])


function errorLog(err) {
	console.log('- - - - - - - - - - - - - - - - - - - -\n\n'+
				util.colors.red(err.toString())+
				'\n\n- - - - - - - - - - - - - - - - - - - -');
};