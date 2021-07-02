export function is(expected, actual) {
  if (!Object.is(expected, actual)) {
    throw Error(`
expected: ${show(expected)}
actual:   ${show(actual)}
`)
  }
}

export function eq(expected, actual) {
  if (!equiv(expected, actual)) {
    throw Error(`
expected: ${show(expected)}
actual:   ${show(actual)}
`)
  }
}

export function throws(fun, ...args) {
  if (!isFun(fun)) {
    throw Error(`Expected a function, got ${fun}`)
  }

  let val
  try {
    val = fun(...args)
  }
  catch (_err) {
    return
  }

  throw Error(`Expected function "${fun.name || fun}" to throw; got ${show(val)}`)
}

function isFun(val) {return typeof val === 'function'}
function isObj(val) {return val !== null && typeof val === 'object'}
function isArr(val) {return Array.isArray(val)}
function isStr(val) {return typeof val === 'string'}
function isDict(val) {return isObj(val) && Object.getPrototypeOf(val) === Object.prototype}

function show(val) {
  if (isFun(val) && val.name) return val.name
  if (isArr(val) || isDict(val) || isStr(val)) {
    try {return JSON.stringify(val)}
    catch (_) {return String(val)}
  }
  return String(val)
}

function equiv(one, two) {
  if (Object.is(one, two)) return true
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
