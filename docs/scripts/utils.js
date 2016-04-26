import React from 'react'
import {render, unmountComponentAtNode} from 'react-dom'
import {slice} from 'prax/lang'
import {mergeAt} from 'prax/emerge'

export function mount (selector, View, nodes) {
  slice(document.querySelectorAll(selector)).forEach(element => {
    render(<View />, element)
    nodes.push(element)
  })
}

export function unmount (nodes) {
  nodes.splice(0).forEach(unmountComponentAtNode)
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

export function domEvent (module, target, name, func) {
  target.addEventListener(name, func)
  if (module.hot) {
    module.hot.dispose(() => {
      target.removeEventListener(name, func)
    })
  }
}

export function mergeAll (...values) {
  return values.reduce(mergeTwo)
}

function mergeTwo (acc, value) {
  return mergeAt([], acc, value || {})
}
