const {foldl, patchAt} = require('prax')

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

export function domEvent (module, target, name, fun) {
  target.addEventListener(name, fun)
  if (module.hot) {
    module.hot.dispose(() => {
      target.removeEventListener(name, fun)
    })
  }
}

export function merge () {
  return foldl(mergeTwo, undefined, arguments)
}

function mergeTwo (acc, value) {
  return patchAt([], acc, value || {})
}
