const React = require('react')
const {render, unmountComponentAtNode} = require('react-dom')
const {getIn, putIn, putInBy, inc, dec, val, ifelse, seq, pipeAnd, id, isFinite,
       on, swapBy, swapInto, delayingWatcher} = require('prax')
const {reactiveCreateClass, cachingTransformType, createCreateElement,
       renderingWatcher} = require('prax/react')
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

  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),
  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),
  on(['dec'], swapBy(putInBy, ['count'], ifelse(isFinite, dec, val(1)))),

  on(['keyCode'], putTo(['keyCode'], (state, [, value]) => value)),
  on(['keyCode'], putTo(['keyCode'], (state, [, value]) => value)),
  on(['keyCode'], (env, [, value]) => (
    env.swap(putIn, ['keyCode'], value)
  )),

  on(['alert', id], putOne(['alerts'], (state, [,, msg]) => msg)),
  on(['alert', id], putOne(['alerts'], (state, [,, msg]) => msg)),
  on(['alert', id], (env, [, key, msg]) => (
    env.swap(putIn, ['alerts', key], msg)
  )),

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
 * Watchers
 */

exports.watchers = [
  // (env, prev, next) => {
  //   console.info('-- running watcher')
  //   console.info('-- prev, next:', prev, next)
  // }
]

// /**
//  * Computers (BC)
//  */

// const {compute} = require('prax')

// exports.computers = [
//   compute(['textLength'], [['text']], text => get(text, 'length')),
//   compute(['doubleCount'], [['count']], x => (x | 0) * 2)
// ]

/**
 * Init
 */

export function init (env) {
  const createClass = reactiveCreateClass(React.createClass, env)
  const transformType = cachingTransformType(createClass)
  React.createElement = createCreateElement(transformType)

  function renderRoot () {
    if (findRoot()) {
      render(<Root />, findRoot(), () => {
        // This is where you run any "post-render" code, using the built-up context
        // Check this out:
        // console.info(`-- env.renderingContext:`, env.renderingContext)
      })
    }
  }

  env.addWatcher('render', delayingWatcher(renderingWatcher(renderRoot)))

  // `renderRoot` must be qued to avoid accidental overlap with `renderingWatcher`.
  env.enque(renderRoot)

  return seq(
    pipeAnd(findRoot, unmountComponentAtNode),
    addEvent(
      document,
      'simple-pjax-before-transition',
      pipeAnd(findRoot, unmountComponentAtNode)
    ),
    addEvent(document, 'simple-pjax-after-transition', renderRoot),
    addEvent(document, 'keypress', ({keyCode}) => {
      env.send(['keyCode', keyCode])
    })
  )
}

/**
 * Utils
 */

// Experimental shortcut
function putTo (path, fun) {
  return swapInto(function putTo_ (state) {
    return putIn(state, path, fun(...arguments))
  })
}

// Experimental shortcut
function putOne (path, fun) {
  return swapInto(function putOne_ (state, [, key]) {
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
