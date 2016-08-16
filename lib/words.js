'use strict'

const {map} = Array.prototype
const {getIn, is, putIn, patchIn} = require('emerge')
const {bind, pipe, defer, spread, slice, indexOf, ifonly, test,
       isList, isPrimitive, isObject, isFunction,
       validate, validateEach} = require('fpx')
const pub = exports

/**
 * Identity Types
 */

// Place

exports.Place = Place
function Place () {
  return bindTo({idle: true, pending: []}, {enque})
}

exports.enque = enque
function enque (place, fun, ...args) {
  validate(isFunction, fun)

  place.pending.push(
    !args.length
    ? fun
    : function runTask (place) {return fun(place, ...args)}
  )

  if (place.idle) {
    place.idle = false
    try {flush(place)}
    finally {place.idle = true}
  }
}

exports.flush = flush
function flush (place) {
  try {while (place.pending.length) place.pending.shift()(place)}
  catch (err) {flush(place); throw err}
}

// Private for now. Works only on tasks created without extra args.
function abort (ref, task) {
  pull(ref.pending, task)
}

// Ref

exports.Ref = Ref
function Ref (state) {
  return bindTo(
    assign(Place(), {state, watches: {}}),
    {swap, forceSwap, addWatch, removeWatch, notifyWatches}
  )
}

exports.swap = swap
function swap (ref, ...args) {
  ref.enque(doSwap, ...args)
}

function doSwap (ref, mod, ...args) {
  const prev = ref.state
  const next = ref.state = mod(prev, ...args)
  if (!is(prev, next)) ref.notifyWatches(prev, next)
}

// Like `swap` but always notifies watches.
exports.forceSwap = forceSwap
function forceSwap (ref, ...args) {
  ref.enque(doForceSwap, ...args)
}

function doForceSwap (ref, mod, ...args) {
  const prev = ref.state
  const next = ref.state = mod(prev, ...args)
  ref.notifyWatches(prev, next)
}

function notifyWatches (ref, prev, next) {
  // Use the same `watches` reference during iteration. If it's mutable, keys
  // may still get deleted in the process; `for..in` automatically skips them.
  const {watches} = ref
  for (const key in watches) watches[key].call(null, key, ref, prev, next)
}

exports.addWatch = addWatch
function addWatch (ref, key, fun) {
  validate(isPrimitive, key)
  validate(isFunction, fun)
  ref.watches = putIn(ref.watches, [key], fun)
}

exports.removeWatch = removeWatch
function removeWatch (ref, key) {
  if (key in ref.watches) ref.watches = putIn(ref.watches, [key], null)
}

// This is deadlock-prone. TODO figure out a better delay strategy.
exports.delayingWatch = delayingWatch
function delayingWatch (fun) {
  validate(isFunction, fun)

  let args = null

  function delayedTask (ref) {
    if (ref.pending.length) restart(ref)
    else {
      const args_ = args
      args = null
      fun(...args_)
    }
  }

  function restart (ref) {
    abort(ref, delayedTask)
    ref.enque(delayedTask)
  }

  return function delayingWatcher (key, ref, prev, next) {
    args = args ? [key, ref, args[2], next] : [key, ref, prev, next]
    restart(ref)
  }
}

/**
 * Utils
 */

// Should probably move to Emerge
pub.putInBy = putInBy
function putInBy (state, path, fun, ...args) {
  return putIn(state, path, fun(getIn(state, path), ...args))
}

// Should probably move to Emerge
pub.patchInBy = patchInBy
function patchInBy (state, path, fun, ...args) {
  return patchIn(state, path, fun(getIn(state, path), ...args))
}

pub.readCursors = readCursors
function readCursors (cursors, value) {
  return map.call(cursors, readCursor, value)
}

function readCursor (cursor) {
  return getBy(cursor, this)
}

function getBy (cursor, value) {
  return isFunction(cursor) ? cursor(value) : getIn(value, cursor)
}

pub.cursorsChanged = cursorsChanged
function cursorsChanged (cursors, prev, next) {
  return !!findBy(cursorChanged, cursors, prev, next)
}

// This assumes that state is always modified with Emerge functions. Emerge
// preserves old references when values are unchanged, which allows us to
// compare by identity, avoiding a deep equality check.
function cursorChanged (cursor, _i, prev, next) {
  return !is(getBy(cursor, prev), getBy(cursor, next))
}

pub.changed = defer(cursorsChanged)

pub.pan = pan
function pan (cursors, fun) {
  return pipe(bind(readCursors, cursors), spread(fun))
}

exports.pass = pass
function pass (_, x) {return x}

pub.on = on
function on (pattern, fun) {
  return ifonly(pipe(pass, test(pattern)), fun)
}

exports.logArgs = logArgs
function logArgs (callee, caller, ...extras) {
  let log = []
  function logger (...args) {
    if (log) log.push(args)
    return callee(...args)
  }
  try {return [caller.call(this, logger, ...extras), log]}
  finally {log = null}  // prevents async gotchas
}

pub.swapBy = swapBy
function swapBy (fun, ...extra) {
  return (env, ...args) => {
    env.swap(fun, ...extra, ...args)
  }
}

// Like `clojure.core/some`: returns the first truthy result produced by `test`.
// Private for now, unsure about name.
function findBy (test, list, a, b, c) {
  for (let i = -1; ++i < list.length;) {
    const value = test(list[i], i, a, b, c)
    if (value) return value
  }
}

/**
 * DANGER ZONE: mutations!
 */

const global = new Function('return this')()

exports.defonce = defonce
function defonce (path, def, ...args) {
  validateEach(isPrimitive, path)
  return getIn(global, path) || setIn(global, path, def(...args))
}

function assign (mut, src) {
  if (src) for (const key in src) mut[key] = src[key]
  return mut
}

function bindTo (ref, methods) {
  for (const key in methods) ref[key] = methods[key].bind(undefined, ref)
  return ref
}

function setIn (mut, path_, value) {
  validate(isList, path_)
  if (!path_.length) throw Error('Expected non-empty path')
  const path = slice(path_)

  while (path.length > 1) {
    const key = path.shift()
    if (!isMutable(mut[key])) mut[key] = {}
    mut = mut[key]
  }

  return mut[path.shift()] = value
}

function isMutable (value) {
  return (isObject(value) || isFunction(value)) && !Object.isFrozen(value)
}

function pull (list, value) {
  const index = indexOf(list, value)
  if (~index) list.splice(index, 1)
}
