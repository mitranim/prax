'use strict'

/* eslint-disable no-empty-label, no-label-var, no-labels, key-spacing,
   block-spacing, no-multi-spaces, no-inner-declarations, no-undef-init */

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const test = require('./utils').test

const lib = require(process.cwd() + '/lib/reduce')
const st = lib.st
const stk = lib.stk
const match = lib.match
const on = lib.on
const one = lib.one
const manage = lib.manage
const manageNonStrict = lib.manageNonStrict
const upgrade = lib.upgrade
const ifonly = lib.ifonly

/** ********************************* Test ***********************************/

const nil = undefined

st: {
  test(
    st,

    {0: 'type',
     $: {type: 'type', value: nil}},

    {0: 'type',
     1: 'value',
     $: {type: 'type', value: 'value'}}
  )
}

stk: {
  test(
    stk,

    {0: 'type',
     $: {type: 'type', key: nil, value: nil}},

    {0: 'type',
     1: 'key',
     $: {type: 'type', key: 'key', value: nil}},

    {0: 'type',
     1: 'key',
     2: 'value',
     $: {type: 'type', key: 'key', value: 'value'}}
  )
}

match: {
  function reducer (state, event) {
    return state + event.value
  }

  test(
    match({type: 'inc', value: Number.isInteger}, reducer),

    {0: 1,
     1: {type: 'inc'},
     $: 1},

    {0: 1,
     1: {type: 'inc', value: 2},
     $: 3}
  )
}

// TODO test object replacement semantics.
on: {
  function reducer (state, value, key) {
    return state + value + key
  }

  test(
    on('inc', reducer),

    {0: 1,
     1: stk('dec', 2, 3),
     $: 1},

    {0: 1,
     1: stk('inc', 2, 3),
     $: 6}
  )
}

// TODO test merge semantics.
one: {
  function reducer (state, value, key) {
    return state + value + key
  }

  test(
    one('inc', reducer),

    {0: {val: 1, _: 2},
     1: stk('inc'),
     $: {val: 1, _: 2}},

    {0: {val: 1, _: 2},
     1: stk('inc', 'val', 3),
     $: {val: '4val', _: 2}},

    {0: {0: 1, _: 2},
     1: stk('inc', 0, 3),
     $: {0: 4, _: 2}}
  )
}

manage: {
  const reducers = manage(['val'],
    on('inc', add),
    on('dec', sub),
    on('set', pass)
  )

  function reduce (prev, event) {
    return reducers.reduce((next, func) => func(next, event), prev)
  }

  test(
    reduce,

    {0: {val: 1, _: 2},
     1: st('inc', 3),
     $: {val: 4, _: 2}},

    {0: {val: 4, _: 2},
     1: st('dec', 3),
     $: {val: 1, _: 2}},

    // Completely replaces objects.
    {0: {val: {a: 1}, _: 2},
     1: st('set', {b: 2}),
     $: {val: {b: 2}, _: 2}}
  )
}

manageNonStrict: {
  const reducers = manageNonStrict(['val'],
    on('inc', add),
    on('dec', sub),
    on('set', pass)
  )

  function reduce (prev, event) {
    return reducers.reduce((next, func) => func(next, event), prev)
  }

  test(
    reduce,

    {0: {val: 1, _: 2},
     1: st('inc', 3),
     $: {val: 4, _: 2}},

    {0: {val: 4, _: 2},
     1: st('dec', 3),
     $: {val: 1, _: 2}},

    // Merges objects.
    {0: {val: {a: 1}, _: 2},
     1: st('set', {b: 2}),
     $: {val: {a: 1, b: 2}, _: 2}}
  )
}

upgrade: {
  test(
    upgrade(pass),

    {0: {val: 1},
     1: {val: 2},
     $: nil}
  )

  function reducer (value) {
    return value.val
  }

  test(
    upgrade(reducer),

    {0: {val: 1},
     1: {},
     $: 1},

    {0: {},
     1: {val: 1},
     $: 1},

    {0: {val: 1},
     1: {val: 2},
     $: 2}
  )
}

ifonly: {
  test(
    ifonly(both(Number.isInteger), add),

    {0: NaN,
     1: 1,
     $: NaN},

    {0: {},
     1: 1,
     $: {}},

    {0: 1,
     1: NaN,
     $: 1},

    {0: 1,
     1: 2,
     $: 3}
  )
}

/**
 * Utils
 */

function add (a, b) {
  return a + b
}

function sub (a, b) {
  return a - b
}

function pass (_, x) {
  return x
}

function both (func) {
  return (a, b) => Boolean(func(a) && func(b))
}
