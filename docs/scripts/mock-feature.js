const React = require('react')
const {render, unmountComponentAtNode} = require('react-dom')
const {getIn, putIn, putInBy, inc, dec, val, ifelse, seq, id, isFinite,
       on, swapBy, delayingWatch} = require('prax')
const {hackCreateElement, cachingClassTransform, reactiveCreateClass,
       renderingWatch} = require('prax/react')
const {addEvent} = require('./utils')
const {Root} = require('./views')

/**
 * Defaults
 */

exports.state = {
  count: 1,
  keyCode: 0,
  text: 'Hello world!'
}

/**
 * Effects
 */

exports.effects = [
  on(['inc'], swapBy(putInBy, ['count'], ifelse(isFinite, inc, val(1)))),
  on(['inc'], swapBy(putInBy, ['count'], ifelse(isFinite, inc, val(1)))),
  on(['inc'], swapBy(putInBy, ['count'], ifelse(isFinite, inc, val(1)))),

  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),
  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),
  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),

  on(['keyCode'], putTo(['keyCode'], (state, [, value]) => value)),
  on(['keyCode'], putTo(['keyCode'], (state, [, value]) => value)),
  on(['keyCode'], swapBy((state, [, value]) => (
    putIn(state, ['keyCode'], value)
  ))),

  on(['alert', id], putOne(['alerts'], (state, [,, msg]) => msg)),
  on(['alert', id], putOne(['alerts'], (state, [,, msg]) => msg)),
  on(['alert', id], swapBy((state, [, key, msg]) => (
    putIn(state, ['alerts', key], msg)
  ))),

  on(['alert/clear'], swapBy(denotify)),
  on(['alert/clear'], swapBy(denotify)),
  on(['alert/clear'], swapBy(denotify)),

  on(['net/user/sync'], env => {env.swap(loadUser, env)}),
  on(['net/user/sync'], env => {env.swap(loadUser, env)}),
  on(['net/user/sync'], env => {env.swap(loadUser, env)}),

  on(['net/user/done'], (env, [, data]) => {
    console.info('-- loaded user:', data)
    env.swap(putIn, ['user'], data)
    env.send(['net/user/drop'])
  }),

  on(['net/user/drop'], env => {env.swap(clearUserXhr)}),
  on(['net/user/drop'], env => {env.swap(clearUserXhr)}),
  on(['net/user/drop'], env => {env.swap(clearUserXhr)})
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

/**
 * Watches
 */

exports.watches = [
  // (_key, env, prev, next) => {
  //   console.info('-- running watch')
  //   console.info('-- prev, next:', prev, next)
  // }
]

// /**
//  * Computers (BC)
//  */

// const {compute} = require('prax/bc')

// exports.computers = [
//   compute(['textLength'], [['text']], text => get(text, 'length')),
//   compute(['doubleCount'], [['count']], x => (x | 0) * 2)
// ]

// /**
//  * Reducers (BC)
//  */

// exports.reducers = [
//   on(['dec'], state => (
//     putIn(state, ['count'], (get(state, 'count') | 0) - 1)
//   )),
//   on(['dec'], state => (
//     putIn(state, ['count'], (get(state, 'count') | 0) - 1)
//   )),
//   on(['dec'], state => (
//     putIn(state, ['count'], (get(state, 'count') | 0) - 1)
//   ))
// ]

/**
 * Init
 */

export function init (env) {
  hackCreateElement(cachingClassTransform(reactiveCreateClass(React.createClass, env)))

  function renderRoot () {
    if (findRoot()) {
      render(<Root />, findRoot(), () => {
        // This is where you run any "post-render" code, using the built-up context
        // Check this out:
        // console.info(`-- env.renderingContext:`, env.renderingContext)
      })
    }
  }

  env.addWatch('render', delayingWatch(renderingWatch(renderRoot)))

  renderRoot()

  return seq(
    () => {
      if (findRoot()) unmountComponentAtNode(findRoot())
    },
    addEvent(document, 'simple-pjax-before-transition', () => {
      if (findRoot()) unmountComponentAtNode(findRoot())
    }),
    addEvent(document, 'simple-pjax-after-transition', () => {
      renderRoot()
    }),
    addEvent(document, 'keypress', ({keyCode}) => {
      env.send(['keyCode', keyCode])
    })
  )
}

/**
 * Utils
 */

// Experimental syntax sugar
function putTo (path, fun) {
  return swapBy(function (state) {
    return putIn(state, path, fun(...arguments))
  })
}

// Experimental syntax sugar
function putOne (path, fun) {
  return swapBy(function (state, [, key]) {
    return putIn(state, [...path, key], fun(...arguments))
  })
}

function findRoot () {
  return document.getElementById('root')
}

/**
 * Dev
 */

if (window.devMode) Object.assign(window, exports)
