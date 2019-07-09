
const fs = require("fs");
const del = require('del');
const gulp = require('gulp');
const sourcemap = require('gulp-sourcemaps');
const webserver = require('gulp-webserver');
const archiver = require('archiver');

const Builder = require('systemjs-builder');
const bundler = new Builder('./dist');

const jsonlint = require("gulp-jsonlint");

const tsconfig = require('gulp-typescript').createProject('tsconfig.json');

gulp.task('pack', async () => {

    let packSetting = JSON.parse(fs.readFileSync('./app-pack.json', 'utf8'));
    let inputDir = packSetting.inputDir; let outputDir = packSetting.outputDir;
    let fileNames = Object.keys(packSetting.packs);
    let outputFilepaths = [], outputFiles = [];
    for (let fileName of fileNames) {
        let outputFilePath = outputDir + '/' + fileName + '.pack';
        if (fs.existsSync(outputFilePath)) del.sync(outputFilePath);
        let output = fs.createWriteStream(outputFilePath);
        outputFilepaths.push(output.path);
        outputFiles.push(output);
    }
    for (let i=0; i<outputFiles.length; i++) {
        let outputFile = outputFiles[i];
        let fileName = fileNames[i];
        let archive = archiver('zip', { zlib: { level: 9 } });
        console.log('Creating archive file: ' + outputFile.path + ' ... ');
        outputFile.on('close', function() {

            console.log('Created - [' + this.path + ']');

            // may do simple encryption here ...
            if (packSetting.encryption === true) {
                let zipBuffer = fs.readFileSync(this.path);
                let simpleKeys = [111, 103, 101, 50, 100];
                for (let k=0; k<zipBuffer.length; k++) zipBuffer[k] = zipBuffer[k] ^ simpleKeys[k % simpleKeys.length];
                if (fs.existsSync(this.path + ".data")) del.sync(this.path + ".data");
                fs.writeFileSync(this.path + ".data" , zipBuffer, {encoding: "binary"});
            }

            let idx = outputFilepaths.indexOf(this.path);
            if (idx >= 0) outputFilepaths.splice(idx, 1);
            if (outputFilepaths.length <= 0) {
                console.log('All archive tasks are completed');
                if (packSetting.cleanup === true) {
                    for (let packFileName of fileNames) {
                        let originalFiles = packSetting.packs[packFileName];
                        for (let originalFile of originalFiles) {
                            del.sync([inputDir + '/' + originalFile]);
                        }
                    }
                    console.log('Removed files after archived them');
                }
            }

        }.bind(outputFile));
        archive.on('error', function(err) { throw err; });
        archive.pipe(outputFile);
        let inputFiles = packSetting.packs[fileName];
        for (let inputFile of inputFiles) {
            archive.append(fs.createReadStream(inputDir + '/' + inputFile), { name: inputFile });
        }
        archive.finalize();
    }
    
});

gulp.task("bundle", async () => {

    bundler.config({
        packages: { ".": { defaultExtension: "js" } }
    });

    let input = 'games/**/*.js + scenes/**/*.js + sprites/**/*.js + systems/**/*.js';
    let output = 'dist/shooting.min.js'

    bundler
    .bundle( input, output, { minify: true, mangle: true } )
    .then(function() {
        // clean-up
        del.sync(["dist/games/**/*"]);
        del.sync(["dist/games"]);
        del.sync(["dist/scenes/**/*"]);
        del.sync(["dist/scenes"]);
        del.sync(["dist/sprites/**/*"]);
        del.sync(["dist/sprites"]);
        del.sync(["dist/systems/**/*"]);
        del.sync(["dist/systems"]);
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

gulp.task('copy-index', () => {
    return gulp.src([
        "./index.html"
        ])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('create-fake-bundle', async () => {
    let code = "console.log('fake bundle is loaded');";
    fs.writeFileSync('./dist/shooting.min.js', code, 'utf8');
});

gulp.task('copy-resource', () => {
    return gulp.src([
        "./res/**/*"
        ])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('copy-game-content', () => {
    return gulp.src([
        "./src/**/*.json"
        ])
        .pipe(jsonlint())
        .pipe(jsonlint.failOnError())
        .pipe(gulp.dest("./dist/json/"));
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

gulp.task("watch", function () {
    return gulp.watch(["./index.html", "./src/**/*", "./res/**/*"],
    gulp.series("build-main"));
});

gulp.task("build-main", gulp.series(
             'copy-index',
             'copy-resource',
             'copy-game-content',
             'transpile-ts')
);

gulp.task("build-and-watch", gulp.series(
             'clear-all',
             'copy-index',
             'copy-resource',
             'copy-game-content',
             'create-fake-bundle',
             'transpile-ts',
             'watch')
);

gulp.task("build-and-bundle", gulp.series(
             'clear-all',
             'copy-index',
             'copy-resource',
             'copy-game-content',
             'pack',
             'transpile-ts',
             'bundle')
);

gulp.task("copy-and-pack", gulp.series(
             'clear-all',
             'copy-resource',
             'copy-game-content',
             'pack')
);

gulp.task('start', function() {
  gulp.src('./')
  .pipe(webserver({
      host: "0.0.0.0",
      port: 9090
    }));
});

gulp.task('default', gulp.series('build-and-watch'));
