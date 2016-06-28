'use strict'

/** ***************************** Dependencies *******************************/

const {eq} = require('./utils')

const {Mb} = require('../lib/bc/mb')

/** ********************************* Test ***********************************/

match_and_send: {
  const mb = Mb()
  const send = mb.send
  const match = mb.match
  let last

  match(Number.isInteger, msg => {
    last = msg
  })

  send(1.1)
  eq(last, undefined)

  send(1)
  eq(last, 1)

  send(2)
  eq(last, 2)
}

unsub: {
  const mb = Mb()
  const send = mb.send
  const match = mb.match
  let last

  const unsub = match(Number.isInteger, msg => {
    last = msg
  })

  send(2)
  unsub()
  send(3)

  eq(last, 2)
}

order: {
  const mb = Mb()
  const send = mb.send
  const match = mb.match
  let last

  match(Number.isInteger, msg => {
    last = msg
  })

  match(Number.isInteger, msg => {
    last = last * msg
  })

  send(2)

  eq(last, 4)
}

mb_constructor_args: {
  let last
  const mb = Mb(
    Boolean, msg => {
      last = msg
    },
    Boolean, msg => {
      last += msg
    }
  )

  mb.send('test')

  eq(last, 'testtest')
}

nested: {
  const mb = Mb()
  const send = mb.send
  const match = mb.match
  let last

  match(Boolean, msg => {
    last = msg
  })

  match(Boolean, Mb(
    Number.isInteger, msg => {
      last += msg
    },
    Number.isFinite, msg => {
      last *= msg
    }
  ).send)

  send(12)

  eq(last, (12 + 12) * 12)
}
