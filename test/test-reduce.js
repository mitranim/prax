'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const {test} = require('./utils')

const w = require('../lib/words')

/** ********************************* Test ***********************************/

function id (a) {return a}
function plus (a, b) {return a + b}
function minus (a, b) {return a - b}
function pass (_, x) {return x}
const nil = undefined

st: {
  test(w.st,
    {0: 'type',
     $: {type: 'type', value: nil}},

    {0: 'type',
     1: 'value',
     $: {type: 'type', value: 'value'}}
  )
}

stk: {
  test(w.stk,
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

onEvent: {
  function reducer (state, event, app) {
    return state + event.value + app
  }

  test(w.onEvent({type: 'inc', value: Number.isInteger}, reducer),
    {0: 1,
     1: {type: 'inc'},
     $: 1},

    {0: 1,
     1: {type: 'inc', value: 2},
     2: 3,
     $: 6}
  )
}

onType: {
  function reducer (state, event, app) {
    return state + event.value + app
  }

  test(w.onType('inc', reducer),
    {0: 1,
     1: w.st('inc', 2),
     2: 3,
     $: 6}
  )
}

// TODO test object replacement semantics.
on: {
  function reducer (state, value, key, app) {
    return state + value + key + app
  }

  test(w.on('inc', reducer),
    {0: 1,
     1: w.stk('dec', 2, 3),
     $: 1},

    {0: 1,
     1: w.stk('inc', 2, 3),
     2: 4,
     $: 10}
  )
}

// TODO test merge semantics.
one: {
  function reducer (state, value, key, app) {
    return state + value + key + app
  }

  test(w.one('inc', reducer),
    {0: {val: 1, _: 2},
     1: w.stk('inc'),
     $: {val: 1, _: 2}},

    {0: {val: 1, _: 2},
     1: w.stk('inc', 'val', 3),
     2: 4,
     $: {val: '4val4', _: 2}},

    {0: {0: 1, _: 2},
     1: w.stk('inc', 0, 3),
     2: 4,
     $: {0: 8, _: 2}}
  )
}

manage: {
  const reducers = w.manage(['val'],
    w.on('inc', plus),
    w.on('dec', minus),
    w.on('set', pass)
  )

  function reduce (prev, event) {
    return reducers.reduce((next, fun) => fun(next, event), prev)
  }

  test(reduce,
    {0: {val: 1, _: 2},
     1: w.st('inc', 3),
     $: {val: 4, _: 2}},

    {0: {val: 4, _: 2},
     1: w.st('dec', 3),
     $: {val: 1, _: 2}},

    // Completely replaces objects.
    {0: {val: {a: 1}, _: 2},
     1: w.st('set', {b: 2}),
     $: {val: {b: 2}, _: 2}}
  )
}

managePatch: {
  const reducers = w.managePatch(['val'],
    w.on('inc', plus),
    w.on('dec', minus),
    w.on('set', pass)
  )

  function reduce (prev, event) {
    return reducers.reduce((next, fun) => fun(next, event), prev)
  }

  test(reduce,
    {0: {val: 1, _: 2},
     1: w.st('inc', 3),
     $: {val: 4, _: 2}},

    {0: {val: 4, _: 2},
     1: w.st('dec', 3),
     $: {val: 1, _: 2}},

    // Merges objects.
    {0: {val: {a: 1}, _: 2},
     1: w.st('set', {b: 2}),
     $: {val: {a: 1, b: 2}, _: 2}}
  )
}

upgrade: {
  test(w.upgrade(pass),
    {0: {val: 1},
     1: {val: 2},
     $: nil}
  )

  test(w.upgrade(id),
    {0: null,
     1: {val: 1},
     $: {val: 1}},

    {0: {one: 1},
     1: {two: 2},
     $: {one: 1, two: 2}},

    {0: {val: 1},
     1: '',
     $: {val: 1}},

    {0: {val: 1},
     1: null,
     $: undefined}
  )
}
