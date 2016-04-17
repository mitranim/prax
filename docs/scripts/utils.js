import 'simple-pjax'
import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import {slice} from 'prax/lang'
import {mergeAt} from 'prax/emerge'

// Setup

const views = []
const viewNodes = []

export function setup () {
  onload(() => {
    views.forEach(({selector, Component}) => {
      slice(document.querySelectorAll(selector)).forEach(element => {
        render(<Component />, element)
        viewNodes.push(element)
      })
    })
  })
}

docEvent(module, 'simple-pjax-after-transition', setup)

// Teardown

export function teardown () {
  views.splice(0)
  viewNodes.splice(0).forEach(unmountComponentAtNode)
}

function viewTeardown () {
  viewNodes.splice(0).forEach(unmountComponentAtNode)
}

docEvent(module, 'simple-pjax-before-transition', viewTeardown)

// Other

export function renderTo (selector, Component) {
  views.push({selector, Component})
}

export function onload (callback) {
  if (/loaded|complete|interactive/.test(document.readyState)) {
    callback()
  } else {
    document.addEventListener('DOMContentLoaded', function cb () {
      document.removeEventListener('DOMContentLoaded', cb)
      callback()
    })
  }
}

export function docEvent (module, name, func) {
  document.addEventListener(name, func)
  if (module.hot) {
    module.hot.dispose(() => {
      document.removeEventListener(name, func)
    })
  }
}

export function mergeAll (...values) {
  return values.reduce(mergeTwo)
}

function mergeTwo (acc, value) {
  return mergeAt([], acc, value || {})
}
