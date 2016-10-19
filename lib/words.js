'use strict'

const {scan, getIn, is, putIn, patchIn} = require('emerge')
const {bind, pipe, defer, spread, alter,
       ifelse, ifonly, test, testArgsAnd, and, or, not, id, di,
       slice, indexOf, foldl,
       isPrimitive, isObject, isFunction,
       validate, validateEach} = require('fpx')
const {map} = Array.prototype
const {isFrozen} = Object
const pub = exports
const global = pub.global = typeof self === 'object' ? self : Function('return this')()

/**
 * TODO
 *
 * Figure out how to codify reducers, computers and effects in library code.
 * Right now, they're just too trivial to define in application code.
 *
 * Check how `fun(x, ...args)` affects performance in a tight loop.
 */

/**
 * Atom
 *
 * Similar to `clojure.core/atom`.
 */

pub.Atom = Atom
function Atom (state) {
  return bindTo(assign(TaskQue(), {state, watches: {}}), Atom)
}

Atom.swap = function swap (ref, ...args) {
  ref.enque(doSwap, ...args)
}

function doSwap (ref, mod, ...args) {
  const prev = ref.state
  const next = ref.state = mod(prev, ...args)
  if (!is(prev, next)) ref.notifyWatches(prev, next)
}

// Like `swap` but always notifies watches.
Atom.forceSwap = function forceSwap (ref, ...args) {
  ref.enque(doForceSwap, ...args)
}

function doForceSwap (ref, mod, ...args) {
  const prev = ref.state
  const next = ref.state = mod(prev, ...args)
  ref.notifyWatches(prev, next)
}

Atom.notifyWatches = function notifyWatches (ref, prev, next) {
  // Use the same `watches` reference during iteration. If it's mutable, keys
  // may still get deleted in the process; `for..in` automatically skips them.
  const {watches} = ref
  for (const key in watches) watches[key].call(null, key, ref, prev, next)
}

Atom.addWatch = function addWatch (ref, key, fun) {
  validate(isPrimitive, key)
  validate(isFunction, fun)
  ref.watches = putIn(ref.watches, [key], fun)
}

Atom.removeWatch = function removeWatch (ref, key) {
  if (key in ref.watches) ref.watches = putIn(ref.watches, [key], null)
}

// This is deadlock-prone. TODO figure out a better delay strategy.
pub.delayingWatch = delayingWatch
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
 * TaskQue
 */

pub.TaskQue = TaskQue
function TaskQue () {
  return bindTo({idle: true, pending: []}, TaskQue)
}

TaskQue.enque = function enque (que, task, ...args) {
  validate(isFunction, task)

  que.pending.push(args.length ? alter(task, ...args) : task)

  if (que.idle) {
    que.idle = false
    try {flush(que)}
    finally {que.idle = true}
  }
}

function flush (que) {
  try {while (que.pending.length) que.pending.shift()(que)}
  catch (err) {flush(que); throw err}
}

// Private for now. Works only on tasks created without extra args.
function abort (que, task) {
  pull(que.pending, task)
}

/**
 * TaskQueAsync
 *
 * Same as spamming 'setImmediate(task)', but guarantees linear execution
 * within one queue and allows to cancel pending tasks.
 */

const setTimer = global.setImmediate || global.setTimeout
const delTimer = global.clearImmediate || global.clearTimeout

pub.TaskQueAsync = TaskQueAsync
function TaskQueAsync () {
  return bindTo({pending: [], flushTimer: null}, TaskQueAsync)
}

TaskQueAsync.enque = function enque (que, task, ...args) {
  validate(isFunction, task)
  que.pending.push(args.length ? alter(task, ...args) : task)
  if (!que.flushTimer) que.flushTimer = setTimer(que.flush)
}

TaskQueAsync.clear = function clear (que) {
  delTimer(que.flushTimer)
  que.pending.splice(0)
}

