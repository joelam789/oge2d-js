
const del = require('del');
const gulp = require('gulp');
const sourcemap = require('gulp-sourcemaps');
const webserver = require('gulp-webserver');

const transpiler = require('gulp-typescript');
const tsconfig = transpiler.createProject('tsconfig.json');

gulp.task('clear-all', async () => {
    del.sync(["./dist/**/*"]);
});

gulp.task('copy-lib', () => {
    return gulp.src([
        "./jspm_packages/**/*"
        ])
        .pipe(gulp.dest("./dist/jspm_packages/"));
});

gulp.task('copy-index', () => {
    return gulp.src([
        "./index.html"
        ])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('copy-module-config', () => {
    return gulp.src(["./config.js"]).pipe(gulp.dest("./dist/"));
});

gulp.task('backup-module-config', () => {
    return gulp.src(["./config.js"]).pipe(gulp.dest("./tmp/"));
});

gulp.task('restore-module-config', () => {
    return gulp.src(["./tmp/config.js"]).pipe(gulp.dest("./"));
});

gulp.task('copy-template',  () => {
    return gulp.src([
        "./src/**/*.html",
        "./src/**/*.css"
        ])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('copy-resource', () => {
    return gulp.src([
        "./res/**/*"
        ])
        .pipe(gulp.dest("./dist/"));
});

gulp.task("transpile-ts", () => {
    return gulp.src([
        "./src/**/*.ts"
    ])
    .pipe(sourcemap.init({ loadMaps: true }))
    .pipe(tsconfig()).js
    .pipe(sourcemap.write("./", {includeContent: false, sourceRoot: '../src'}))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("watch", () => {
    return gulp.watch(["./index.html", "./src/**/*", "./res/**/*"],
    gulp.series("build-main"));
});

gulp.task("build-main", gulp.series(
             'copy-index',
             'copy-template',
             'copy-resource',
             'transpile-ts')
);

gulp.task("build-and-watch", gulp.series(
            'clear-all',
            ['copy-lib', 'copy-index', 'copy-module-config'],
             'copy-template',
             'copy-resource',
             'transpile-ts',
             'watch')
);

gulp.task('start', () => {
  gulp.src('./')
  .pipe(webserver({
      host: '0.0.0.0',
      port: 9000
    }));
});

gulp.task('default', gulp.series('build-and-watch'));
