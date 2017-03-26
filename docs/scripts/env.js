const {Atom, TaskQue, getIn, putIn, extract, merge, bind, fuseModules} = require('prax')

const que = new TaskQue()

export const env = {
  store: new Atom(),
  effects: [],
  send: bind(que.push, function send (msg) {
    env.effects.forEach(function runEffect (fun) {
      fun(env, msg)
    })
  }),
  que,
}

export function reinit (lifecycler) {
  const {features, onDeinit} = lifecycler

  lifecycler.env = env

  const {init} = fuseModules(features)

  env.effects = extract(['effects'], features)

  env.store.state = merge(...extract(['defaultState'], features), lifecycler.lastState)
  lifecycler.lastState = null

  onDeinit(() => {
    lifecycler.lastState = env.store.state
  })

  init(lifecycler)
}

/**
 * REPL
 */

window.app = {
  ...window.app,
  env,
  store: env.store,
  read (query) {
    return getIn(env.store.state, query)
  },
  set (path, value) {
    env.store.swap(putIn, path, value)
  },
}
