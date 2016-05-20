{% extend('api.html', {title: 'reduce'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`st`]({{url(path)}}/#-st-type-value-)
* [`stk`]({{url(path)}}/#-stk-type-key-value-)
* [`match`]({{url(path)}}/#-match-pattern-func-)
* [`on`]({{url(path)}}/#-on-type-func-)
* [`one`]({{url(path)}}/#-one-type-func-)
* [`manage`]({{url(path)}}/#-manage-path-funcs-)
* [`managePatch`]({{url(path)}}/#-managepatch-path-funcs-)
* [`pass`]({{url(path)}}/#-pass-)
* [`upgrade`]({{url(path)}}/#-upgrade-func-)
* [`ifonly`]({{url(path)}}/#-ifonly-test-func-)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/reduce.js" target="_blank">
`lib/reduce.js` <span class="fa fa-github"></span>
</a>

Base reducer interface:

```js
function reducer (state, event) {
  return state
}
```

This module provides abstractions over the base interface, letting you write
short, specialised reducers. All of them are pure higher-order functions, so you
can design yours for your own needs.

Examples on this page show reducers as standalone functions, but in an app, you
should group and pass them to the `App` constructor:

```js
const reducers = [
  match(...),
  on(...)
]

App(reducers, ...)
```

Examples also imply imports:

```js
import {...} from 'prax/reduce'
```

## `st(type, value)`

Shortcut to a common event format. Short for **st**andard.

```js
st('one')     =  {type: 'one', value: undefined}
st('two', 2)  =  {type: 'two', value: 2}
```

## `stk(type, key, value)`

Shortcut to a common event format. Short for **st**andard **k**eyed.

```js
stk('one')                =  {type: 'one', key: undefined, value: undefined}
stk('two', 2)             =  {type: 'two', key: 2, value: undefined}
stk('three', 3, 'three')  =  {type: 'three', key: 3, value: 'three'}
```

## `match(pattern, func)`

Creates a reducer that acts only on events that match the provided pattern, via
[`pattern/test`](api/pattern/#-test-pattern-).

```js
function reducer (state, event) {
  return {...state, num: event.value}
}

// this:
match({type: 'num', key: isNumber}, reducer)

// is equivalent to:
function (state, event) {
  return isObject(event) && is(event.type, 'num') && isNumber(event.key)
    ? reducer(state, event)
    : state
}
```

## `on(type, func)`

Creates a reducer that acts only on events with the given `type`.

The signature of `func` is not `(state, event)` but `(state, value)`. The
reducer extracts `value` from the event.

```js
function reducer (state, value) {
  return {...state, test: value}
}

const x = on('test', reducer)

x({}, st('blah'))
// {}

x({}, st('test', 'value'))
// {test: 'value'}
```

## `one(type, func)`

Creates a reducer that acts only on events with the given `type` and a `key`.
It manages an individual element under the `key` provided by each event.

The signature of `func` is not `(state, event)` but `(element, value, key)`,
where `element = state[key]`. The reducer extracts `key` and `value` from the
event and merges the result back into `state` under that key.

Due to merge semantics, the function may also return partial objects, patches.

```js
function pass (state, value, key) {
  return value
}

const x = one('elem', pass)

let state = x({}, stk('elem'))
// {}

state = x(state, stk('elem', 1, {title: 'first'}))
// {1: {title: 'first'}}

state = x(state, stk('elem', 1, {time: 'now'}))
// {1: {title: 'first', time: 'now'}}

x(state, stk('elem', 2, {title: 'second'}))
// {1: {title: 'first', time: 'now'}, 2: {title: 'second'}}
```

## `manage(path, ...funcs)`

Takes a property path (a list of keys) and any number of functions. Returns a
list of reducers created by mounting each function on `path`.

Each func has the normal reducer signature `(state, event)`, but manages only
the part of state located at the given path.

```js
// equivalent to `pass` (see below)
function setAll (users, value) {
  return value
}

// equivalent to `pass` (see below)
function setOne (user, value, key) {
  return value
}

const x = manage(['users'],
  on('users/set', setAll),
  one('user/set', setOne)
)

x({}, st('users/set', {1: {name: 'Mira'}}))
// {users: {1: {name: 'Mira'}}}

x({}, stk('user/set', 1, {name: 'Mira'}))
// {users: {1: {name: 'Mira'}}}
```

## `managePatch(path, ...funcs)`

Like `manage`, but with merge semantics rather than replacement semantics.
Reducers under `managePatch` may return patches rather than complete
objects.

[TODO] examples.

## `pass`

Shortcut for a common operation under `on` and `one`: using the event value and
ignoring other arguments. Definition:

```js
function pass (state, value) {
  return value
}
```

Useful when the reducer ignores the pre-existing state:

```js
const x = on('data', pass)

x({value: 'initial data'}, st('data', 100))
// 100
```

## `upgrade(func)`

Shortcut for a common operation under `one`: pre-merging the state and event's
value before passing the result to the reducer.

```js
function user (fields) {
  return {...fields, length: fields.name.length}
}

const x = on('user', upgrade(user))

x({id: 1, name: 'Mira'}, stk('user', 1, {age: 1000}))
// {id: 1, name: 'Mira', age: 1000, length: 4}
```

## `ifonly(test, func)`

Returns a function that uses `func` to produce the result if `test` passes. If
`test` fails, returns its first argument (in reducer context, this means
existing state). `test` must be a function, and is called with the same
arguments as `func`.

```js
function pos (state, _value) {
  return state > 0
}

function dec (state, _value) {
  return state - 1
}

const x = on('dec', ifonly(pos, dec))

x(-1, st('dec'))
// -1

x(2, st('dec'))
// 1
```
