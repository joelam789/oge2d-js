
const del = require('del');
const gulp = require('gulp');
const sourcemap = require('gulp-sourcemaps');

const Builder = require('systemjs-builder');
const bundler = new Builder('./dist');

const transpiler = require('gulp-typescript');
const tsconfig = transpiler.createProject('tsconfig.json');

gulp.task("bundle", async () => {

    bundler.config({
        packages: { ".": { defaultExtension: "js" } }
    });

    let input = 'oge2d-main.js';
    let output = 'dist/oge2d.min.js'

    bundler
    .bundle( input, output, { minify: true, mangle: true } )
    .then(function() {
        // clean-up
        del.sync(["dist/oge2d-main.*"]);
        del.sync(["dist/oge2d/**/*"]);
        del.sync(["dist/oge2d"]);
        console.log('Bundle completed: [' + output + ']');
    })
    .catch(function(err) {
        console.error('Bundling error:');
        console.error(err);
    });
    
});

gulp.task('clear-all', async () => {
    del.sync(["./dist/**/*"]);
});

gulp.task("transpile-ts", () => {
    return gulp.src([
        "./typings/index.d.ts",
        "./src/**/*.ts"
    ])
    .pipe(sourcemap.init({ loadMaps: true }))
    .pipe(tsconfig()).js
    .pipe(sourcemap.write("./", {includeContent: false, sourceRoot: '../src'}))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("build-and-bundle", gulp.series(
			 'clear-all',
             'transpile-ts',
             'bundle')
);

gulp.task('default', gulp.series('build-and-bundle'));
