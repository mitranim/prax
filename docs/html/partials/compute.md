## Compute

* [`compute`]({{url(path)}}/#-compute-path-cursors-formula-)
* [`computePatch`]({{url(path)}}/#-computepatch-path-cursors-formula-)

Utils for writing computers.

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

### `compute(path, cursors, formula)`

Creates a computer that manages the value at `path`, writing the result of
calling `formula` (a pure function) with the arguments defined by `cursors`.

This is like Excel: you choose a cell (`path`), pointers to data (`cursors`),
and a formula. It gets recalculated automatically on relevant changes.

```js
function sum (a, b) {
  return a + b
}

const x = compute(['sum'], [['one'], ['other']], sum)

x(null, {one: 1, other: 2})
// {one: 1, other: 2, sum: 3}
```

Each `cursor` may be a path or a function that reads a value from anywhere in
the state.

```js
const {scan} = require('prax')

function getRight (value) {
  return scan(value, 'right', 'nested')
}

function add (a, b) {return a + b}

const x = compute(['added'], [['left'], getRight], add)

x(null, {left: 1, right: {nested: 2}})
// {left: 1, right: {nested: 2}, added: 3}
```

Be careful about data size. Because `compute` runs on every change in `cursors`,
recalculating a large, frequently changing collection might cost too much CPU
time. In that case, you'll probably need a smarter function.

### `computePatch(path, cursors, formula)`

Like `compute`, but uses merge semantics instead of replacement semantics.
The formula may return patches (partial objects).

```js
function namePatch (value) {
  return {name: value}
}

const x = computePatch(['user'], [['test']], namePatch)

x(null, {test: 'test', user: {id: 1}})
// {test: 'test', user: {id: 1, name: 'test'}}

// Under `compute`, this would have returned:
// {test: 'test', user: {name: 'test'}}
```
