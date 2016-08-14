'use strict'

const {scan, is, putIn, putAt, patchAt} = require('emerge')
const {bind, foldl, ifelse, isFunction, validateEach} = require('fpx')
const {readCursors, cursorsChanged, changed, pass, logArgs} = require('./words')
const pub = exports

/**
 * Reduce
 */

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

/**
 * Compute
 *
 * Unsure which shape compute utils should take
 */

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
    bind(computeBase, path, cursors, fun, putAt),
    pass
  )
}

pub.computePatch = computePatch
function computePatch (path, cursors, fun) {
  return ifelse(
    changed(cursors),
    bind(computeBase, path, cursors, fun, patchAt),
    pass
  )
}

function computeBase (path, cursors, fun, mergeAt, prev, next) {
  return mergeAt(path, next, fun(...readCursors(cursors, next)))
}

/**
 * Watch
 */

pub.Watcher = Watcher
function Watcher (reader) {
  let paths
  return function watcher (_key, ref, prev, next) {
    if (!paths || cursorsChanged(paths, prev, next)) {
      const [result, paths_] = logArgs(bind(scan, next), reader, ref)
      paths = paths_
      return result
    }
  }
}
