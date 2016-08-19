const {Ref, redef,
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

export const env = redef(['dev', 'env'], env => (
  env || Ref()
))

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
  const wsUrl = 'ws://localhost:7687'
  const wsProtocol = undefined

  env.ws = redef(['dev', 'ws'], ws => {
    if (ws && ws.url === wsUrl && ws.protocol === wsProtocol) return ws
    if (ws) ws.close()
    return Ws(wsUrl, wsProtocol)
  })

  env.ws.onclose = null

  env.ws.onerror = null

  env.ws.onmessage = function onmessage ({data}) {
    console.info('-- socket message:', data)
    env.swap(putIn, ['lastMsg'], data)
  }

  env.ws.onopen = function onopen (event) {
    console.info('-- socket connected:', event)
  }
}

// /**
//  * Computers
//  */

// const {joinComputers} = require('prax/bc')
// const {swap} = require('prax')

// const computer = joinComputers(env.computers = extract('computers'))

// env.swap = (mod, ...args) => {
//   swap(env, prev => computer(prev, mod(prev, ...args)))
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
