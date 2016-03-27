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

  {0: 'pattern', 1: 'PATTERN', $: false},
  {0: 'pattern', 1: 'pattern', $: true},
  {0: NaN,       1: undefined, $: false},
  {0: NaN,       1: NaN,       $: true},

  // Functions.

  {0: isNumber, 1: 'not a number', $: false},
  {0: isNumber, 1: Infinity,       $: true},

  // Regexes.

  {0: /secret/, 1: NaN,         $: false},
  {0: /secret/, 1: 'my secret', $: true},

  // Objects.

  {0: {type: 'fork'},
   1: {type: 'FORK'},
   $: false},

  {0: {type: 'fork'},
   1: null,
   $: false},

  {0: {type: 'fork'},
   1: {type: 'fork', extra: true},
   $: true},

  // Nested objects.

  {0: {space: {time: NaN}},
   1: {space: {}},
   $: false},

  {0: {space: {time: NaN}},
   1: {space: {time: {}}},
   $: false},

  {0: {space: {time: NaN}},
   1: {space: null},
   $: false},

  {0: {space: {time: NaN}},
   1: {space: {time: NaN}, extra: true},
   $: true},

  // Combined and nested.

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {}},
   $: false},

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {time: {}}, value: 'not a number'},
   $: false},

  {0: {space: {time: NaN}, value: isNumber},
   1: {space: {time: NaN}, value: Infinity},
   $: true}
)

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}
