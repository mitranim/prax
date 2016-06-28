'use strict'

/**
 * TODO descriptive tests
 */

/** ***************************** Dependencies *******************************/

const {eq, deq, ignore} = require('./utils')

const {Que} = require('../lib/que')

/** ********************************* Test ***********************************/

push: {
  const que = Que()
  const out = []

  que.consumer = out.push.bind(out)

  que.enque(1, 2)
  que.enque(3)

  deq(out, [1, 2, 3])

  out.splice(0)
  que.enque(1)

  deq(out, [1])
}

// Tests linear processing of events: que must delay events pushed during flush
// and maintain their order.
linearity: {
  const que = Que()
  const out = []

  que.consumer = event => {
    if (!out.length) {
      // This must not call the consumer immediately.
      que.enque(2, 3)
      que.enque(4)
      eq(out.length, 0)
    }
    out.push(event)
  }

  que.enque(1)

  deq(out, [1, 2, 3, 4])
}

exceptions: {
  const que = Que()
  const out = []

  que.consumer = event => {
    if (event % 2) throw Error()
    out.push(event)
  }

  ignore(() => {que.enque(1, 2, 3, 4)})

  deq(out, [2, 4])
}
