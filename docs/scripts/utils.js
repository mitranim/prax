import React, {Component} from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import {createAuto} from 'prax/react'
import {atom} from './core'

const auto = createAuto(Component, atom)

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
    unmountComponentAtNode(unmountQueue.shift())
  }
})

export function onload (callback: Function) {
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
