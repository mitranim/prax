'use strict'

/* eslint-disable one-var, no-multi-spaces, comma-dangle */

/** ***************************** Dependencies *******************************/

const util = require('util')
const toTest = require(process.cwd() + '/lib/pattern').toTest

/** ********************************* Test ***********************************/

function test (cfgs) {
  for (const cfg of cfgs) {
    const def = cfg[0], test = cfg[1], out = cfg[2]
    if (toTest(def)(test) !== out) {
      throw Error(red(`${inspect(def)} <- ${inspect(test)} ≠ ${inspect(out)}`))
    }
  }
}

test([
  // Primitives.

  ['pattern', 'PATTERN',  false],
  ['pattern', 'pattern',  true],
  [NaN,        undefined, false],
  [NaN,        NaN,       true],

  // Functions.

  [isNumber, 'not a number', false],
  [isNumber, Infinity,       true],

  // Regexes.

  [/secret/, NaN,         false],
  [/secret/, 'my secret', true],

  // Objects.

  [{type: 'fork'}, {type: 'FORK'},              false],
  [{type: 'fork'}, null,                        false],
  [{type: 'fork'}, {type: 'fork', extra: true}, true],

  // Nested objects.

  [{space: {time: NaN}}, {space: {}},                       false],
  [{space: {time: NaN}}, {space: {time: {}}},               false],
  [{space: {time: NaN}}, {space: null},                     false],
  [{space: {time: NaN}}, {space: {time: NaN}, extra: true}, true],

  // Combined and nested.

  [{space: {time: NaN}, value: isNumber}, {space: {}}, false],
  [{space: {time: NaN}, value: isNumber}, {space: {time: {}}, value: 'not a number'}, false],
  [{space: {time: NaN}, value: isNumber}, {space: {time: NaN}, value: Infinity}, true],
])

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}

function inspect (value) {
  return util.inspect(value, {depth: null})
}

function red (text) {
  return `\x1b[31m${text}\x1b[0m`
}
