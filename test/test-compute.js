'use strict'

/* eslint-disable no-empty-label, no-label-var, no-labels, key-spacing,
   block-spacing */

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const {test} = require('./utils')

const {putAt} = require('emerge')

const {compute, computePatch} = require(process.cwd() + '/lib/compute')

/** ********************************* Test ***********************************/

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
    const prev = {source: {one: 1}, target: {test: 1}}

    test(
      compute(['target'], [['source']], it),

      {0: prev,
       1: prev,
       $: prev},

      {0: prev,
       1: putAt(['source'], prev, {one: 3}),
       $: {source: {one: 3}, target: {one: 3}}}
    )
  }
}

computePatch: {
  const prev = {source: {one: 1}, target: {test: 1}}

  test(
    computePatch(['target'], [['source']], it),

    {0: prev,
     1: prev,
     $: prev},

    {0: prev,
     1: putAt(['source'], prev, {one: 3}),
     $: {source: {one: 3}, target: {test: 1, one: 3}}}
  )
}

/**
 * Utils
 */

function add (a, b) {
  return a + b
}

function it (value) {
  return value
}
