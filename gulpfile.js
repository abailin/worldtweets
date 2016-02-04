var gulp = require('gulp'),
		uglify = require('gulp-uglify'),
		plumber = require('gulp-plumber'),
		rename = require('gulp-rename'),
		concat = require('gulp-concat');

var js = [
	'./bower_components/d3/d3.js',
	'./bower_components/jquery/dist/jquery.js',
	'./bower_components/topojson/topojson.js',
	'./public/js/worldtweets.js',
];

gulp.task('js', function () {
	return gulp.src(js)
		.pipe(concat('app.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('public/js'));
});