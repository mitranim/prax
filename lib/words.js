'use strict'

const {putAt, patchAt} = require('emerge')
const {id, is, or, get, bind, flat, pipe, test, defer, getIn, apply, foldl,
       slice, ifthen, ifonly, spread, isArray, isObject, validate, isFunction,
       validateEach, isPlainObject} = require('fpx')

const pub = exports  // for minification

/**
 * Paths
 */

pub.readSources = pub.readAll = readSources
function readSources (sources, value) {
  return mapWithLast(resolveSource, sources, value)
}

pub.pathsChanged = pathsChanged
function pathsChanged (paths, prev, next) {
  return someWith(pathChanged, paths, prev, next)
}

const changed = pub.changed = defer(pathsChanged)

pub.pan = pan
function pan (sources, fun) {
  return pipe(bind(readSources, sources), spread(fun))
}

const give = pub.give = pipe(pan, bind(pipe, pass2))

// utils

function resolveSource (source, last, value) {
  return getIn(value, isFunction(source) ? source(last) : source)
}

function mapWithLast (fun, list, a, b) {
  const out = []
  for (let i = -1; ++i < list.length;) out.push(fun(list[i], out[i - 1], a, b))
  return out
}

function someWith (test, list, a, b) {
  for (let i = -1; ++i < list.length;) if (test(list[i], i, a, b)) return true
  return false
}

function pathChanged (path, _, prev, next) {
  return !is(getIn(prev, path), getIn(next, path))
}

/**
 * Reduce
 */

pub.st = st
function st (type, value) {
  return {type, value}
}

pub.stk = stk
function stk (type, key, value) {
  return {type, key, value}
}

// Backwards compatibility, TODO remove.
pub.std = stk

// WTB better names.
pub.stf = defer(st)
pub.stkf = defer(stk)

pub.onEvent = onEvent
function onEvent (pattern, fun) {
  return ifonly(pipe(pass2, test(pattern)), fun)
}

pub.onType = onType
function onType (type, fun) {
  return onEvent({type}, fun)
}

pub.on = on
function on (type, fun) {
  validate(isFunction, fun)
  return onType(type, (state, {value, key}) => fun(state, value, key))
}

pub.one = one
function one (type, fun) {
  validate(isFunction, fun)
  return onEvent({type, key: t}, (state, {value, key}) => patchAt(
    [key],
    state,
    fun(get(state, key), value, key)
  ))
}

const t = or(Boolean, test(''), test(0))

pub.manage = manage
function manage (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, putAt))
}

pub.managePatch = managePatch
function managePatch (path) {
  return flat(slice(arguments, 1)).map(bind(manageOne, path, patchAt))
}

function manageOne (path, merge, fun) {
  return (state, event) => (
    merge(path, state, fun(getIn(state, path), event))
  )
}

pub.pass2 = pass2
pub.pass = pass2  // BC alias
function pass2 () {return arguments[1]}

pub.pass3 = pass3
function pass3 () {return arguments[2]}

pub.pass4 = pass4
function pass4 () {return arguments[3]}

pub.upgrade = bind(pipe, mergeTwo)

function mergeTwo (left, right) {
  return isObject(right) ? patchAt([], left, right) : left
}

/**
 * Compute
 */

// public

// Usage:
//   compute(['myCollection'], [['one'], ['other']], formula)
pub.compute = bind(computeBase, putAt)

pub.computePatch = bind(computeBase, patchAt)

// Utils

function computeBase (merge, path, sources, formula) {
  validate(isFunction, formula)
  validate(isArray, path)
  validateEach(isValidSource, sources)

  return (prev, next) => ifChanged(
    readSources(sources, prev),
    readSources(sources, next),
    formula,
    bind(merge, path, next),
    next
  )
}

function ifChanged (left, right, formula, out, def) {
  return !shallowEqual(left, right) ? out(apply(formula, right)) : def
}

function shallowEqual (left, right) {
  return foldl(eq, left, right)
}

function eq (acc, value, index) {
  return acc && is(value, acc[index]) ? acc : null
}

function isValidSource (value) {
  return isArray(value) || isFunction(value)
}

/**
 * Effects
 */

pub.where = where
function where (paths, predicate, effect) {
  return ifthen(
    changed(paths),
    give(paths, ifthen(predicate, effect))
  )
}

pub.when = pipe(condition, Watcher)

pub.whenOneOf = collectionCond

pub.match = match
function match (pattern, effect) {
  return _match(test(pattern), effect)
}

function _match (test, effect) {
  return (_, next, event) => test(event) ? effect(event, next) : undefined
}

// DEPRECATED proactive watchers

// Usage:
//   const when = When(Watch(app))
//   when(read => read('...'), result => {/* ... */})
pub.When = bind(pipe, condition)

// Usage:
//   const whenOneOf = WhenOneOf(app.addEffect)
//   ...
pub.WhenOneOf = bind(pipe, collectionCond)

// Utils

function condition (predicate, effect) {
  let prev
  let next
  return function runCond (read) {
    prev = next
    next = predicate(read)
    if (next && !is(prev, next)) return effect(next)
  }
}

// TODO rewrite functionally.
function collectionCond (path, predicate, effect) {
  return function runCollectionCond (prev, next) {
    prev = getIn(prev, path)
    next = getIn(next, path)

    if (is(prev, next)) return
    if (!isPlainObject(next)) return
    if (!isPlainObject(prev)) prev = {}

    return mapObject((value, key) => (
      runElementCond(value, key, prev, predicate, effect)
    ), next).filter(Boolean)
  }
}

// TODO rewrite functionally.
function runElementCond (nextValue, key, prev, predicate, effect) {
  // base value: non-nil
  if (nextValue == null) return

  // base value: change detection
  const prevValue = prev[key]
  if (is(prevValue, nextValue)) return

  // predicate result: Boolean
  const result = predicate(nextValue, key)
  if (!result) return

  // predicate result: change detection
  if (prevValue && is(predicate(prevValue, key), result)) return

  return effect(key, nextValue, result)
}

function mapObject (fun, value) {
  return Object.keys(value).map(key => fun(value[key], key))
}

/**
 * Watch
 */

// Note: a watcher maintains internal state and shares intentionally mutable
// data with other functions. It's a double antipattern. We want to avoid this
// in other utilities.
pub.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (prev, next) {
    if (!paths || pathsChanged(paths, prev, next)) {
      paths = []
      const result = reader(Read(paths, next))
      // Avoid further mutations.
      paths = paths.slice()
      return result
    }
  }
}

// Note: this function mutates a value that crosses function boundaries
// (`paths`). It's an antipattern we want to avoid as much as possible.
function Read (paths, value) {
  return function read () {
    paths.push(arguments)
    return getIn(value, arguments)
  }
}

// Usage:
//   const watch = Watch(app.enque)
pub.Watch = bind(pipe, Watcher)

// Usage:
//   const watchNow = WatchNow(app)
pub.WatchNow = WatchNow
function WatchNow (app) {
  return function watchNow (reader) {
    const watcher = Watcher(reader)
    watcher(app.getPrev(), app.getMean())
    return app.addEffect(watcher)
  }
}
