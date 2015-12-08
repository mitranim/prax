'use strict'

/**
 * FQ stands for factor queue. Some terminology:
 *
 *
 * A _factor_ takes a value and does something. It's a normal function without
 * any obligations:
 *
 *     value => ...                                |  factor
 *
 *
 * A _transducer_ takes a factor and returns a new (or same) factor. The new
 * factor may serve as middleware before the original factor, or even prevent
 * it from being called:
 *
 *     factor => (value => ...)                    |  transducer
 *     factor1 => factor2                          |
 *
 *
 * A _fiend_ takes arbitrary arguments and returns a transducer. We use fiends
 * to share the same input and output functions between all factors
 * (`atom.read` and `send`, or mocks in unit tests).
 *
 *     (read, send) => (factor => (value => ...))  |  fiend
 *     (read, send) => (factor1 => factor2)        |
 *     (read, send) => transducer                  |
 *
 *
 * A _send_ function is an input to a factor queue. It kicks a message across
 * the factor chain. All factors share the exact same `send` function, and can
 * re-send a message from the start of the chain at any time. To encourage
 * push-based rather than pull-based concurrency, `send` is void
 * (doesn't return a value).
 */

// (...fiends) => (read, write) => send
exports.createFq = createFq
function createFq () {
  const func = squash.apply(null, arguments)

  return (read, write) => {
    const next = func(read, send)(write)

    function send (msg) {
      if (msg == null) throw Error(`Message can't be null or undefined, got: ${msg}`)
      next(msg)
    }

    return send
  }
}

// (...fiends) => (read, send) => fq
function squash () {
  const funcs = Array.prototype.slice.call(arguments)
  funcs.forEach(validateFunc)
  return (read, send) => pipe.apply(null, funcs.map(func => func(read, send)))
}

// (...transducers) => transducer
exports.pipe = pipe
function pipe () {
  const funcs = Array.prototype.slice.call(arguments)
  funcs.forEach(validateFunc)
  return next => funcs.reduceRight((next, func) => func(next), next)
}

// (pattern, factor) => transducer
exports.match = match
function match (pattern, func) {
  return multimatch(pattern, () => func)
}

// (pattern, transducer) => transducer
exports.multimatch = multimatch
function multimatch (pattern, func) {
  validateFunc(func)
  const test = toTest(pattern)

  return next => {
    func = func(next)
    validateFunc(func)
    return msg => (test(msg) ? func : next)(msg)
  }
}

/**
 * Utils
 */

function validateFunc (func) {
  if (typeof func !== 'function') {
    throw Error(`Expected a function, got: ${func}`)
  }
}

/* #if TESTING
exports.toTest = toTest
#endif TESTING */
function toTest (pattern) {
  if (typeof pattern === 'function') return pattern
  if (isNaNForReal(pattern)) return isNaNForReal
  if (!isObject(pattern)) return value => value === pattern
  return objectToTest(pattern)
}

function objectToTest (pattern) {
  const test = Object.keys(pattern).map(key => ({key, test: toTest(pattern[key])}))
  return value => isObject(value) && test.every(pair => pair.test(value[pair.key]))
}

function isObject (value) {
  return value !== null && typeof value === 'object'
}

function isNaNForReal (value) {
  return value !== value  // eslint-disable-line
}
