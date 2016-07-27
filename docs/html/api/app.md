{% extend('api.html', {title: 'app'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`App`]({{url(path)}}/#-app-que-initialstate-reducers-computers-effects-)
  * [`app.prev`]({{url(path)}}/#-app-prev-)
  * [`app.mean`]({{url(path)}}/#-app-mean-)
  * [`app.addEffect`]({{url(path)}}/#-app-addeffect-fun-)
* [`enque`]({{url(path)}}/#-enque-events-)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/app.js" target="_blank">
`lib/app.js` <span class="fa fa-github"></span>
</a>

An `App` object serves as a scaffold for a purely functional application. It
maintains state, interacts with the impure world, and reacts to external
stimuli, spinning its inner pure-functional gears.

An `App` is a mutable reference to a linear timeline of immutable states. It
allows you to define most parts of the application as pure functions of data.

[TODO] explain the linear timeline.

## `App(que, initialState, reducers, computers, effects)`

Creates an application object.

  * `que` must be a [`Que`](api/que/) object
  * `initialState` is automatically converted into an immutable data structure
  * `reducers`, `computers` and `effects` must be lists of functions

```js
const {Que, App} = require('prax')

const que = Que()

const {state, reducers, computers, effects} = require('features/my-feature')

const app = App(que, state, reducers, computers, effects)

// Must manually connect app to event que.
que.consumer = app.main
```

Format:

```hs
que :: Que

initialState :: any

reducers :: [Reducer]

  where Reducer = ƒ(state, event) -> state

computers :: [Computer]

  where Computer = ƒ(prev state, next state) -> state

effects :: [Effect]

  where Effect = ƒ(prev state, next state, event, app) -> events
  where events :: any | [any] | Promise any | [Promise any] | void
```

### `app.prev`

Previous application state. Initially `undefined`.

```js
console.log(app.prev)
```

### `app.mean`

Current application state. The name `mean` refers to the fact that at any given
time, the app has up to three values of state:

`prev -> mean -> next`

The `next` state exists during the data phase: it's passed to reducers and
computers, and gets replaced by their return value. When the data phase ends,
the app substitutes its `mean` state for `next`.

```js
console.log(app.mean)
```

### `app.addEffect(fun)`

Registers a new effect and returns a function that de-registers it when called.

Effects are functions called at the last step of the main loop. They're intended
for side effects and asynchronous operations.

The primary purpose of this method is to dynamically subscribe and unsubscribe
views.

```js
function effect (prev, next, event, app) {
  // do some side effects
  // optionally return an event
  if (Date.now() % 2) return 'my-event'
}

const unsub = app.addEffect(effect)

// later
unsub()
```

## `enque(...events)`

The app receives events from an event que. When creating the app, you set its
`main` method as the que's event consumer.

```js
const {Que, App} = require('prax')

const que = Que()

const app = App(que)

que.consumer = app.main
```

Then you use `que.enque` to schedule events to be handled by the app. Events are
arbitrary JavaScript values. You decide on their format when writing reducers.

```js
const event0 = 'init'
const event1 = {type: 'ajax', key: 'user'}
que.enque(event0, event1)
```

If your development environment has HMR (hot module replacement), you should
create only one que and reuse it when re-creating the app. This ensures that
events from asynchronous activities, such as HTTP requests, are automatically
routed to the current app instance.

<!--: <div class="notes"> :-->

### Technical notes

The queue is synchronous. If you call `enque` when que/app is idle (at the top
of the stack in a JS task/microtask callback), it's guaranteed to finish before
control returns to the callsite.

The queue may appear asynchronous. If you call `enque` when que/app is busy
(inside an effect), it's guaranteed to delay the new events until the currently
pending events are processed.

<!--: </div> :-->
