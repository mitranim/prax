import {match, multimatch, pipe} from 'prax'

export default (read, send) => pipe(
  match(x => x instanceof Array, msgs => {
    let step
    msgs.forEach(msg => {
      if (step) step = step.then(() => {send(msg)})
      else if (isPromise(msg)) step = msg.then(send)
      else send(msg)
    })
  }),

  match({type: 'test', value: isNumber}, msg => {
    console.log('-- got test number:', msg)
  }),

  match(isNumber, msg => {
    console.log('-- got number:', msg)
  }),

  match({type: 'personUpdate'}, ({value}) => {
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
  }),

  /**
   * Mock
   */

  multimatch({type: 'im'}, pipe(
    match({action: 'send'}, msg => {
      console.log('-- sending:', msg)
    }),

    match({action: 'poll'}, msg => {
      console.log('-- polling:', msg)
    })
  )),

  multimatch('init', next => msg => {
    next(msg)

    const names = ['Atlanta', 'Kara', 'Moira']
    let i = -1

    function mockUpdate () {
      send({
        type: 'personUpdate',
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
)

/**
 * Utils
 */

function isPromise (value) {
  return value && typeof value.then === 'function' && typeof value.catch === 'function'
}

function isNumber (value) {
  return typeof value === 'number'
}
