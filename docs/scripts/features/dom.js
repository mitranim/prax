const React = require('react')
const {render, unmountComponentAtNode} = require('react-dom')
const {putIn, on, FixedLifecycler} = require('prax')
const {addEvent} = require('../utils')
const {Root} = require('../views')

export const defaultState = {
  keyCode: null,
}

export const effects = [
  on(['keyCode'], (env, [, value]) => {
    env.store.swap(putIn, ['keyCode'], value)
  }),
]

export function init (env, onDeinit) {
  const renderer = new FixedLifecycler({
    getRoot: findRootNode,
    initer: rootNode => {render(<Root />, rootNode)},
    deiniter: unmountComponentAtNode,
  })

  renderer.init()

  onDeinit(renderer.deinit)

  onDeinit(addEvent(document, 'simple-pjax-before-transition', renderer.deinit))

  onDeinit(addEvent(document, 'simple-pjax-after-transition', renderer.init))

  onDeinit(addEvent(document, 'keypress', ({keyCode}) => {
    env.send(['keyCode', keyCode])
  }))
}

function findRootNode () {
  return document.getElementById('root')
}
