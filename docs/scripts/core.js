const {Atom, defonce,
       putIn, seq, pipe, juxt, spread, flat, id} = require('prax')
const {merge} = require('./utils')
const {Ws} = require('./ws')

const features = [
  require('./mock-feature')
]

const extract = key => flat(features.map(x => x[key]).filter(id))

/**
 * Env
 */

export const env = defonce(['dev', 'env'], Atom)

env.watches = {
  static: seq(...extract('watches'))
}

env.effects = extract('effects')

env.send = function send (msg) {
  env.enque(function runEffects () {
    env.effects.forEach(function runEffect (fun) {
      fun(env, msg)
    })
  })
}

/**
 * Ws
 */

if (window.devMode) {
  env.ws = defonce(['dev', 'ws'], () => {
    const ws = Ws('ws://localhost:7687')
    ws.open()
    return ws
  })

  env.ws.onopen = function onopen (event) {
    console.info('-- socket connected:', event)
  }

  env.ws.onerror = function onerror (event) {
    console.error(event)
  }

  env.ws.onmessage = function onmessage ({data}) {
    console.info('-- socket message:', data)
    env.swap(putIn, ['lastMsg'], data)
  }
}

// /**
//  * Computers
//  */

// const {joinComputers} = require('prax')

// const computer = joinComputers(env.computers = extract('computers'))

// env.swap = (mod, ...args) => {
//   Atom.swap(env, prev => computer(prev, mod(prev, ...args)))
// }

/**
 * Init
 */

// Apply new default state, but prioritise built-up state.
env.swap(state => merge(state, ...extract('state'), state))

const init = pipe(juxt(...extract('init')), spread(seq))

const teardown = init(env)

if (module.hot) module.hot.dispose(teardown)

/**
 * Dev
 */

window.dev = {...window.dev, env,
  set (...path) {
    env.swap(putIn, path, path.pop())
  }
}

if (window.devMode) Object.assign(window, window.dev)
