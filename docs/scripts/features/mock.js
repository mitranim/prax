const {getIn, putIn, putInBy, inc, dec, val, ifelse, id, isFinite, on} = require('prax')

export const defaultState = {
  count: 1,
  greeting: 'Hello world!',
  path: [],
}

export const effects = [
  on(['inc'], env => {
    env.store.swap(putInBy, ['count'], ifelse(isFinite, inc, val(1)))
  }),

  on(['dec'], env => {
    env.store.swap(putInBy, ['count'], ifelse(isFinite, dec, val(1)))
  }),

  on(['alert', id], (env, [, key, msg]) => (
    env.store.swap(putIn, ['alerts', key], msg)
  )),

  on(['alert/clear'], env => {
    env.store.swap(denotify)
  }),

  on(['net/user/sync'], env => {
    env.store.swap(loadUser, env)
  }),

  on(['net/user/done'], (env, [, data]) => {
    console.info('loaded user:', data)
    env.store.swap(putIn, ['user'], data)
    env.send(['net/user/drop'])
  }),

  on(['net/user/drop'], env => {
    env.store.swap(clearUserXhr)
  }),
]

function loadUser (state, env) {
  if (getIn(state, ['http', 'user'])) {
    console.info('skipping loading user')
    return state
  }

  console.info('decided to load user')
  return putIn(state, ['http', 'user'], mockLoadUser(env))
}

function mockLoadUser (env) {
  const timer = setTimeout(() => {
    env.send(['net/user/done', {id: 'one', name: 'Miranda'}])
  }, 500)

  return Object.create(new XMLHttpRequest(), {
    abort: {value () {clearTimeout(timer)}},
  })
}

function clearUserXhr (state) {
  if (!getIn(state, ['http', 'user'])) {
    console.info('no user request to abort')
    return state
  }

  console.info('clearing user request')
  return putInBy(state, ['http', 'user'], abort)
}

function abort (xhr) {
  if (xhr && xhr.abort) xhr.abort()
  return null
}

export function denotify (state) {
  return putIn(state, ['alerts'], null)
}

export function notify (state, key, msg) {
  return putIn(state, ['alerts', key], msg)
}
