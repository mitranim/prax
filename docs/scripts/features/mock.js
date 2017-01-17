const {getIn, putIn, putInBy, inc, dec, val, ifelse, id, isFinite,
       on, swapBy} = require('prax')

exports.state = {
  count: 1,
  text: 'Hello world!',
}

exports.reducers = []

exports.computers = []

exports.effects = [
  on(['inc'], swapBy(putInBy, ['count'], ifelse(isFinite, inc, val(1)))),

  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),

  on(['alert', id], (env, [, key, msg]) => (
    env.swap(putIn, ['alerts', key], msg)
  )),

  on(['alert/clear'], swapBy(denotify)),

  on(['net/user/sync'], env => {env.swap(loadUser, env)}),

  on(['net/user/done'], (env, [, data]) => {
    console.info('-- loaded user:', data)
    env.swap(putIn, ['user'], data)
    env.send(['net/user/drop'])
  }),

  on(['net/user/drop'], env => {env.swap(clearUserXhr)}),
]

// Impure

function loadUser (state, env) {
  if (getIn(state, ['http', 'user'])) {
    console.info('-- decided to skip loading user')
    return state
  }

  console.info('-- decided to load user')
  return putIn(state, ['http', 'user'], mockLoadUser(env))
}

function mockLoadUser (env) {
  const xhr = new XMLHttpRequest()

  xhr.onload = () => {
    env.send(['net/user/done', {id: 'one', name: 'Miranda'}])
  }

  xhr.abort = () => {
    xhr.onload = null
  }

  setTimeout(() => {
    if (xhr.onload) xhr.onload({target: xhr})
  }, 500)

  return xhr
}

function clearUserXhr (state) {
  if (!getIn(state, ['http', 'user'])) {
    console.info('-- no user request to abort')
    return state
  }

  console.info('-- clearing user request')
  return putInBy(state, ['http', 'user'], abort)
}

function abort (xhr) {
  if (xhr && xhr.abort) xhr.abort()
  return null
}

// Pure

export function denotify (state) {
  return putIn(state, ['alerts'], null)
}

export function notify (state, key, msg) {
  return putIn(state, ['alerts', key], msg)
}

exports.watchers = []

/**
 * Dev
 */

if (window.devMode) Object.assign(window, exports)
