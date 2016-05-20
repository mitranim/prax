{% extend('api.html', {title: 'compute'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`compute`]({{url(path)}}/#-compute-path-sources-formula-)
* [`computePatch`]({{url(path)}}/#-computepatch-path-sources-formula-)

## Overview

[TODO expound]:

* the compute phase defines application state as a pure function of itself
* it reruns recursively until the state doesn't change anymore

Base computer interface:

```js
function computer (prevState, nextState) {
  return nextState
}
```

This module provides abstractions over the base interface, letting you write
short, specialised computers. All of them are pure higher-order functions, so
you can design yours for your own needs.

Examples on this page show computers as standalone functions, but in an app, you
should group and pass them to the `App` constructor:

```js
const computers = [
  compute(...)
]

App([], computers)
```

Examples also imply imports:

```js
import {...} from 'prax/compute'
```

## `compute(path, sources, formula)`

Creates a computer that manages the value at `path`, writing the result of
calling `formula` (a pure function) with the arguments defined by `sources`.

This is like Excel: you choose a cell (`path`), source data (`sources`), and a
formula. It gets recalculated automatically on relevant changes.

```js
function sum (a, b) {
  return a + b
}

const x = compute(['sum'], [['one'], ['other']], sum)

x(null, {one: 1, other: 2})
// {one: 1, other: 2, sum: 3}
```

Each `source` may be a path (a list of keys), or a function. In the latter case,
it receives the value from the previous source and must return a path. This
allows to resolve paths dynamically.

```js
function other (path) {
  return ['other'].concat(path)
}

function sum (a, b) {
  return a + b
}

const x = compute(['sum'], [['one'], other], sum)

x(null, {one: 1, other: {1: 2}})
// {one: 1, other: {1: 2}, sum: 3}
```

Be careful about data size. Because `compute` runs on every change in `sources`,
recalculating a large, frequently changing collection will cost too much CPU
time. In this case, you'll probably need to write a different tool.

## `computePatch(path, sources, formula)`

Like `compute`, but uses merge semantics instead of replacement semantics.
The formula may return patches (partial objects).

```js
function patchName (value) {
  return {name: value}
}

const x = computePatch(['user'], [['test']], patchName)

x(null, {test: 'test', user: {id: 1}})
// {test: 'test', user: {id: 1, name: 'test'}}

// Under `compute`, this would have returned:
// {test: 'test', user: {name: 'test'}}
```
