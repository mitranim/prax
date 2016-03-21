{% extend('api.html', {title: 'reduce'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`std`]({{url(path)}}/#-std-type-key-value-)
* [`match`]({{url(path)}}/#-match-pattern-func-)
* [`on`]({{url(path)}}/#-on-type-func-)
* [`one`]({{url(path)}}/#-one-type-func-)
* [`manage`]({{url(path)}}/#-manage-path-funcs-)
* [`manageNonStrict`]({{url(path)}}/#-managenonstrict-path-funcs-)
* [`passValue`]({{url(path)}}/#-passvalue-)

## Overview

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
App([match(...), on(...)], ...)
```

Examples also imply imports:

```js
import {...} from 'prax/reduce'
```

## `std(type, key, value)`

Shortcut to a common event format.

```js
std('one')                =  {type: 'one', key: undefined, value: undefined}
std('two', 2)             =  {type: 'two', key: 2, value: undefined}
std('three', 3, 'three')  =  {type: 'three', key: 3, value: 'three'}
```

## `match(pattern, func)`

Creates a reducer that acts only on events that match the provided pattern, via
[`toTest`](api/pattern/#-totest-pattern-).

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

The signature of `func` is not `(state, event)` but `(state, key, value)`. The
reducer extracts `key` and `value` from the event.

```js
function reducer (state, key, value) {
  return {...state, test: [key, value]}
}

const x = on('test', reducer)

x({}, std('blah'))
// {}

x({}, std('test', 'key', 'value'))
// {test: ['key', 'value']}
```

## `one(type, func)`

Creates a reducer that acts only on events with the given `type` and a `key`.
It manages an individual element under the `key` provided by each event.

The signature of `func` is not `(state, event)` but `(element, key, value)`,
where `element = state[key]`. The reducer extracts `key` and `value` from the
event and merges the result back into `state` under that key.

Due to merge semantics, the function may also return partial objects, patches.

```js
function passValue (state, key, value) {
  return value
}

const x = one('elem', passValue)

let state = x({}, std('elem'))
// {}

state = x(state, std('elem', 1, {title: 'first'}))
// {1: {title: 'first'}}

state = x(state, std('elem', 1, {time: 'now'}))
// {1: {title: 'first', time: 'now'}}

x(state, std('elem', 2, {title: 'second'}))
// {1: {title: 'first', time: 'now'}, 2: {title: 'second'}}
```

## `manage(path, ...funcs)`

Takes a property path (a list of keys) and any number of functions. Returns a
list of reducers created by mounting each function on `path`.

Each func has the normal reducer signature `(state, event)`, but manages only
the part of state located at the given path.

```js
function setAll (users, _, value) {
  return value
}

function setOne (user, key, value) {
  return value
}

const x = manage(['users'],
  on('users/set', setAll),
  one('user/set', setOne)
)

x({}, std('users/set', null, {1: {name: 'Mira'}}))
// {users: {1: {name: 'Mira'}}}

x({}, std('user/set', 1, {name: 'Mira'}))
// {users: {1: {name: 'Mira'}}}
```

## `manageNonStrict(path, ...funcs)`

Like `manage`, but with merge semantics rather than replacement semantics.
Reducers under `manageNonStrict` may return patches rather than complete
objects.

## `passValue`

Shortcut for a common operation under `on` and `one`: using the event value and
ignoring other arguments. Definition:

```js
function passValue (state, key, value) {
  return value
}
```

Useful in function composition contexts:

```js
import {pipe, mapKeys, it, mapValues} from 'prax/lang'

const x = on('flags', pipe(
  passValue,
  bind(mapKeys, it),
  bind(mapValues, () => true)
))

x({}, std('flags', null, [1, 2]))
// {1: true, 2: true}
```

## `update(func)`

Shortcut for a common operation under `on`: ignoring the key and using only the
state and event's value.

```js
function concat (list, value) {
  return list.concat(value)
}

const x = on('id', update(concat))

x([1, 2], std('id', null, 3))
// [1, 2, 3]
```

## `upgrade(func)`

Shortcut for a common operation under `one`: pre-merging the state and event's
value before passing the result to the reducer.

```js
function user (fields) {
  return {...fields, length: fields.name.length}
}

const x = on('user', upgrade(user))

x({id: 1, name: 'Mira'}, std('user', 1, {age: 1000}))
// {id: 1, name: 'Mira', age: 1000, length: 4}
```
