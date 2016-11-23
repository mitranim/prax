'use strict'

const bs = require('browser-sync').create()

const config = require('./webpack.config')

const compiler = require('webpack')(extend(config, {
  entry: ['webpack-hot-middleware/client', config.entry]
}))

bs.init({
  startPath: '/prax/',
  server: {
    baseDir: 'gh-pages',
    middleware: [
      require('webpack-dev-middleware')(compiler, {
        publicPath: '/prax',
        noInfo: true
      }),
      require('webpack-hot-middleware')(compiler),
      (req, res, next) => {
        req.url = req.url.replace(/^\/prax\//, '').replace(/^[/]*/, '/')
        next()
      },
    ]
  },
  port: 7686,
  files: 'gh-pages',
  open: false,
  online: false,
  ui: false,
  ghostMode: false,
  notify: false
})

function extend (...args) {
  return args.reduce(Object.assign, {})
}
