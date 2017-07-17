var gulp = require('gulp');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer');
var babel = require("gulp-babel");
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var del = require('del');
var runSequence = require('run-sequence');
var cache = require('gulp-cached');


gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    },
  })
})

gulp.task('reload', function(){
  return gulp.src('dist')
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('sass', function() {
  return gulp.src('app/styles/sass/*.sass')
    .pipe(sass())
    .pipe(sourcemaps.init())
    .pipe(postcss([ autoprefixer() ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('app/styles/css'))
})

gulp.task('babel', function() {
  return gulp.src('app/scripts/es6/**/*.es6')
    .pipe(cache('linting'))
    .pipe(babel())
    .pipe(gulp.dest('app/scripts/js'))
})

gulp.task('clean:dist', function() {
  return del.sync('dist/*');
})

gulp.task('useref', function(){
  return gulp.src('app/*.html')
    .pipe(useref())
    .pipe(gulpIf('app/scripts/js/**/*.js', uglify()))
    .pipe(gulpIf('app/styles/css/*.css', cssnano()))
    .pipe(gulp.dest('dist'))
});

gulp.task('minifyJS', function(){
  return gulp.src('dist/scripts/js/**/*.js')
    .pipe(uglify({compress: true, mangle: true}))
    .pipe(gulp.dest('dist/scripts/js/'))
});

gulp.task('minifyCSS', function(){
  return gulp.src('dist/styles/css/**/*.css')
    .pipe(cssnano())
    .pipe(gulp.dest('dist/styles/css/'))
});

gulp.task('data', function(){
  return gulp.src('app/assets/datasets/**')
    .pipe(gulp.dest('dist/assets/datasets/'))
});

gulp.task('updateDev', function (callback) {
  runSequence('clean:dist', 'data', 'useref', 'reload',
    callback
  )
})

gulp.task('updateProd', function (callback) {
  runSequence('clean:dist', 'data', 'useref', 'minifyJS', 'minifyCSS', 'reload',
    callback
  )
})

gulp.task('watchDev', ['browserSync'], function(){
  gulp.watch('app/styles/**/*.sass', ['sass']);
  gulp.watch('app/scripts/**/*.es6', ['babel']);
  gulp.watch('app/*.html', ['updateDev']);
  gulp.watch('app/styles/**/*.css', ['updateDev']);
  gulp.watch('app/scripts/**/*.js', ['updateDev']);
  // Other watchers
})

gulp.task('watchProd', ['browserSync'], function(){
  gulp.watch('app/styles/**/*.sass', ['sass']);
  gulp.watch('app/scripts/**/*.es6', ['babel']);
  gulp.watch('app/*.html', ['updateProd']);
  gulp.watch('app/styles/**/*.css', ['updateProd']);
  gulp.watch('app/scripts/**/*.js', ['updateProd']);
  // Other watchers
})

gulp.task('default', function (callback) {
  runSequence('sass', 'babel', 'updateDev', ['watchDev'],
    callback
  )
})

gulp.task('gulpProd', function (callback) {
  runSequence('sass', 'babel', 'updateProd', ['watchProd'],
    callback
  )
})

gulp.task('build', function (callback) {
  runSequence('sass', 'babel', ['updateProd'],
    callback
  )
})
