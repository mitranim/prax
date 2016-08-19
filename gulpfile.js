'use strict'

/* ***************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const del = require('del')
const {exec, fork} = require('child_process')
const gulp = require('gulp')
const statilConfig = require('./statil')
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')

/* ******************************** Globals **********************************/

const prod = process.env.NODE_ENV === 'production'

const src = {
  lib: 'lib/**/*.js',
  dist: 'dist/**/*.js',
  docHtml: 'docs/html/**/*',
  docStyles: 'docs/styles/**/*.scss',
  docStylesMain: 'docs/styles/app.scss',
  docFonts: 'node_modules/font-awesome/fonts/**/*'
}

const out = {
  lib: 'dist',
  test: 'test/**/*.js',
  docHtml: 'gh-pages',
  docStyles: 'gh-pages/styles',
  docFonts: 'gh-pages/fonts'
}

const testCommand = require('./package').scripts.test

function noop () {}

/* ********************************* Tasks ***********************************/

/* ---------------------------------- Lib -----------------------------------*/

gulp.task('lib:clear', () => (
  del(out.lib).catch(noop)
))

gulp.task('lib:clear-min', () => (
  del(out.lib + '/**/*.min.js').catch(noop)
))

gulp.task('lib:compile', () => (
  gulp.src(src.lib)
    .pipe($.babel())
    .pipe(gulp.dest(out.lib))
))

gulp.task('lib:minify', () => (
  gulp.src(src.dist)
    .pipe($.uglify({
      mangle: true,
      compress: {screw_ie8: true}
    }))
    .pipe($.rename(path => {
      path.extname = '.min.js'
    }))
    .pipe(gulp.dest(out.lib))
))

gulp.task('lib:test', done => {
  exec(testCommand, (err, stdout) => {
    process.stdout.write(stdout)
    done(err)
  })
})

gulp.task('lib:build', gulp.series('lib:compile', 'lib:minify'))

gulp.task('lib:rebuild', gulp.series('lib:clear', 'lib:build'))

gulp.task('lib:watch', () => {
  $.watch(src.lib, gulp.parallel('lib:test', gulp.series('lib:clear-min', 'lib:build')))
  $.watch(out.test, gulp.series('lib:test'))
})

/* --------------------------------- HTML -----------------------------------*/

gulp.task('docs:html:clear', () => (
  del(out.docHtml + '/**/*.html').catch(noop)
))

gulp.task('docs:html:compile', () => (
  gulp.src(src.docHtml)
    .pipe($.statil(statilConfig))
    .pipe(gulp.dest(out.docHtml))
))

gulp.task('docs:html:build', gulp.series('docs:html:clear', 'docs:html:compile'))

gulp.task('docs:html:watch', () => {
  // No html:clear because it confuses browsersync's file watcher
  $.watch(src.docHtml, gulp.series('docs:html:compile'))
})

/* -------------------------------- Scripts ---------------------------------*/

gulp.task('docs:scripts:build', done => {
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      throw new $.util.PluginError('webpack', err, {showProperties: false})
    }
    $.util.log('[webpack]', stats.toString(webpackConfig.stats))
    if (stats.hasErrors()) {
      throw new $.util.PluginError('webpack', 'plugin error', {showProperties: false})
    }
    done()
  })
})

/* -------------------------------- Styles ----------------------------------*/

gulp.task('docs:styles:clear', () => (
  del(out.docStyles).catch(noop)
))

gulp.task('docs:styles:compile', () => (
  gulp.src(src.docStylesMain)
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.cleanCss({
      keepSpecialComments: 0,
      aggressiveMerging: false,
      advanced: false,
      compatibility: {properties: {colors: false}}
    }))
    .pipe(gulp.dest(out.docStyles))
))

gulp.task('docs:styles:build',
  gulp.series('docs:styles:clear', 'docs:styles:compile'))

gulp.task('docs:styles:watch', () => {
  $.watch(src.docStyles, gulp.series('docs:styles:build'))
})

/* --------------------------------- Fonts ----------------------------------*/

gulp.task('docs:fonts:clear', () => (
  del(out.docFonts).catch(noop)
))

gulp.task('docs:fonts:copy', () => (
  gulp.src(src.docFonts).pipe(gulp.dest(out.docFonts))
))

gulp.task('docs:fonts:build', gulp.series('docs:fonts:copy'))

gulp.task('docs:fonts:watch', () => {
  $.watch(src.docFonts, gulp.series('docs:fonts:build'))
})

/* -------------------------------- Server ----------------------------------*/

gulp.task('docs:server', () => {
  let buildServerProc
  let wsServerProc

  function restartBuildServer () {
    if (buildServerProc) buildServerProc.kill()
    buildServerProc = fork('./devserver')
  }

  function restartWsServer () {
    if (wsServerProc) wsServerProc.kill()
    wsServerProc = fork('./mock-ws-server')
  }

  restartBuildServer()
  $.watch(['./webpack.config.js', './devserver.js'], restartBuildServer)

  restartWsServer()
  $.watch(['./mock-ws-server.js'], restartWsServer)
})

/* -------------------------------- Default ---------------------------------*/

gulp.task('build', gulp.series(
  'lib:clear', 'lib:build',
  !prod
  ? gulp.parallel('docs:html:build', 'docs:styles:build', 'docs:fonts:build')
  : gulp.parallel('docs:scripts:build', 'docs:html:build', 'docs:styles:build', 'docs:fonts:build')
))

gulp.task('watch', gulp.parallel(
  'lib:watch', 'docs:html:watch', 'docs:styles:watch', 'docs:fonts:watch', 'docs:server'
))

gulp.task('default', gulp.series('build', 'lib:test', 'watch'))
