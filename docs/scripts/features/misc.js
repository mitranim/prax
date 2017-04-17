const {merge, putInBy, bind, ifelse, inc, dec, val, on, isFinite} = require('prax')

const defaultState = {
  count: 1,
  greeting: 'Hello world!',
  path: [],
}

export function onInit (env) {
  env.atom.swap(bind(merge, defaultState))

  env.mq.subscribe(on(['inc'], env => {
    env.atom.swap(putInBy, ['count'], ifelse(isFinite, inc, val(1)))
  }))

  env.mq.subscribe(on(['dec'], env => {
    env.atom.swap(putInBy, ['count'], ifelse(isFinite, dec, val(1)))
  }))
}
