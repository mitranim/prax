## Effects

* [`when`]({{url(path)}}/#-when-predicate-effect-)
* [TODO] `where`
* [TODO] `whenOneOf`
* [TODO] `match`
* [TODO] Recipes with `and+changed+give`

Utils for writing effects.

Base effect interface:

```js
function effect (prev, mean, event) {
  // run side effects
  // return event(s)
}
```

This module provides abstractions over the base interface, letting you write
short, specialised effects. Most of them are pure higher-order functions, so you
can design yours for your own needs.

These utils focus mostly on _data events_: responding to changes in the
application state rather than events.

Examples on this page show effects as standalone functions, but in an app, you
should group and pass them to the `App` constructor:

```js
App(Que(), [], [], [when(...)])
```

### `when(predicate, effect)`

Format:

```js
predicate(read)  ->  result
effect(result)   ->  event | [event] | void
```

Examples:

```js
function userId (read) {
  return read('user', 'id')
}

function loadMessages (userId) {
  return ajax(/* ... */).then(data => st('msg', data))
}

when(userId, loadMessages)
```
