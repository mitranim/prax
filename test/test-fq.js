'use strict'

/** ***************************** Dependencies *******************************/

const pt = require('path')
const main = pt.join(__dirname, '..', require('../package')['jsnext:main'])

const immute = require('emerge').immute
const readAtPath = require('emerge').readAtPath

const match = require(main).match
const multimatch = require(main).multimatch
const pipe = require(main).pipe
const createFq = require(main).createFq
const toTest = require(main).toTest

/** ********************************* Test ***********************************/

/**
 * Globals
 */

let last, called, transducer, factor, throwWhenCalled

const tree = immute({
  one: {two: [2]},
  four: [4],
  seven: {eight: NaN}
})

const read = function () {
  return readAtPath(tree, arguments)
}

const write = value => last = value

const RESET = () => {
  last = called = transducer = factor = throwWhenCalled = undefined
}

const circular = () => circular

const id = _ => _

/**
 * toTest
 *
 * This is used by `match` and `multimatch` to convert a pattern a test. It's
 * not in the public API. It's easier for us to test it separately from
 * `match` and `multimatch`.
 */

// Primitives.

if (toTest('pattern')('PATTERN')) throw Error()
if (!toTest('pattern')('pattern')) throw Error()

if (toTest(NaN)(undefined)) throw Error()
if (!toTest(NaN)(NaN)) throw Error()

// Functions.

if (toTest(isNumber)('not a number')) throw Error()
if (!toTest(isNumber)(Infinity)) throw Error()

// Objects.

if (toTest({type: 'fork'})({type: 'FORK'})) throw Error()
if (toTest({type: 'fork'})(null)) throw Error()
if (!toTest({type: 'fork'})({type: 'fork', extra: true})) throw Error()

// Nested objects.

if (toTest({space: {time: NaN}})({space: {}})) throw Error()
if (toTest({space: {time: NaN}})({space: {time: {}}})) throw Error()
if (toTest({space: {time: NaN}})({space: null})) throw Error()
if (!toTest({space: {time: NaN}})({space: {time: NaN}, extra: true})) throw Error()

// Combined and nested.

if (toTest({space: {time: NaN}, value: isNumber})({space: {}})) throw Error()
if (toTest({space: {time: NaN}, value: isNumber})({space: {time: {}}, value: 'not a number'})) throw Error()
if (!toTest({space: {time: NaN}, value: isNumber})({space: {time: NaN}, value: Infinity})) throw Error()

/**
 * match
 *
 * `match` takes a pattern and a factor and returns a transducer: a function
 * that takes an external factor and returns a new factor. The end result is a
 * function that takes a value and matches it against the pattern. If the
 * pattern is matched, the value is passed to the original factor. If not, it's
 * passed to the external factor.
 *
 * given:
 *
 *     // internal
 *     I = v => ...
 *     // external
 *     E = v => ...
 *     v = some value
 *
 * match:
 *
 *     (pattern, I) => E => v => patternMatches(v) ? I(v) : E(v)
 *     (pattern, I) => E => factor
 *     (pattern, I) => transducer
 */

RESET()

transducer = match({type: 'hit'}, write)

factor = transducer(() => {
  last = 'default'
  if (throwWhenCalled) throw Error()
})

// Missing the pattern should call the external factor.
factor('miss')
if (last !== 'default') throw Error()

// Hitting the pattern should call the internal factor, but not the external.
throwWhenCalled = true
factor({type: 'hit', value: Infinity})
if (last.value !== Infinity) throw Error()

/**
 * multimatch
 *
 * `multimatch` takes a pattern and a transducer. It returns a transducer that,
 * when called with an external factor, internally calls the original transducer
 * to receive an internal factor that closures the external factor and has the
 * ability to call it. It then transduces that factor and returns the third,
 * final factor. When called with a value, it checks the value against the
 * pattern and passes it to either the internal or the external factor.
 *
 * The main difference from `match` is that `multimatch` passes the external
 * factor to the user-defined transducer, giving the opportunity to closure it
 * in the factor that will be called with the pattern is matched.
 *
 * given:
 *
 *     // closures E and returns a factor
 *     T => E => v => ...
 *     // external
 *     E = v => ...
 *     v = some value
 *
 * multimatch:
 *
 *     (pattern, T) => E => v => patternMatches(v) ? T(E)(v) : E(v)
 *     (pattern, T) => E => factor
 *     (pattern, T) => transducer
 *
 * The scheme above is simplistic. The transducer is only called once.
 */

RESET()

transducer = multimatch(isNumber, next => value => {next(value * 2)})

factor = transducer(write)

// Missing the pattern should call the external factor.
factor('miss')
if (last !== 'miss') throw Error()

// Hitting the pattern should call the internal factor, which, in our case,
// has the ability to call the external factor.
factor(10)
if (last !== 20) throw Error()

/**
 * pipe
 *
 * `pipe` takes any number of functions with the arity of 1 and welds them
 * together into a pipeline, where the output of each function is passed to
 * the next. It can be used to combine transducers or factors.
 */

if (pipe(x => x * 2, x => -x)(1) !== -2) throw Error()

/**
 * createFq
 */

RESET()

// Should blow up if you pass a non-function.
shouldThrow(() => {createFq(true)})

const first = (readFunc, send) => {
  called = true
  if (readFunc !== read) throw Error()
  if (typeof send !== 'function') throw Error()
  if (send === write) throw Error()

  // `send` should be non-functional yet.
  shouldThrow(() => {send(true)})

  return id
}

const second = () => id

const fq = createFq(first, second)

if (typeof fq !== 'function') throw Error()

const send = fq(read, write)

if (!called) throw Error()

// Write shouldn't have been called yet.
if (last !== undefined) throw Error()

// Should blow up if you pass a function that doesn't return a function.
shouldThrow(() => {createFq(() => {})(read, write)})

// Should be alright if you pass a function that returns a function.
createFq(circular)(read, write)

/**
 * send
 */

RESET()

// Shouldn't accept null or undefined.
shouldThrow(() => {send(null)})
shouldThrow(() => {send(undefined)})

const secret = Symbol()

// Should ultimately be connected to `write`.
send(secret)
if (last !== secret) throw Error()

/**
 * Utils
 */

function isNumber (value) {
  return typeof value === 'number'
}

function shouldThrow (func) {
  let error
  try {
    func()
  } catch (err) {
    error = err
  } finally {
    if (!error) throw Error()
  }
}
