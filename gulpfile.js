const gulp = require('gulp');
const del = require('del');
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const livereload = require('gulp-livereload');
const gulprename = require("gulp-rename");
const gulpexec = require('gulp-exec');
const minify = require('gulp-minify')
const tslint = require('gulp-tslint');
const utf8Convert = require('gulp-utf8-convert');

const tscConfig = require('./tsconfig.json');

var debugsource = false;

var sources = {
    html: ["./src/package.json","./src/index.html","./src/views/**/*.html"],
    css: "./src/css/**/*.css",
    ts: ["./src/modules/**/*.{ts,js}", "./src/lib/**/*.{ts,js}"],
    //js: ["./src/modules/**/*.js","./src/lib/**/*.js"],
    assets: "./src/assets/**/*",
    csshtm: ["./src/package.json","./src/index.html","./src/**/*.{css,html}"],
};
var destinations = {
    dist: "./charger/"
};


gulp.task('csshtm', function () {
    gulp.src(sources.csshtm, { base: './src' })
    .pipe(gulp.dest(destinations.dist));
});

gulp.task('assets', function () {
    gulp.src(sources.assets, { base: './src' })
  .pipe(gulp.dest(destinations.dist));
});

gulp.task('copy', ['csshtm','assets'], function () {
    gulp.src([
        "node_modules/core-js/client/shim.min.js",
    ]).pipe(gulp.dest(destinations.dist))
});

gulp.task('compile', function () {
    return gulp
    .src(sources.ts, { base: './src' })
    .pipe(sourcemaps.init())
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(minify({
        ext: {
            src: '.js',
            min: '.js'
        },
        ignoreFiles: ['.js.map', '-min.js'],
        noSource: !debugsource
    }))
    .pipe(sourcemaps.write('.'))
   .pipe(gulp.dest(destinations.dist));
});

//gulp.task('copyjs', function () {
//    return gulp
//        .src(sources.js, { base: './src' })
//        .pipe(minify({
//                ext: {
//                    src: '.js',
//                    min: '.js'
//                },
//                ignoreFiles: ['.js.map', '-min.js'],
//                noSource: !debugsource
//            }))
//        .pipe(gulp.dest(destinations.dist))
//        .pipe(livereload());
//});

//gulp.task('reloadHtml', function () {
//    gulp.src(sources.html)
//    .pipe(utf8Convert())
//    .pipe(gulp.dest(destinations.dist))
//    .pipe(livereload());
//});

//gulp.task('reloadCss', function () {
//    gulp.src(sources.css)
//    .pipe(gulp.dest(destinations.dist))
//    .pipe(livereload());
//});

//gulp.task('reloadTs', function () {
//    gulp.src(sources.ts)
//    .pipe(sourcemaps.init())
//    .pipe(typescript(tscConfig.compilerOptions))
//    .pipe(minify({
//        ext: {
//            src: '.js',
//            min: '.js'
//        },
//        ignoreFiles: ['.js.map', '-min.js'],
//        noSource: !debugsource
//    }))
//    .pipe(sourcemaps.write('.'))
//   .pipe(gulp.dest(destinations.dist));
//});

gulp.task("watch",['copy'], function () {
    livereload.listen();    
    gulp.watch(sources.html).on('change', function (event) {
        gulp.src([event.path], { base: './src' })
        .pipe(gulp.dest(destinations.dist))
        .pipe(livereload());
    });
    gulp.watch(sources.css).on('change', function (event) {
        gulp.src([event.path], { base: './src' })
        .pipe(gulp.dest(destinations.dist))
        .pipe(livereload());
    });
    //gulp.watch(sources.js).on('change', function (event) {
    //    console.log('Prepare', event.path + '...');
    //    gulp.src([event.path], { base: './src' })
    //    .pipe(minify({
    //        ext: {
    //            src: '.js',
    //            min: '.js'
    //        },
    //        ignoreFiles: ['.js.map', '-min.js'],
    //        noSource: !debugsource
    //    }))
    //    .pipe(gulp.dest(destinations.dist))
    //    .pipe(livereload());
    //});
    gulp.watch(sources.ts).on('change', function (event) {
        console.log('Transpile',event.path+'...');
        gulp.src([event.path], { base: './src' })
        .pipe(sourcemaps.init())
        .pipe(typescript(tscConfig.compilerOptions))
        .pipe(minify({
                ext: {
                    src: '.js',
                    min: '.js'
                },
                ignoreFiles: ['.js.map', '-min.js'],
                noSource: !debugsource
            }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destinations.dist))
        .pipe(livereload());
    });
});

del.sync(['dist/**/*']);
gulp.task('default', ['copy','compile', 'watch']);