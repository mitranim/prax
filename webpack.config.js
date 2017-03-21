'use strict'

const pt = require('path')
const webpack = require('webpack')
const prod = process.env.NODE_ENV === 'production'

module.exports = {
  entry: pt.resolve('docs/scripts/main.js'),

  output: {
    path: pt.resolve('gh-pages'),
    filename: 'main.js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: pt.resolve('docs/scripts')
      },
      ...(!prod ? [] : [
        {
          test: /react.*\.jsx?$/,
          include: /node_modules/,
          loader: 'transform?envify'
        }
      ])
    ]
  },

  resolve: {
    alias: {prax: process.cwd()}
  },

  plugins: [
    new webpack.ProvidePlugin({
      React: 'react',
    }),
    ...(!prod ? [
      new webpack.HotModuleReplacementPlugin()
    ] : [
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {warnings: false, screw_ie8: true},
        mangle: true
      })
    ])
  ],

  devtool: prod ? 'source-map' : null,

  // For static build. See gulpfile.
  stats: {
    colors: true,
    chunks: false,
    version: false,
    hash: false,
    assets: false
  }
}
