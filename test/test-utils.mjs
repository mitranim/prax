import * as f from 'fpx'

export function is(expected, actual) {
  if (!Object.is(expected, actual)) {
    throw Error(`
expected: ${f.show(expected)}
actual:   ${f.show(actual)}
`)
  }
}

export function eq(expected, actual) {
  if (!equiv(expected, actual)) {
    throw Error(`
expected: ${f.show(expected)}
actual:   ${f.show(actual)}
`)
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
  if (one.constructor !== two.constructor) return false
  if (Array.isArray(one) && Array.isArray(two)) return equivArr(one, two)
  return one.valueOf() === two.valueOf()
}

function equivArr(one, two) {
  if (one.length !== two.length) return false
  for (let i = 0; i < one.length; i++) {
    if (!equiv(one[i], two[i])) return false
  }
  return true
}
