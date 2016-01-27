'use strict'

const freeze = Object.freeze

exports.fromValue = fromValue
function fromValue (value) {
  return freeze({
    prev: value,
    mean: value,
    subs: freeze([])
  })
}

exports.swapValue = swapValue
function swapValue (atom, next) {
  return freeze({
    prev: atom.mean,
    mean: next,
    subs: atom.subs
  })
}

exports.subscribe = subscribe
function subscribe (atom, func) {
  return freeze({
    prev: atom.prev,
    mean: atom.mean,
    subs: freeze(atom.subs.concat(func))
  })
}

exports.unsubscribe = unsubscribe
function unsubscribe (atom, func) {
  return freeze({
    prev: atom.prev,
    mean: atom.mean,
    subs: without(atom.subs, func)
  })
}

// Misc

function without (list, value) {
  return withoutIndex(list, list.indexOf(value))
}

function withoutIndex (list, index) {
  return !~index ? list : list.slice(0, index).concat(list.slice(index + 1))
}
