'use strict'

/* eslint-disable no-inner-declarations */

/**
 * TODO better readability
 *
 * Watchers are impure / stateful. We have to keep this in mind when testing.
 */

/** ***************************** Dependencies *******************************/

const {test} = require('./utils')

const {Watcher} = require('../lib/words')

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

// App passes `app.que.enque` to effects as 4th argument.
// Watcher must pass it as 2nd.
Watcher__pass_send: {
  function reader (read, send) {
    return send(read('key'))
  }

  test(Watcher(reader),
    {1: {key: 10},
     3: val => val * 2,
     $: 20}
  )
}
