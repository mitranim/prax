'use strict'

const bs = require('browser-sync').create()
const config = require('./webpack.config')
const prod = process.env.NODE_ENV === 'production'

bs.init({
  startPath: '/prax/',
  server: {
    baseDir: 'gh-pages',
    middleware: (prod ? [] : hmr()).concat(
      (req, res, next) => {
        req.url = req.url.replace(/^\/prax\//, '').replace(/^[/]*/, '/')
        next()
      }
    )
  },
  port: 7686,
  files: 'gh-pages',
  open: false,
  online: false,
  ui: false,
  ghostMode: false,
  notify: false
})

function hmr () {
  const compiler = require('webpack')(extend(config, {
    entry: ['webpack-hot-middleware/client', config.entry]
  }))

  return [
    require('webpack-dev-middleware')(compiler, {
      publicPath: '/prax',
      noInfo: true
    }),
    require('webpack-hot-middleware')(compiler)
  ]
}

function extend () {
  return [].reduce.call(arguments, assign, {})
}

function assign (left, right) {
  return Object.assign(left, right)
}
