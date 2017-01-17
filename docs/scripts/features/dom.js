const React = require('react')
const {render, unmountComponentAtNode} = require('react-dom')
const {seq, pipeAnd, delayingWatcher, on} = require('prax')
const {reactiveCreateClass, cachingTransformType, createCreateElement,
       renderingWatcher} = require('prax/react')
const {addEvent, putTo} = require('../utils')
const {Root} = require('../views')

exports.state = {
  keyCode: null,
}

exports.reducers = [
  on(['keyCode'], putTo(['keyCode'], (state, [, value]) => value)),
]

exports.computers = []

exports.effects = []

exports.watchers = []

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

  // `renderRoot` must be qued to avoid accidental overlap with `renderingWatcher`.
  env.enque(renderRoot)

  const unmount = pipeAnd(findRoot, unmountComponentAtNode)

  // deinit
  return seq(
    env.addWatcher(delayingWatcher(seq(renderingWatcher, renderRoot))),

    unmount,

    addEvent(document, 'simple-pjax-before-transition', unmount),

    addEvent(document, 'simple-pjax-after-transition', renderRoot),

    addEvent(document, 'keypress', ({keyCode}) => {
      env.send(['keyCode', keyCode])
    }),
  )
}

/**
 * Utils
 */

function findRoot () {
  return document.getElementById('root')
}

/**
 * Dev
 */

if (window.devMode) Object.assign(window, exports)
