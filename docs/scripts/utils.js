import {mergeAt} from 'prax/emerge'

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
