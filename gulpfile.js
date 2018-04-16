'use strict'

/* ***************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const del = require('del')
const gulp = require('gulp')
const log = require('fancy-log')
const webpack = require('webpack')
const cp = require('child_process')
const {Transform} = require('stream')
const webpackConfig = require('./webpack.config')

/* ******************************** Globals **********************************/

const srcScriptFiles = 'src/**/*.js'
const srcDocHtmlFiles = 'docs/html/**/*'
const srcDocStyleFiles = 'docs/styles/**/*.scss'
const srcDocStyleMain = 'docs/styles/main.scss'
const srcDocFontFiles = 'node_modules/font-awesome/fonts/**/*'

const outEsDir = 'es'
const outDistDir = 'dist'
const outDocDir = 'gh-pages'
const outDocStyleDir = 'gh-pages/styles'
const outDocFontDir = 'gh-pages/fonts'

const GulpErr = msg => ({showStack: false, toString: () => msg})

const PROD = process.env.NODE_ENV === 'production'

const COMMIT = cp.execSync('git rev-parse --short HEAD').toString().trim()

process.env.COMMIT = COMMIT

const VERSION = require('./package.json').version

/* ********************************* Tasks ***********************************/

/* --------------------------------- Clear ---------------------------------- */

gulp.task('clear', async () => {
  try {
    // Skips dotfiles like `.git` and `.gitignore`
    await del([`${outDistDir}/*`, `${outEsDir}/*`, `${outDocDir}/*`])
  }
  catch (err) {
    console.error(err)
  }
})

/* ---------------------------------- Lib ---------------------------------- */

gulp.task('lib:build', () => (
  gulp.src(srcScriptFiles)
    .pipe($.babel())
    .pipe(gulp.dest(outEsDir))
    .pipe($.babel({
      plugins: [
        'transform-es2015-modules-commonjs',
      ],
    }))
    .pipe(gulp.dest(outDistDir))
    // Ensures ES5 compliance and lets us measure minified size
    .pipe($.uglify({
      mangle: {toplevel: true},
      compress: {warnings: false},
    }))
    .pipe(new Transform({
      objectMode: true,
      transform(file, __, done) {
        log(`Minified size: ${file.relative} — ${file._contents.length} bytes`)
        done()
      },
    }))
))

gulp.task('lib:watch', () => {
  $.watch(srcScriptFiles, gulp.series('lib:build'))
})

/* --------------------------------- HTML -----------------------------------*/

gulp.task('docs:html:build', () => (
  gulp.src(srcDocHtmlFiles)
    .pipe($.statil({imports: {PROD, VERSION, COMMIT}}))
    .pipe(gulp.dest(outDocDir))
))

gulp.task('docs:html:watch', () => {
  $.watch(srcDocHtmlFiles, gulp.series('docs:html:build'))
})

/* -------------------------------- Styles ----------------------------------*/

gulp.task('docs:styles:build', () => (
  gulp.src(srcDocStyleMain)
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.cleanCss({
      keepSpecialComments: 0,
      aggressiveMerging: false,
      advanced: false,
      compatibility: {properties: {colors: false}},
    }))
    .pipe(gulp.dest(outDocStyleDir))
))

gulp.task('docs:styles:watch', () => {
  $.watch(srcDocStyleFiles, gulp.series('docs:styles:build'))
})

/* -------------------------------- Fonts -----------------------------------*/

gulp.task('docs:fonts:build', () => (
  gulp.src(srcDocFontFiles).pipe(gulp.dest(outDocFontDir))
))

gulp.task('docs:fonts:watch', () => {
  $.watch(srcDocFontFiles, gulp.series('docs:fonts:build'))
})

/* -------------------------------- Scripts ---------------------------------*/

gulp.task('docs:scripts:build', done => {
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      done(GulpErr(err))
    }
    else {
      log('[webpack]', stats.toString(webpackConfig.stats))
      done(stats.hasErrors() ? GulpErr('webpack error') : undefined)
    }
  })
})

/* --------------------------------- Lint ---------------------------------- */

gulp.task('lint', () => (
  gulp.src(srcScriptFiles)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError())
))

/* -------------------------------- Server ----------------------------------*/

gulp.task('docs:server', () => {
  let proc = undefined

  process.on('exit', () => {
    if (proc) proc.kill()
  })

  function restart () {
    if (proc) proc.kill()
    proc = cp.fork('./devserver')
  }

  restart()
  $.watch(['./webpack.config.js', './devserver.js'], restart)
})

/* -------------------------------- Default ---------------------------------*/

gulp.task('buildup', gulp.parallel(
  'lib:build',
  'docs:html:build',
  'docs:styles:build',
  'docs:fonts:build'
))

gulp.task('watch', gulp.parallel(
  'lib:watch',
  'docs:html:watch',
  'docs:styles:watch',
  'docs:fonts:watch',
  'docs:server'
))

gulp.task('build', gulp.series('clear', 'buildup', 'lint', 'docs:scripts:build'))

gulp.task('default', gulp.series('build', 'watch'))
