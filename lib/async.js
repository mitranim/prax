'use strict'

exports.asyncStrategy = asyncStrategy
function asyncStrategy (notify) {
  let pending = false

  return () => {
    if (pending) return

    pending = true

    timer(() => {
      pending = false
      notify()
    })
  }
}

function timer (func) {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(func)  // eslint-disable-line
  else setTimeout(func, 16)
}
