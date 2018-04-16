'use strict'

const bs = require('browser-sync').create()
const log = require('fancy-log')
const {mapVals} = require('fpx')
const config = require('./webpack.config')

const PROD = process.env.NODE_ENV === 'production'

if (PROD) {
  require('webpack')(config).watch({}, (err, stats) => {
    log('[webpack]', stats.toString(config.stats))
    if (err) log('[webpack]', err.message)
  })
}

const compiler = PROD ? null : require('webpack')(extend(config, {
  entry: mapVals(
    config.entry,
    fsPath => ['webpack-hot-middleware/client?noInfo=true', fsPath]
  ),
}))

bs.init({
  startPath: '/prax/',
  server: {
    baseDir: 'gh-pages',
    middleware: [
      (req, res, next) => {
        req.url = req.url.replace(/^\/prax\//, '').replace(/^[/]*/, '/')
        next()
      },
      ...(PROD ? [] : [
        require('webpack-dev-middleware')(compiler, {
          publicPath: config.output.publicPath,
          stats: config.stats,
        }),
        require('webpack-hot-middleware')(compiler),
      ]),
      require('connect-history-api-fallback')(),
    ],
  },
  port: 7686,
  files: 'gh-pages',
  open: false,
  online: false,
  ui: false,
  ghostMode: false,
  notify: false,
})

function extend () {
  return Object.assign({}, ...arguments)
}
