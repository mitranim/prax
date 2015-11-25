import React, {Component} from 'react'
import {render} from 'react-dom'
import {createAuto} from 'prax/react'
import {atom} from './core'

const auto = createAuto(Component, atom)

export function renderTo (selector, renderFunc) {
  function init (Component) {
    onload(() => {
      const elements = document.querySelectorAll(selector)
      ;[].forEach.call(elements, element => {
        render(<Component />, element)
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

export function onload (callback: Function) {
  if (/loaded|complete|interactive/.test(document.readyState)) {
    callback()
  } else {
    document.addEventListener('DOMContentLoaded', function cb () {
      document.removeEventListener('DOMContentLoaded', cb)
      callback()
    })
  }
}
