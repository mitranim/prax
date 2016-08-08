'use strict'

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const {putAt} = require('emerge')
const {test} = require('./utils')

const {compute, computePatch} = require('../lib/words')

/** ********************************* Test ***********************************/

function add (a, b) {return a + b}
function id (value) {return value}

compute: {
  primitives: {
    const prev = {one: 1, inc: 1}

    test(
      compute(['sum'], [['one'], ['inc']], add),

      {0: prev,
       1: prev,
       $: prev},

      {0: prev,
       1: putAt(['inc'], prev, 2),
       $: {one: 1, inc: 2, sum: 3}}
    )
  }

  objects: {
    const prev = {from: {one: 1}, to: {test: 1}}

    test(
      compute(['to'], [['from']], id),

      {0: prev,
       1: prev,
       $: prev},

      {0: prev,
       1: putAt(['from'], prev, {one: 3}),
       $: {from: {one: 3}, to: {one: 3}}}
    )
  }
}

computePatch: {
  const prev = {from: {one: 1}, to: {test: 1}}

  test(
    computePatch(['to'], [['from']], id),

    {0: prev,
     1: prev,
     $: prev},

    {0: prev,
     1: putAt(['from'], prev, {one: 3}),
     $: {from: {one: 3}, to: {test: 1, one: 3}}}
  )
}
