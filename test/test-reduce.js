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
const std = lib.std
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
  test(st,
    {0: 'type',             out: {type: 'type', value: nil}},
    {0: 'type', 1: 'value', out: {type: 'type', value: 'value'}}
  )
}

std: {
  test(std,
    {0: 'type',                       out: {type: 'type', key: nil, value: nil}},
    {0: 'type', 1: 'key',             out: {type: 'type', key: 'key', value: nil}},
    {0: 'type', 1: 'key', 2: 'value', out: {type: 'type', key: 'key', value: 'value'}}
  )
}

match: {
  function reducer (state, event) {
    return state + event.value
  }

  test(match({type: 'inc', value: Number.isInteger}, reducer),
    {0: 1, 1: {type: 'inc'},           out: 1},
    {0: 1, 1: {type: 'inc', value: 2}, out: 3}
  )
}

// TODO test object replacement semantics.
on: {
  function reducer (state, value) {
    return state + value
  }

  test(on('inc', reducer),
    {0: 1, 1: st('dec', 2), out: 1},
    {0: 1, 1: st('inc', 2), out: 3}
  )
}

// TODO test merge semantics.
one: {
  function reducer (state, value, key) {
    return state + value + key
  }

  test(one('inc', reducer),
    {0: {val: 1, _: 2}, 1: std('inc'),           out: {val: 1, _: 2}},
    {0: {val: 1, _: 2}, 1: std('inc', 'val', 3), out: {val: '4val', _: 2}},
    {0: {0: 1, _: 2},   1: std('inc', 0, 3),     out: {0: 4, _: 2}}
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

  test(reduce,
    {0: {val: 1, _: 2}, 1: st('inc', 3), out: {val: 4, _: 2}},
    {0: {val: 4, _: 2}, 1: st('dec', 3), out: {val: 1, _: 2}},
    // Completely replaces objects.
    {0: {val: {a: 1}, _: 2}, 1: st('set', {b: 2}), out: {val: {b: 2}, _: 2}}
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

  test(reduce,
    {0: {val: 1, _: 2}, 1: st('inc', 3), out: {val: 4, _: 2}},
    {0: {val: 4, _: 2}, 1: st('dec', 3), out: {val: 1, _: 2}},
    // Merges objects.
    {0: {val: {a: 1}, _: 2}, 1: st('set', {b: 2}), out: {val: {a: 1, b: 2}, _: 2}}
  )
}

upgrade: {
  test(upgrade(pass),
    {0: {val: 1}, 1: {val: 2}, out: nil}
  )

  function reducer (value) {
    return value.val
  }

  test(upgrade(reducer),
    {0: {val: 1}, 1: {},       out: 1},
    {0: {},       1: {val: 1}, out: 1},
    {0: {val: 1}, 1: {val: 2}, out: 2}
  )
}

ifonly: {
  test(ifonly(both(Number.isInteger), add),
    {0: NaN, 1: 1,   out: NaN},
    {0: {},  1: 1,   out: {}},
    {0: 1,   1: NaN, out: 1},
    {0: 1,   1: 2,   out: 3}
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
