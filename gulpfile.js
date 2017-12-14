'use strict'

/* ***************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const del = require('del')
const gulp = require('gulp')
const webpack = require('webpack')
const {fork} = require('child_process')
const statilConfig = require('./statil')
const webpackConfig = require('./webpack.config')

/* ******************************** Globals **********************************/

const _srcDir = 'src'
const _esDir = 'es'
const _distDir = 'dist'
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

const Err = (pluginName, err) => new $.util.PluginError(pluginName, err, {showProperties: false})

/* ********************************* Tasks ***********************************/

/* --------------------------------- Clear ---------------------------------- */

gulp.task('clear', () => (
  // Skips dotfiles like `.git` and `.gitignore`
  del(`${docOutDir}/*`).catch(console.error.bind(console))
))

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
      done(Err('webpack', err))
    }
    else {
      $.util.log('[webpack]', stats.toString(webpackConfig.stats))
      done(stats.hasErrors() ? Err('webpack', 'plugin error') : null)
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
  let proc = null

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
  'docs:fonts:build'
))

gulp.task('watch', gulp.parallel(
  'docs:html:watch',
  'docs:styles:watch',
  'docs:fonts:watch',
  'docs:server'
))

gulp.task('build', gulp.series('clear', 'buildup', 'lint', 'docs:scripts:build'))

gulp.task('default', gulp.series('build', 'watch'))
