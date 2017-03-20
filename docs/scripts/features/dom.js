const React = require('react')
const {render, unmountComponentAtNode} = require('react-dom')
const {putIn, on, FixedLifecycler} = require('prax')
const {addEvent} = require('../utils')
const {Root} = require('../views')

export function preinit (_root, _onDeinit) {
  return {
    state: {
      keyCode: null,
    },

    effects: [
      on(['keyCode'], (root, [, value]) => {
        root.store.swap(putIn, ['keyCode'], value)
      }),
    ],
  }
}

export function init (root, onDeinit) {
  const renderer = FixedLifecycler({
    getRoot: findRootNode,
    initer: rootNode => {render(<Root />, rootNode)},
    deiniter: unmountComponentAtNode,
  })

  renderer.init()

  onDeinit(renderer.deinit)

  onDeinit(addEvent(document, 'simple-pjax-before-transition', renderer.deinit))

  onDeinit(addEvent(document, 'simple-pjax-after-transition', renderer.init))

  onDeinit(addEvent(document, 'keypress', ({keyCode}) => {
    root.send(['keyCode', keyCode])
  }))
}

function findRootNode () {
  return document.getElementById('root')
}
