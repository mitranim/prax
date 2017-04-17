const React = require('react')
const ReactDOM = require('react-dom')
const {Lifecycler, PraxComponent, putIn, seq} = require('prax')
const {addEvent} = require('../utils')
const {Root} = require('../views')

export function onInit (env) {
  PraxComponent.prototype.env = env

  const render = new Lifecycler()

  render.onInit = function onInit () {
    const rootNode = document.getElementById('root')
    if (rootNode) {
      ReactDOM.render(<Root />, rootNode)
      this.onDeinit(() => {
        ReactDOM.unmountComponentAtNode(rootNode)
      })
    }
  }

  render.init()

  env.onDeinit(render.deinit)

  env.onDeinit(seq(
    addEvent(window, 'simple-pjax-before-transition', render.deinit),

    addEvent(window, 'simple-pjax-after-transition', render.reinit),

    addEvent(document, 'keydown', ({keyCode}) => {
      env.atom.swap(putIn, ['keyCode'], keyCode)
    }),
  ))
}
