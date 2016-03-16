'use strict'

/**
 * TODO descriptive tests
 */

/** ***************************** Dependencies *******************************/

const deepEqual = require('emerge').deepEqual
const Que = require(process.cwd() + '/lib/que').Que

/** ********************************* Test ***********************************/

call(function testPush () {
  const que = Que()
  const out = []

  que.push(1, 2)
  que.push(3)

  que.setConsumer(out.push.bind(out))

  if (!deepEqual(out, [1, 2, 3])) throw Error()

  out.splice(0)

  que.push(1)

  if (!deepEqual(out, [1])) throw Error()
})

// Tests lineary processing of events: que must delay processing of events
// pushed during flush and maintain their order.
call(function testLinearity () {
  const que = Que()
  const out = []

  que.setConsumer(event => {
    if (!out.length) {
      // This must not call the consumer immediately.
      que.push(2, 3)
      que.push(4)
      if (out.length) throw Error(out)
    }
    out.push(event)
  })

  que.push(1)

  if (!deepEqual(out, [1, 2, 3, 4])) throw Error()
})

call(function testExceptions () {
  const que = Que()
  const out = []

  que.setConsumer(event => {
    if (event % 2) throw Error()
    out.push(event)
  })

  try {
    que.push(1, 2, 3, 4)
  } catch (_) {
    // ignore
  }

  if (!deepEqual(out, [2, 4])) throw Error()
})

/**
 * Utils
 */

function call (func) {
  func()
}
