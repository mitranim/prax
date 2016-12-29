'use strict'

const {scan, getIn, is, putIn, patchIn} = require('emerge')
const {bind, pipe, defer, rest, spread, ifelse, ifonly, test, or, every,
       id, di, slice, indexOf, foldl, append, remove,
       isString, isComplex, isFunction, isList, validate, validateEach} = require('fpx')
const {map} = Array.prototype
const {isFrozen} = Object
const pub = exports

/**
 * TODO
 *
 * Figure out how to codify reducers, computers and effects in library code.
 * Right now, they're just too trivial to define in application code.
 *
 * Check how `fun(x, ...args)` affects performance in a tight loop.
 */

/**
 * TaskQue
 */

pub.TaskQue = TaskQue
function TaskQue () {
  if (!isInstance(TaskQue, this)) return new TaskQue()
  this.idle = true
  this.pending = []
  bindAll(this)
}

assign(TaskQue.prototype, {
  enque (task) {
    validate(isFunction, task)
    const args = slice(arguments, 1)
    this.pending.push(args.length ? task.bind(this, ...args) : task)
    if (this.idle) {
      this.idle = false
      try {flushQue.call(this)}
      finally {this.idle = true}
    }
  },
})

function flushQue () {
  try {while (this.pending.length) this.pending.shift()(this)}
  catch (err) {flushQue.call(this); throw err}
}

// Private for now. Works only on tasks created without extra args.
function abortTask (task) {
  pull(this.pending, task)
}

/**
 * TaskQueAsync
 *
 * Same as spamming 'setImmediate(task)', but guarantees linear execution
 * within one queue and allows to cancel pending tasks.
 */

pub.TaskQueAsync = TaskQueAsync
function TaskQueAsync () {
  if (!isInstance(TaskQueAsync, this)) return new TaskQueAsync()
  this.flushTimer = null
  this.pending = []
  bindAll(this)
}

assign(TaskQueAsync.prototype, {
  enque (task) {
    validate(isFunction, task)
    const args = slice(arguments, 1)
    this.pending.push(args.length ? task.bind(this, ...args) : task)
    if (!this.flushTimer) this.flushTimer = setTimeout(this.flush)
  },
  flush () {
    try {
      if (this.pending.length) this.pending.shift().call(this)
    }
    finally {
      this.flushTimer = this.pending.length ? setTimeout(this.flush) : null
    }
  },
  clear () {
    clearTimeout(this.flushTimer)
    this.pending.splice(0)
  },
})

/**
 * Atom
 *
 * Similar to `clojure.core/atom`.
 */

pub.Atom = Atom
function Atom (state) {
  if (!isInstance(Atom, this)) return new Atom(state)
  this.state = state
  this.watchers = []
  TaskQue.call(this)
}

assign(Atom.prototype, TaskQue.prototype, {
  swap (mod) {
    validate(isFunction, mod)
    const [prev, next] = commitState.apply(this, arguments)
    if (!is(prev, next)) this.enque(this.notifyWatchers, prev, next)
    return next
  },
  notifyWatchers (prev, next) {
    const notifyWatcher = fun => {fun(this, prev, next)}
    this.watchers.forEach(notifyWatcher)
  },
  addWatcher (fun) {
    validate(isFunction, fun)
    this.watchers = append(this.watchers, fun)
    return this.removeWatcher.bind(this, fun)
  },
  removeWatcher (fun) {
    this.watchers = remove(this.watchers, fun)
  },
})

function commitState (mod) {
  const prev = this.state
  const next = this.state = mod(prev, ...slice(arguments, 1))
  return [prev, next]
}

// This is deadlock-prone. TODO figure out a better delay strategy.
pub.delayingWatcher = delayingWatcher
function delayingWatcher (fun) {
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
    abortTask.call(ref, delayedTask)
    ref.enque(delayedTask)
  }

  return function delayingWatcher (ref, prev, next) {
    args = args ? [ref, args[1], next] : [ref, prev, next]
    restart(ref)
  }
}

/**
 * Utils
 */

// Should probably move to Emerge
pub.putInBy = putInBy
function putInBy (state, path, fun) {
  return putIn(state, path, fun(getIn(state, path), ...slice(arguments, 3)))
}

// Should probably move to Emerge
pub.patchInBy = patchInBy
function patchInBy (state, path, fun) {
  return patchIn(state, path, fun(getIn(state, path), ...slice(arguments, 3)))
}

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
function logCalls (callee, caller) {
  let log = []
  function logger () {
    if (log) log.push(slice(arguments))
    return callee(...arguments)
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
      const [result, paths_] = logCalls.call(this, bind(scan, next), reader, ref)
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

exports.linear = linear
function linear (fun) {
  validate(isFunction, fun)
  return bind(TaskQue().enque, fun)
}

/**
 * DANGER ZONE: mutations!
 */

pub.global = typeof self === 'object' && self || Function('return this')()  // eslint-disable-line

pub.redef = redef
function redef (storage, path, fun) {
  validate(isFunction, fun)
  return setIn(storage, path, fun(getIn(storage, path)))
}

pub.defonce = defonce
function defonce (storage, path, fun) {
  validate(isFunction, fun)
  return redef(storage, path, or(id, bind(fun, ...slice(arguments, 3))))
}

pub.assign = assign
function assign (mut) {
  return slice(arguments, 1).reduce(assignOne, isMutable(mut) ? mut : {})
}

function assignOne (mut, src) {
  if (src) for (const key in src) mut[key] = src[key]
  return mut
}

// Duck-typed version of `instanceof`.
pub.isInstance = isInstance
function isInstance ({prototype}, value) {
  if (!isComplex(value)) return false
  for (const key in prototype) if (!(key in value)) return false
  return true
}

pub.bindAll = bindAll
function bindAll (object) {
  for (const key in object) {
    if (isFunction(object[key])) object[key] = object[key].bind(object)
  }
}

function setIn (mut, path_, value) {
  validate(isMutable, mut)
  validateEach(isString, path_)

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
  return isComplex(value) && !isFrozen(value)
}

function pull (list, value) {
  const index = indexOf(list, value)
  if (~index) list.splice(index, 1)
}
