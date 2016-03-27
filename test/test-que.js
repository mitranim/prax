'use strict'

/* eslint-disable no-empty-label, no-labels, block-spacing */

/**
 * TODO descriptive tests
 */

/** ***************************** Dependencies *******************************/

const utils = require('./utils')
const eq = utils.eq
const deq = utils.deq
const ignore = utils.ignore

const Que = require(process.cwd() + '/lib/que').Que

/** ********************************* Test ***********************************/

push: {
  const que = Que()
  const out = []

  que.push(1, 2)
  que.push(3)

  que.setConsumer(out.push.bind(out))

  deq(out, [1, 2, 3])

  out.splice(0)
  que.push(1)

  deq(out, [1])
}

// Tests linear processing of events: que must delay events pushed during flush
// and maintain their order.
linearity: {
  const que = Que()
  const out = []

  que.setConsumer(event => {
    if (!out.length) {
      // This must not call the consumer immediately.
      que.push(2, 3)
      que.push(4)
      eq(out.length, 0)
    }
    out.push(event)
  })

  que.push(1)

  deq(out, [1, 2, 3, 4])
}

exceptions: {
  const que = Que()
  const out = []

  que.setConsumer(event => {
    if (event % 2) throw Error()
    out.push(event)
  })

  ignore(() => {que.push(1, 2, 3, 4)})

  deq(out, [2, 4])
}
