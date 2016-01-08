'use strict'

/* ***************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const bsync = require('browser-sync').create()
const del = require('del')
const exec = require('child_process').exec
const flags = require('yargs').boolean('prod').argv
const gulp = require('gulp')
const pt = require('path')
const statilOptions = require('./statil')
const webpack = require('webpack')

/* ******************************** Globals **********************************/

const src = {
  lib: 'lib/**/*.js',
  dist: 'dist/**/*.js',
  main: require('./package').main,
  docHtml: 'docs/html/**/*',
  docScripts: 'docs/scripts/**/*.js',
  docScriptsMain: 'docs/scripts/app.js',
  docStyles: 'docs/styles/**/*.scss',
  docStylesMain: 'docs/styles/app.scss',
  docFonts: 'node_modules/font-awesome/fonts/**/*'
}

const out = {
  lib: 'dist',
  test: 'test/**/*.js',
  docHtml: 'gh-pages',
  docScripts: 'gh-pages/scripts',
  docStyles: 'gh-pages/styles',
  docFonts: 'gh-pages/fonts'
}

const testCommand = require('./package').scripts.test

function reload (done) {
  bsync.reload()
  done()
}

/* ********************************* Tasks ***********************************/

/* ---------------------------------- Lib -----------------------------------*/

gulp.task('lib:clear', done => {
  del(out.lib).then(() => void done())
})

gulp.task('lib:compile', () => (
  gulp.src(src.lib)
    .pipe($.babel())
    .pipe(gulp.dest(out.lib))
))

gulp.task('lib:minify', () => (
  gulp.src(src.dist)
    .pipe($.uglify())
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

gulp.task('lib:build', gulp.series('lib:clear', 'lib:compile', 'lib:minify'))

gulp.task('lib:watch', () => {
  $.watch(src.lib, gulp.series('lib:build', 'lib:test'))
  $.watch(out.test, gulp.series('lib:test'))
})

/* --------------------------------- HTML -----------------------------------*/

gulp.task('docs:html:clear', done => {
  del(out.docHtml + '/**/*.html').then(() => void done())
})

gulp.task('docs:html:compile', () => (
  gulp.src(src.docHtml)
    .pipe($.statil(statilOptions))
    .pipe(gulp.dest(out.docHtml))
))

gulp.task('docs:html:build', gulp.series('docs:html:clear', 'docs:html:compile'))

gulp.task('docs:html:watch', () => {
  $.watch(src.docHtml, gulp.series('docs:html:build', reload))
})

/* -------------------------------- Scripts ---------------------------------*/

function scripts (done) {
  const watch = typeof done !== 'function'

  const alias = {
    'prax/react': pt.join(process.cwd(), 'react.js'),
    'prax/async': pt.join(process.cwd(), 'async.js'),
    'prax': pt.join(process.cwd(), src.main)
  }
  if (flags.prod) {
    alias['react'] = 'react/dist/react.min'
    alias['react-dom'] = 'react-dom/dist/react-dom.min'
  }

  webpack({
    entry: pt.join(process.cwd(), src.docScriptsMain),
    output: {
      path: pt.join(process.cwd(), out.docScripts),
      filename: 'app.js'
    },
    resolve: {alias},
    module: {
      loaders: [
        {
          test: /\.js$/,
          include: pt.join(process.cwd(), 'docs/scripts'),
          loader: 'babel'
        }
      ]
    },
    plugins: flags.prod ? [
      new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}})
    ] : [],
    watch
  }, onComplete)

  function onComplete (err, stats) {
    if (err) throw Error(err)
    const report = stats.toString({
      colors: true,
      chunks: false,
      timings: true,
      version: false,
      hash: false,
      assets: false
    })
    if (report) console.log(report)
    if (stats.hasErrors() && !watch) throw Error('U FAIL')
    if (watch) bsync.reload()
    else done()
  }
}

gulp.task('docs:scripts:build', scripts)

gulp.task('docs:scripts:build:watch', () => void scripts())

/* -------------------------------- Styles ----------------------------------*/

gulp.task('docs:styles:clear', done => {
  del(out.docStyles).then(() => void done())
})

gulp.task('docs:styles:compile', () => (
  gulp.src(src.docStylesMain)
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.if(flags.prod, $.minifyCss({
      keepSpecialComments: 0,
      aggressiveMerging: false,
      advanced: false,
      compatibility: {properties: {colors: false}}
    })))
    .pipe(gulp.dest(out.docStyles))
    .pipe(bsync.reload({stream: true}))
))

gulp.task('docs:styles:build',
  gulp.series('docs:styles:clear', 'docs:styles:compile'))

gulp.task('docs:styles:watch', () => {
  $.watch(src.docStyles, gulp.series('docs:styles:build'))
})

/* --------------------------------- Fonts ----------------------------------*/

gulp.task('docs:fonts:clear', done => {
  del(out.docFonts).then(() => void done())
})

gulp.task('docs:fonts:copy', () => (
  gulp.src(src.docFonts).pipe(gulp.dest(out.docFonts))
))

gulp.task('docs:fonts:build', gulp.series('docs:fonts:copy'))

gulp.task('docs:fonts:watch', () => {
  $.watch(src.docFonts, gulp.series('docs:fonts:build', reload))
})

/* -------------------------------- Server ----------------------------------*/

gulp.task('server', () => (
  bsync.init({
    startPath: '/prax/',
    server: {
      baseDir: out.docHtml,
      middleware (req, res, next) {
        req.url = req.url.replace(/^\/prax\//, '').replace(/^[/]*/, '/')
        next()
      }
    },
    port: 7685,
    online: false,
    ui: false,
    files: false,
    ghostMode: false,
    notify: false
  })
))

/* -------------------------------- Default ---------------------------------*/

if (flags.prod) {
  gulp.task('build', gulp.series(
    'lib:build',
    gulp.parallel('docs:scripts:build', 'docs:html:build', 'docs:styles:build', 'docs:fonts:build')
  ))
} else {
  gulp.task('build', gulp.series(
    'lib:build',
    gulp.parallel('docs:html:build', 'docs:styles:build', 'docs:fonts:build')
  ))
}

gulp.task('watch', gulp.parallel(
  'lib:watch', 'docs:scripts:build:watch', 'docs:html:watch', 'docs:styles:watch', 'docs:fonts:watch'
))

gulp.task('default', gulp.series('build', 'lib:test', gulp.parallel('watch', 'server')))
