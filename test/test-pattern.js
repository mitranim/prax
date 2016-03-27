'use strict'

/* eslint-disable one-var, no-multi-spaces, comma-dangle */

/** ***************************** Dependencies *******************************/

const test = require('./utils').test

const toTest = require(process.cwd() + '/lib/pattern').toTest

/** ********************************* Test ***********************************/

function run (pattern, value) {
  return toTest(pattern)(value)
}

test(run,
  // Primitives.

  {0: 'pattern', 1: 'PATTERN', out: false},
  {0: 'pattern', 1: 'pattern', out: true},
  {0: NaN,       1: undefined, out: false},
  {0: NaN,       1: NaN,       out: true},

  // Functions.

  {0: isNumber, 1: 'not a number', out: false},
  {0: isNumber, 1: Infinity,       out: true},

  // Regexes.

  {0: /secret/, 1: NaN,         out: false},
  {0: /secret/, 1: 'my secret', out: true},

  // Objects.

  {0: {type: 'fork'}, 1: {type: 'FORK'},              out: false},
  {0: {type: 'fork'}, 1: null,                        out: false},
  {0: {type: 'fork'}, 1: {type: 'fork', extra: true}, out: true},

  // Nested objects.

  {0: {space: {time: NaN}}, 1: {space: {}},                       out: false},
  {0: {space: {time: NaN}}, 1: {space: {time: {}}},               out: false},
  {0: {space: {time: NaN}}, 1: {space: null},                     out: false},
  {0: {space: {time: NaN}}, 1: {space: {time: NaN}, extra: true}, out: true},

  // Combined and nested.

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {}},
   out: false},

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {time: {}}, value: 'not a number'},
   out: false},

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {time: NaN}, value: Infinity},
   out: true}
)

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}
