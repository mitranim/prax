{% extend('api.html', {title: 'effects'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`when`]({{url(path)}}/#-when-predicate-effect-)

## Overview

Base effect interface:

```js
function effect (prev, mean, event) {
  // run side effects
  // return event(s)
}
```

This module provides abstractions over the base interface, letting you write
short, specialised effects. All of them are pure higher-order functions, so you
can design yours for your own needs.

These utils focus mostly on _data events_: the idea that you should act not on
inbound events themselves, but on changes in the application state.

Examples on this page show effects as standalone functions, but in an app, you
should group and pass them to the `App` constructor:

```js
App([], [], [when(...)])
```

Examples also imply imports:

```js
import {...} from 'prax/effects'
```

## `when(predicate, effect)`

Format:

```js
predicate(read)  ->  result
effect(result)   ->  event | [event] | void
```

Examples:

```js
import {st} from 'prax/reduce'

function userId (read) {
  return read('user', 'id')
}

function loadMessages (userId) {
  return ajax(/* ... */).then(data => st('msg', data))
}

when(userId, loadMessages)
```
