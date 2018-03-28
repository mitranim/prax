'use strict'

/* ***************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const del = require('del')
const gulp = require('gulp')
const log = require('fancy-log')
const rollup = require('rollup')
const webpack = require('webpack')
const {fork} = require('child_process')
const statilConfig = require('./statil')
const rollupConfig = require('./rollup.config')
const webpackConfig = require('./webpack.config')

/* ******************************** Globals **********************************/

const _srcDir = 'src'
const esDir = 'es'
const distDir = 'dist'
const srcFiles = 'src/**/*.js'
const _esFiles = 'es/**/*.js'
const _distFiles = 'dist/**/*.js'
const docHtmlFiles = 'docs/html/**/*'
const docStyleFiles = 'docs/styles/**/*.scss'
const docStyleMain = 'docs/styles/main.scss'
const docFontFiles = 'node_modules/font-awesome/fonts/**/*'
const docOutDir = 'gh-pages'
const docOutStyleDir = 'gh-pages/styles'
const docOutFontDir = 'gh-pages/fonts'

const GulpErr = msg => ({showStack: false, toString: () => msg})

/* ********************************* Tasks ***********************************/

/* --------------------------------- Clear ---------------------------------- */

gulp.task('clear', async () => {
  try {
    // Skips dotfiles like `.git` and `.gitignore`
    await del([`${distDir}/*`, `${esDir}/*`, `${docOutDir}/*`])
  }
  catch (err) {
    console.error(err)
  }
})

/* -------------------------------- Rollup --------------------------------- */

gulp.task('rollup:build', async () => {
  for (const config of rollupConfig) {
    const bundle = await rollup.rollup(config)
    await bundle.write(config.output)
  }
})

gulp.task('rollup:watch', () => {
  const watcher = rollup.watch(rollupConfig)

  watcher.on('event', event => {
    const {code, input, duration} = event

    if (code === 'START' || code === 'BUNDLE_START' || code === 'END') return

    if (code === 'BUNDLE_END') {
      log('[rollup]', code, input, duration, 'ms')
      return
    }

    log('[rollup]', event)
  })
})

/* --------------------------------- HTML -----------------------------------*/

gulp.task('docs:html:build', () => (
  gulp.src(docHtmlFiles)
    .pipe($.statil(statilConfig))
    .pipe(gulp.dest(docOutDir))
))

gulp.task('docs:html:watch', () => {
  $.watch(docHtmlFiles, gulp.series('docs:html:build'))
})

/* -------------------------------- Styles ----------------------------------*/

gulp.task('docs:styles:build', () => (
  gulp.src(docStyleMain)
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.cleanCss({
      keepSpecialComments: 0,
      aggressiveMerging: false,
      advanced: false,
      compatibility: {properties: {colors: false}},
    }))
    .pipe(gulp.dest(docOutStyleDir))
))

gulp.task('docs:styles:watch', () => {
  $.watch(docStyleFiles, gulp.series('docs:styles:build'))
})

/* -------------------------------- Fonts -----------------------------------*/

gulp.task('docs:fonts:build', () => (
  gulp.src(docFontFiles).pipe(gulp.dest(docOutFontDir))
))

gulp.task('docs:fonts:watch', () => {
  $.watch(docFontFiles, gulp.series('docs:fonts:build'))
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
  gulp.src(srcFiles)
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
    proc = fork('./devserver')
  }

  restart()
  $.watch(['./webpack.config.js', './devserver.js'], restart)
})

/* -------------------------------- Default ---------------------------------*/

gulp.task('buildup', gulp.parallel(
  'docs:html:build',
  'docs:styles:build',
  'docs:fonts:build',
))

gulp.task('watch', gulp.parallel(
  'rollup:watch',
  'docs:html:watch',
  'docs:styles:watch',
  'docs:fonts:watch',
  'docs:server',
))

gulp.task('build', gulp.series('clear', 'buildup', 'lint', 'rollup:build', 'docs:scripts:build'))

gulp.task('default', gulp.series('build', 'watch'))
