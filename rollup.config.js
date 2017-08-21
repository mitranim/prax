'use strict'

const external = ['fpx', 'emerge', 'espo', 'react']

module.exports = [
  {
    input: 'src/index.js',
    output: {file: 'es/prax.js', format: 'es'},
    external,
    plugins: [
      require('rollup-plugin-babel')({exclude: 'node_modules/**'}),
    ],
  },
  {
    input: 'es/prax.js',
    output: {file: 'dist/prax.js', format: 'cjs'},
    external,
  },
  // For evaluating minified size
  {
    input: 'dist/prax.js',
    output: {file: 'dist/prax.min.js', format: 'cjs'},
    external,
    plugins: [
      require('rollup-plugin-uglify')({
        mangle: true,
        toplevel: true,
        compress: true,
      }),
    ],
  },
]
