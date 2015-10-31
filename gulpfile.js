'use strict'

/**
 * Requires gulp 4.0:
 *   "gulp": "gulpjs/gulp#4.0"
 *
 * Requires Node.js 4.0+
 */

/** **************************** Dependencies ********************************/

const $ = require('gulp-load-plugins')()
const bsync = require('browser-sync').create()
const del = require('del')
const flags = require('yargs').boolean('prod').argv
const gulp = require('gulp')
const pt = require('path')
const webpack = require('webpack')

/** ******************************* Globals **********************************/

const src = {
  docHtml: 'docs/html/**/*',
  docScripts: 'docs/scripts/**/*.js',
  docScriptsCore: 'docs/scripts/app.js',
  docStyles: 'docs/styles/**/*.scss',
  docStylesCore: 'docs/styles/app.scss',
  docFonts: 'node_modules/font-awesome/fonts/**/*'
}

const destBase = 'gh-pages'

const dest = {
  docHtml: destBase,
  docScripts: destBase + '/scripts',
  docStyles: destBase + '/styles',
  docFonts: destBase + '/fonts'
}

function reload (done) {
  bsync.reload()
  done()
}

/** ******************************** Tasks ***********************************/

/* --------------------------------- HTML -----------------------------------*/

gulp.task('docs:html:clear', function (done) {
  del(dest.docHtml + '/**/*.html').then((_) => {done()})
})

gulp.task('docs:html:compile', function () {
  return gulp.src(src.docHtml)
    .pipe($.statil({imports: {prod: flags.prod}}))
    // Change each `<filename>` into `<filename>/index.html`.
    .pipe($.rename(function (path) {
      switch (path.basename + path.extname) {
        case 'index.html': case '404.html': return
      }
      path.dirname = pt.join(path.dirname, path.basename)
      path.basename = 'index'
    }))
    .pipe(gulp.dest(dest.docHtml))
})

gulp.task('docs:html:build', gulp.series('docs:html:clear', 'docs:html:compile'))

gulp.task('docs:html:watch', function () {
  $.watch(src.docHtml, gulp.series('docs:html:build', reload))
})

/* -------------------------------- Scripts ---------------------------------*/

function scripts (done) {
  const watch = typeof done !== 'function'

  const alias = {
    'prax': pt.join(process.cwd(), require('./package').main)
  }

  webpack({
    entry: pt.join(process.cwd(), src.docScriptsCore),
    output: {
      path: pt.join(process.cwd(), dest.docScripts),
      filename: 'app.js'
    },
    resolve: {
      alias: alias
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel'
        }
      ]
    },
    plugins: flags.prod ? [
      new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}})
    ] : [],
    watch: watch,
    cache: false
  }, onComplete)

  function onComplete (err, stats) {
    if (err) {
      throw Error(err)
    } else {
      const report = stats.toString({
        colors: true,
        chunks: false,
        timings: true,
        version: false,
        hash: false,
        assets: false
      })
      if (report) console.log(report)
    }
    if (watch) bsync.reload()
    else done()
  }
}

gulp.task('docs:scripts:build', scripts)

gulp.task('docs:scripts:build:watch', (_) => {scripts()})

/* -------------------------------- Styles ----------------------------------*/

gulp.task('docs:styles:clear', function (done) {
  del(dest.docStyles).then((_) => {done()})
})

gulp.task('docs:styles:compile', function () {
  return gulp.src(src.docStylesCore)
    .pipe($.sass())
    .pipe($.autoprefixer())
    .pipe($.if(flags.prod, $.minifyCss({
      keepSpecialComments: 0,
      aggressiveMerging: false,
      advanced: false
    })))
    .pipe(gulp.dest(dest.docStyles))
    .pipe(bsync.reload({stream: true}))
})

gulp.task('docs:styles:build',
  gulp.series('docs:styles:clear', 'docs:styles:compile'))

gulp.task('docs:styles:watch', function () {
  $.watch(src.docStyles, gulp.series('docs:styles:build'))
})

/* --------------------------------- Fonts ----------------------------------*/

gulp.task('docs:fonts:clear', function (done) {
  del(dest.docFonts).then((_) => {done()})
})

gulp.task('docs:fonts:copy', function () {
  return gulp.src(src.docFonts).pipe(gulp.dest(dest.docFonts))
})

gulp.task('docs:fonts:build', gulp.series('docs:fonts:copy'))

gulp.task('docs:fonts:watch', function () {
  $.watch(src.docFonts, gulp.series('docs:fonts:build', reload))
})

/* -------------------------------- Server ----------------------------------*/

gulp.task('server', function () {
  return bsync.init({
    startPath: '/prax/',
    server: {
      baseDir: dest.docHtml,
      middleware: function (req, res, next) {
        req.url = req.url.replace(/^\/prax\//, '').replace(/^[/]*/, '/')
        next()
      }
    },
    port: 8745,
    online: false,
    ui: false,
    files: false,
    ghostMode: false,
    notify: false
  })
})

/* -------------------------------- Default ---------------------------------*/

if (flags.prod) {
  gulp.task('build', gulp.parallel(
    'docs:scripts:build', 'docs:html:build', 'docs:styles:build', 'docs:fonts:build'
  ))
} else {
  gulp.task('build', gulp.parallel(
    'docs:html:build', 'docs:styles:build', 'docs:fonts:build'
  ))
}

gulp.task('watch', gulp.parallel(
  'docs:scripts:build:watch', 'docs:html:watch', 'docs:styles:watch', 'docs:fonts:watch'
))

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'server')))
