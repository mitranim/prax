import {createMb} from 'prax'
import {send, match} from './core'

match(x => x instanceof Array, msgs => {
  let step
  msgs.forEach(msg => {
    if (step) step = step.then(() => {send(msg)})
    else if (isPromise(msg)) step = msg.then(send)
    else send(msg)
  })
})

match({type: 'person/update'}, ({value}) => {
  // This will execute as a sequence.
  send([
    {
      type: 'patch',
      value: {
        persons: {[value.id]: {id: value.id, loading: true}}
      }
    },
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          type: 'patch',
          value: {persons: {[value.id]: value}}
        })
      }, 1000)
    }),
    // Will wait until the promise is resolved.
    {
      type: 'patch',
      value: {
        persons: {[value.id]: {loading: false}}
      }
    }
  ])
})

/**
 * Mock
 */

match('init', () => {
  const names = ['Atlanta', 'Kara', 'Moira']
  let i = -1

  function mockUpdate () {
    send({
      type: 'person/update',
      value: {
        id: 1,
        name: names[++i % names.length]
      }
    })
  }

  mockUpdate()
  setInterval(mockUpdate, 2000)

  setInterval(() => {
    send({
      type: 'patch',
      value: {stamp: window.performance.now() | 0}
    })
  }, 1000)

  document.addEventListener('keypress', event => {
    send({
      type: 'set',
      path: ['key'],
      value: event.keyCode
    })
  })
})

match({type: 'test', value: isNumber}, createMb(
  {value: 1}, ({value}) => {
    console.log('-- one:', value)
  },

  {type: 'test', value: 2}, ({value}) => {
    console.log('-- two:', value)
  },

  Boolean, () => {}
).send)

/**
 * Utils
 */

function isPromise (value) {
  return value && typeof value.then === 'function' && typeof value.catch === 'function'
}

function isNumber (value) {
  return typeof value === 'number'
}
