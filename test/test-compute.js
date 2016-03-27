'use strict'

/* eslint-disable no-empty-label, no-label-var, no-labels, key-spacing,
   block-spacing */

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const utils = require('./utils')
const test = utils.test

const emerge = require('emerge')
const replaceAt = emerge.replaceAt

const lib = require(process.cwd() + '/lib/compute')
const compute = lib.compute
const computeNonStrict = lib.computeNonStrict

/** ********************************* Test ***********************************/

compute: {
  primitives: {
    const comp = compute(
      ['sum'],
      [['one'], ['inc']],
      function add (a, b) {return a + b}
    )

    const prev = {one: 1, inc: 1}

    test(comp,
      {0: prev, 1: prev, out: prev},

      {0:   prev,
       1:   replaceAt(['inc'], prev, 2),
       out: {one: 1, inc: 2, sum: 3}}
    )
  }

  objects: {
    const comp = compute(['target'], [['source']], x => x)

    const prev = {source: {one: 1}, target: {test: 1}}

    test(comp,
      {0: prev, 1: prev, out: prev},

      {0:   prev,
       1:   replaceAt(['source'], prev, {one: 3}),
       out: {source: {one: 3}, target: {one: 3}}}
    )
  }
}

computeNonStrict: {
  const comp = computeNonStrict(['target'], [['source']], x => x)

  const prev = {source: {one: 1}, target: {test: 1}}

  test(comp,
    {0: prev, 1: prev, out: prev},

    {0:   prev,
     1:   replaceAt(['source'], prev, {one: 3}),
     out: {source: {one: 3}, target: {test: 1, one: 3}}}
  )
}
