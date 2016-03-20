{% extend('api.html', {title: 'app'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`App`]({{url(path)}}/#-app-reducers-computers-effects-initialstate-)
  * [`App#enque`]({{url(path)}}/#-app-enque-events-)
  * [`App#addEffect`]({{url(path)}}/#-app-addeffect-func-)
  * [`App#getPrev`]({{url(path)}}/#-app-getprev-)
  * [`App#getMean`]({{url(path)}}/#-app-getmean-)
* [`EmitMono`]({{url(path)}}/#-emitmono-enque-)
* [`Emit`]({{url(path)}}/#-emit-enque-)

## Overview

A mutable `App` object serves as a scaffold for a purely functional application.
It maintains state, interacts with the impure world, and reacts to external
stimuli, spinning its inner pure-functional gears.

[TODO] explain the event queue.

## `App(reducers, computers, effects, initialState)`

Creates an application object.

All arguments are optional. The first three arguments (lists of functions) may
be deeply nested; the app flattens them automatically.

```js
import {App} from 'prax/app'

import {reducers, computers, effects, defaults} from 'features/my-feature'

const app = App(reducers, computers, effects, defaults)
```

Format:

```hs
reducers :: [Reducer]

  where Reducer = ƒ(state, event) -> state

computers :: [Computer]

  where Computer = ƒ(prev state, next state) -> state

effects :: [Effect]

  where Effect = ƒ(prev state, next state, event) -> events
  where events :: any | [any] | Promise any | [Promise any] | void

initialState :: any
```

### `App#enque(...events)`

Adds events to the app's internal event queue. They will be processed one by one
as soon as the app becomes idle.

Events are arbitrary JavaScript values. You decide on their format when writing
reducers.

```js
const event0 = 'init'
const event1 = {type: 'ajax', key: 'user'}
app.enque(event0, event1)
```

<!--: <div class="notes"> :-->

### Technical notes

The queue is synchronous. If you call `app.enque` when the app is idle (at the
top of the stack in a task or microtask callback), it's guaranteed to finish
before control returns to the callsite.

The queue is asynchronous. If you call `app.enque` when the app is busy (inside
an effect), it's guaranteed to delay the new events until the current queue
becomes empty.

The app is always idle when the queue is empty, and vice versa.

<!--: </div> :-->

### `App#addEffect(func)`

Registers a new effect and returns a function that de-registers it when called.

Effects are functions called at the last step of the main loop. They're intended
for side effects and asynchronous operations.

The primary purpose of this method is to dynamically subscribe and unsubscribe
views.

```js
function effect (prev, next, event) {
  // do some side effects
  // optionally return an event
  if (Date.now() % 2) return 'my-event'
}

const unsub = app.addEffect(effect)

// later
unsub()
```

### `App#getPrev()`

Returns the previous app state.

```js
const prevState = app.getPrev()
console.log(prevState)
```

### `App#getMean()`

Returns the current application state.

The name `mean` refers to the fact that at any given time, the app has up to
three values of state:

`prev -> mean -> next`

The `next` state exists during the data phase: it's passed to reducers and
computers, and gets replaced by their return value. When the data phase ends,
the app substitutes its `mean` state for `next`.

## `EmitMono(enque)`

Creates a "delayed" version of `app.enque` that passes arguments to a
user-supplied function and enqueues the result.

This allows to hide imperative invocations of `enque` behind pure functions that
return events.

```js
const emit = EmitMono(app.enque)

function clickEvent ({type, button}) {
  return {type, value: button}
}

// enqueues `{type: 'click', value: 0}` on each LMB click
document.addEventListener('click', emit(clickEvent))
```

## `Emit(enque)`

Similar to `EmitMono`, but accepts both functions and plain values.

```js
const emit = Emit(app.enque)

function down ({type, keyCode}) {
  return {type, value: keyCode}
}

const up = {type: 'keyup'}

// enqueues `{type: 'keydown', value: N}` on each keypress
document.addEventListener('keydown', emit(down))

// enqueues `{type: 'keyup'}` on each keypress
document.addEventListener('keyup', emit(up))
```
