'use strict'

/* eslint-disable no-empty-label, no-label-var, no-labels, key-spacing,
   block-spacing, no-multi-spaces, no-inner-declarations, no-undef-init */

/**
 * TODO better readability
 */

/** ***************************** Dependencies *******************************/

const test = require('./utils').test

const apply = require(process.cwd() + '/lib/lang').apply

const lib = require(process.cwd() + '/lib/effects')
const where = lib.where
const when = lib.when
const whenOneOf = lib.whenOneOf
const match = lib.match

/** ********************************* Test ***********************************/

const nil = undefined
const val = ['val']
const vals = ['vals']
const ctrl = ['ctrl']

where: {
  function predicate (val, ctrl) {
    return val === ctrl
  }

  function effect (val, ctrl) {
    return ctrl
  }

  test(
    where([val, ctrl], predicate, effect),

    // No change -> no test -> no effect
    {0: {val: 1, ctrl: 1}, 1: {val: 1, ctrl: 1}, 2: 'event', out: nil},

    // Change -> test -> no effect
    {0: {val: 1, ctrl: 1}, 1: {val: 1, ctrl: 2}, 2: 'event', out: nil},

    // Change -> test -> effect
    {0: {val: 1, ctrl: 2}, 1: {val: 1, ctrl: 1}, 2: 'event', out: 1}
  )
}

// `when` differs significantly from other effect utils:
//   * impure, remembers last result
//   * always runs the predicate when first called, even if the state hasn't changed
when: {
  function predicate (read) {
    return apply(read, val) === apply(read, ctrl)
  }

  function effect (result) {
    return result
  }

  test(
    when(predicate, effect),

    // First run -> test -> effect
    {out: true},

    // Second run, no change -> no effect
    {out: nil},

    // No change -> no effect
    {0: {val: 1, ctrl: 1}, 1: {val: 1, ctrl: 1}, 2: 'event', out: nil},

    // Change -> test -> no effect
    {0: {val: 1, ctrl: 1}, 1: {val: 1, ctrl: 2}, 2: 'event', out: nil},

    // Change -> test -> result unchanged -> no effect
    {0: {val: 1, ctrl: 2}, 1: {val: 1, ctrl: 3}, 2: 'event', out: nil},

    // Change -> test -> result changed -> effect
    {0: {val: 1, ctrl: 3}, 1: {val: 1, ctrl: 1}, 2: 'event', out: true},

    // Change -> test -> result unchanged -> no effect
    {0: {val: 1, ctrl: 1}, 1: {val: 2, ctrl: 2}, 2: 'event', out: nil}
  )
}

whenOneOf: {
  function predicate (value, key) {
    return value > 0
  }

  function effect (key, value, result) {
    return [key, value, result]
  }

  test(
    whenOneOf(vals, predicate, effect),

    // No collection -> no result
    {out: nil},

    // Empty collection -> empty result
    {1: {vals: {}}, out: []},

    // No change -> no effect
    {0: {vals: {one: 1}}, 1: {vals: {one: 1}}, out: []},

    // Change -> identical test results -> no effect
    {0: {vals: {one: 1}}, 1: {vals: {one: 2}}, out: []},

    // Change -> different test results -> effect results
    {0: {vals: {one: 0}}, 1: {vals: {one: 1}}, out: [['one', 1, true]]}
  )
}

match: {
  function effect (event, state) {
    return state[event.key]
  }

  test(match({type: 'out'}, effect),
    {1: {val: 1}, 2: {type: 'test'},            out: nil},
    {1: {val: 1}, 2: {type: 'out', key: 'val'}, out: 1}
  )
}
