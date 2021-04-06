import * as f from 'fpx'

export function is(expected, actual) {
  if (!Object.is(expected, actual)) {
    throw Error(`
expected: ${f.show(expected)}
actual: ${f.show(actual)}
`.trim())
  }
}

export function eq(expected, actual) {
  if (!equiv(expected, actual)) {
    throw Error(`
expected: ${f.show(expected)}
actual: ${f.show(actual)}
`.trim())
  }
}

export function throws(fun, ...args) {
  if (typeof fun !== 'function') {
    throw Error(`Expected a function, got ${fun}`)
  }

  try {
    fun(...args)
  }
  catch (_err) {
    return
  }

  throw Error(`Expected function "${fun.name || fun}" to throw`)
}

function equiv(one, two) {
  if (f.is(one, two)) return true
  if (typeof one !== typeof two) return false
  if (one.constructor === two.constructor) return one.valueOf() === two.valueOf()
  return false
}
