'use strict'

/* eslint-disable no-empty-label, no-label-var, no-labels, key-spacing,
   block-spacing, no-multi-spaces, no-inner-declarations, no-undef-init */

/**
 * TODO better readability
 *
 * Watchers are impure / stateful. We have to keep this in mind.
 */

/** ***************************** Dependencies *******************************/

const test = require('./utils').test

const lib = require(process.cwd() + '/lib/watch')
const Watcher = lib.Watcher

/** ********************************* Test ***********************************/

const nil = undefined

Watcher: {
  function reader (read) {
    return read('val')
  }

  test(
    Watcher(reader),

    // First call always runs the reader
    {0: {val: 1},
     1: {val: 1},
     $: 1},

    // No change -> no result
    {0: {val: 1},
     1: {val: 1},
     $: nil},

    // Change -> result
    {0: {val: 1},
     1: {val: 2},
     $: 2},

    // Change elsewhere -> no result
    {0: {val: 2},
     1: {val: 2, ctrl: 1},
     $: nil}
  )
}

Watcher__path_change: {
  function reader (read) {
    return read(read('key'))
  }

  test(
    Watcher(reader),

    // First call always runs the reader
    {1: {key: 'val', val: 1},
     $: 1},

    // No change -> no result
    {0: {key: 'val', val: 1},
     1: {key: 'val', val: 1},
     $: nil},

    // Change -> result
    {0: {key: 'val', val: 1},
     1: {key: 'val', val: 2},
     $: 2},

    // Changed path -> result
    {0: {key: 'val', val: 2},
     1: {key: 'ctrl', val: 2, ctrl: 1},
     $: 1},

    // Change at old path -> no result
    {0: {key: 'ctrl', val: 3, ctrl: 1},
     1: {key: 'ctrl', val: 3, ctrl: 1},
     $: nil},

    // Change at new path -> result
    {0: {key: 'ctrl', val: 3, ctrl: 1},
     1: {key: 'ctrl', val: 3, ctrl: 2},
     $: 2}
  )
}
