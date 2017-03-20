const {Atom, TaskQue, getIn, putIn, extract, merge, bind, fuseModules} = require('prax')

const que = TaskQue()

export const root = {
  store: Atom(),
  effects: [],
  send: bind(que.push, function send (msg) {
    root.effects.forEach(function runEffect (fun) {
      fun(root, msg)
    })
  }),
  que,
}

export function reinit (features, root, onDeinit) {
  const {preinit, init} = fuseModules(features)

  const mods = preinit(root, onDeinit)

  root.effects = extract(['effects'], mods)

  root.store.state = merge(...extract(['state'], mods), root.store.state)

  init(root, onDeinit)
}

/**
 * REPL
 */

window.app = {
  ...window.app,
  root,
  store: root.store,
  read () {
    return getIn(root.store.state, arguments)
  },
  set (...path) {
    root.store.swap(putIn, path, path.pop())
  },
}
