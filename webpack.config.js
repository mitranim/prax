'use strict'

const pt = require('path')
const webpack = require('webpack')
const prod = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    main: pt.resolve('docs/scripts/main.js'),
  },

  output: {
    path: pt.resolve('gh-pages/scripts'),
    filename: '[name].js',
    // For dev middleware
    publicPath: '/scripts/',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: pt.resolve('docs/scripts'),
        use: {loader: 'babel-loader'},
      },
      ...(!prod ? [] : [
        {
          test: /react.*\.jsx?$/,
          include: /node_modules/,
          use: {loader: 'transform-loader', options: {envify: true}},
        },
      ]),
      {
        test: /\.md$/,
        include: pt.resolve('docs'),
        use: [
          {loader: 'html-loader'},
          {loader: 'md-loader'},
        ],
      },
    ],
  },

  resolve: {
    alias: {
      prax: process.cwd(),
    },
  },

  resolveLoader: {
    alias: {
      'md-loader': pt.resolve('md-loader.js'),
    },
  },

  plugins: [
    ...(!prod ? [
      new webpack.HotModuleReplacementPlugin(),
    ] : [
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {warnings: false, screw_ie8: true},
        mangle: true,
        sourceMap: true,
      }),
    ]),
  ],

  devtool: prod ? 'source-map' : false,

  // See gulpfile and devserver.
  stats: {
    colors: true,
    chunks: false,
    version: false,
    hash: false,
    assets: false,
  },
}
