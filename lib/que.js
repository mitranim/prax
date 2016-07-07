'use strict'

const {slice} = Array.prototype

/**
 * FIFO task queue with one consumer.
 * Flushes synchronously.
 * Tasks can be reordered or canceled.
 */

exports.Que = Que
function Que (consumer) {
  return bindTo({consumer, idle: true, pending: []}, {enque})
}

function enque (que) {
  que.pending.push(...slice.call(arguments, 1))
  if (que.idle) {
    que.idle = false
    try {flush(que)}
    finally {que.idle = true}
  }
}

function flush (que) {
  while (que.pending.length) {
    try {que.consumer(que.pending.shift())}
    catch (err) {flush(que); throw err}
  }
}

function bindTo (ref, methods) {
  for (const key in methods) ref[key] = methods[key].bind(undefined, ref)
  return ref
}
