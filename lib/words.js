'use strict'

const {scan, getIn, is, putIn, patchIn} = require('emerge')
const {bind, pipe, defer, rest, spread, ifelse, ifonly, test, every,
       di, slice, foldl,
       isString, isFunction, isList, validate, validateEach} = require('fpx')
const {map} = Array.prototype
const pub = exports

/**
 * TODO
 *
 * Figure out how to codify reducers, computers and effects in library code.
 * Right now, they're just too trivial to define in application code.
 */

// This is deadlock-prone. TODO figure out a better delay strategy.
// Relies on the knowledge of `Atom` internals. TODO expose a better interface.
pub.delayingWatcher = delayingWatcher
function delayingWatcher (fun) {
  validate(isFunction, fun)

  let args = null
  let abort = null

  function delayedTask (ref) {
    if (!ref.que.isEmpty()) restart(ref)
    else {
      abort = null
      const prevArgs = args
      args = null
      fun(...prevArgs)
    }
  }

  function restart (ref) {
    if (abort) abort()
    abort = ref.enque(bind(delayedTask, ref))
  }

  return function delayingWatcher (ref, prev, next) {
    args = args ? [ref, args[1], next] : [ref, prev, next]
    restart(ref)
  }
}

/**
 * Utils
 */

pub.isCursor = isCursor
function isCursor (value) {
  return isFunction(value) || isList(value) && every(isString, value)
}

pub.readCursors = readCursors
function readCursors (cursors, value) {
  return map.call(cursors || [], readCursor, value)
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

pub.changed = rest(defer(cursorsChanged))

pub.pan = pan
function pan (cursors, fun) {
  return pipe(bind(readCursors, cursors), spread(fun))
}

pub.on = pub.onEvent = on
function on (pattern, fun) {
  return ifonly(pipe(di, test(pattern)), fun)
}

pub.logCalls = logCalls
function logCalls (caller, wrapped) {
  let log = []
  function logger () {
    if (log) log.push(slice(arguments))
    return wrapped(...arguments)
  }
  try {return [caller.call(this, logger, ...slice(arguments, 2)), log]}
  finally {log = null}  // prevents async gotchas
}

pub.swapBy = swapBy
function swapBy (fun) {
  validate(isFunction, fun)
  const args = arguments
  return function swapBy_ (ref) {
    return ref.swap(...args)
  }
}

pub.swapInto = swapInto
function swapInto (fun) {
  validate(isFunction, fun)
  return function swapInto_ (ref) {
    return ref.swap(fun, ...slice(arguments, 1))
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
    bind(cursorsChanged, cursors),
    bind(computeBase, path, cursors, fun, putIn),
    di
  )
}

pub.computePatch = computePatch
function computePatch (path, cursors, fun) {
  return ifelse(
    bind(cursorsChanged, cursors),
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
  return function watcher (ref, prev, next) {
    if (!paths || cursorsChanged(paths, prev, next)) {
      const [result, paths_] = logCalls.call(this, reader, bind(scan, next), ref)
      paths = paths_
      return result
    }
  }
}

// Like `fpx.procure` but with extra args.
function procure (test, list, a, b, c) {
  if (!isList(list)) return
  for (let i = -1; ++i < list.length;) {
    const value = test(list[i], i, a, b, c)
    if (value) return value
  }
}