TaskQueAsync.flush = function flush (que) {
  try {
    if (que.pending.length) que.pending.shift()(que)
  }
  finally {
    que.flushTimer = que.pending.length ? setTimer(que.flush) : null
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
  return !!procure(cursorChanged, cursors, prev, next)
}

// This assumes that state is always modified with Emerge functions. Emerge
// preserves old references when values are unchanged, which allows us to
// compare by identity, avoiding a deep equality check.
function cursorChanged (cursor, _i, prev, next) {
  return !is(getBy(cursor, prev), getBy(cursor, next))
}

const changed = pub.changed = defer(cursorsChanged)

pub.pan = pan
function pan (cursors, fun) {
  return pipe(bind(readCursors, cursors), spread(fun))
}

// BC alias
pub.pass = di

pub.on = pub.onEvent = on
function on (pattern, fun) {
  return ifonly(pipe(di, test(pattern)), fun)
}

// WTB better name
pub.match = match
function match (testA, testB, fun) {
  return ifonly(testArgsAnd(testA, testB), fun)
}

// `spyArgs`? `spyCalls`?
pub.logArgs = logArgs
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
function swapBy (fun, ...args) {
  validate(isFunction, fun)
  return function swapBy_ (ref) {
    return ref.swap(fun, ...args)
  }
}

pub.swapInto = swapInto
function swapInto (fun) {
  validate(isFunction, fun)
  return function swapInto_ (env, ...args) {
    return env.swap(fun, ...args)
  }
}

pub.joinReducers = joinReducers
function joinReducers (reducers) {
  validateEach(isFunction, reducers)
  return function joinedReduce (state, event) {
    return foldl(bind(calcReduce, event), state, reducers)
  }
}

function calcReduce (event, state, reducer) {
  return putIn(state, [], reducer(state, event))
}

pub.joinComputers = joinComputers
function joinComputers (computers) {
  validateEach(isFunction, computers)
  return function joinedCompute (prev, next) {
    return foldlConverge(bind(calcCompute, prev), next, computers)
  }
}

function calcCompute (prev, next, computer) {
  return putIn(next, [], computer(prev, next))
}

function foldlConverge (fun, prev, list) {
  const next = foldl(fun, prev, list)
  return is(prev, next)
    ? next
    : foldlConverge(fun, next, list)
}

pub.compute = compute
function compute (path, cursors, fun) {
  return ifelse(
    changed(cursors),
    bind(computeBase, path, cursors, fun, putIn),
    di
  )
}

pub.computePatch = computePatch
function computePatch (path, cursors, fun) {
  return ifelse(
    changed(cursors),
    bind(computeBase, path, cursors, fun, patchIn),
    di
  )
}

function computeBase (path, cursors, fun, mergeIn, prev, next) {
  return mergeIn(next, path, fun(...readCursors(cursors, next)))
}

pub.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (_key, ref, prev, next) {
    if (!paths || cursorsChanged(paths, prev, next)) {
      const [result, paths_] = logArgs.call(this, bind(scan, next), reader, ref)
      paths = paths_
      return result
    }
  }
}

// Like `fpx.procure` but with extra args.
function procure (test, list, a, b, c) {
  for (let i = -1; ++i < list.length;) {
    const value = test(list[i], i, a, b, c)
    if (value) return value
  }
}

/**
 * DANGER ZONE: mutations!
 */

pub.redef = redef
function redef (path, fun) {
  validateEach(isPrimitive, path)
  validate(isFunction, fun)
  return setIn(global, path, fun(getIn(global, path)))
}

pub.defonce = defonce
function defonce (path, fun, ...args) {
  validate(isFunction, fun)
  return redef(path, or(id, bind(fun, ...args)))
}

pub.assign = assign
function assign (mut, src) {
  if (src) for (const key in src) mut[key] = src[key]
  return mut
}

pub.bindTo = bindTo
function bindTo (ref, values) {
  for (const key in values) {
    if (isFunction(values[key])) ref[key] = values[key].bind(undefined, ref)
  }
  return ref
}

function setIn (mut, path_, value) {
  validateEach(isPrimitive, path_)
  if (!path_.length) throw Error('Expected non-empty path')
  const path = slice(path_)

  while (path.length > 1) {
    const key = path.shift()
    if (!isMutable(mut[key])) mut[key] = {}
    mut = mut[key]
  }

  return mut[path.shift()] = value
}

const isMutable = and(or(isObject, isFunction), not(isFrozen))

function pull (list, value) {
  const index = indexOf(list, value)
  if (~index) list.splice(index, 1)
}
