import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import {auto} from './core'

const unmountQueue = []

export function renderTo (selector, renderFunc) {
  function init (Component) {
    onload(() => {
      const elements = document.querySelectorAll(selector)
      ;[].forEach.call(elements, element => {
        render(<Component />, element)
        unmountQueue.push(element)
      })
    })
  }

  if (typeof renderFunc === 'function' &&
      (!renderFunc.prototype ||
       Object.getPrototypeOf(renderFunc.prototype) === Object.prototype)) {
    init(auto(renderFunc))
  } else {
    return init
  }
}

document.addEventListener('simple-pjax-before-transition', () => {
  while (unmountQueue.length) {
    unmountComponentAtNode(unmountQueue[0])
    unmountQueue.shift()
  }
})

export function onload (callback) {
  if (/loaded|complete|interactive/.test(document.readyState)) {
    callback()
  } else {
    document.addEventListener('DOMContentLoaded', function cb () {
      document.removeEventListener('DOMContentLoaded', cb)
      callback()
    })
  }
  document.addEventListener('simple-pjax-after-transition', callback)
}
