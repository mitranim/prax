## Overview

Prax is an umbrella for 3 other libraries: `espo`, `emerge`, and `fpx`. They
have their own documentation (see below). Prax re-exports everything under one
namespace, adding a React adapter and a few minor utilities.

Prax is heavily inspired by [`clojure.core`](https://clojuredocs.org/core-library)
and
[Clojure's philosophy](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/AreWeThereYet.md).
The React layer is heavily inspired by [Reagent](http://reagent-project.github.io).
If you're familiar with them, you should feel right at home.

On this page, the entire library is available as `window.prax`. You can run
non-React examples in the console.

---

## `PraxComponent`

`extends React.PureComponent`

Base class for your React components. Automatically subscribes to observable
references such as
[`espo.Atom`](https://mitranim.com/espo/#-atom-value-) accessed during rendering.
It's a thin adapter between React components and
[`espo.Reaction`](https://mitranim.com/espo/#-reaction-), a general-purpose
tool for procedural reactivity.

```js
const React = require('react')
const {render} = require('react-dom')
const {Atom, PraxComponent, byPath, putIn} = require('prax')

// Observable reference acting as central data store
const store = new Atom({message: {greeting: 'Hello', name: 'world'}})

// Custom React component with implicit reactivity
class View extends PraxComponent {
  subrender ({deref}) {
    // Get data AND automatically subscribe
    const greeting = deref(byPath(store, ['message', 'greeting']))
    const name = deref(byPath(store, ['message', 'name']))

    return (
      <div>
        <input
          value={name || ''}
          onChange={({target: {value}}) => {
            store.swap(putIn, ['message', 'name'], value)
          }} />
        <span> Message: {greeting} {name}!</span>
      </div>
    )
  }
}

render(<View />, document.getElementById('root'))
```

### `praxComponent.subrender(reaction)`

In Prax components, you must define `subrender` instead of `render`.

Receives the instance of
[`espo.Reaction`](https://mitranim.com/espo/#-reaction-)
associated with this component instance. Use `reaction.deref()` to pull data
from observable refs and automatically subscribe.

```js
const {Atom, PraxComponent, byPath} = require('prax')

const store = new Atom({msg: 'Hello world!'})

class View extends PraxComponent {
  subrender ({deref}) {
    // Subscribes to entire store
    const _msg = deref(store)
    // Subscribes only to msg
    const msg = deref(byPath(store, ['msg']))

    return <div>{msg}</div>
  }
}
```

### `praxComponent.setup(props, state)`

Helps avoid the common mistake of defining props-dependent state in
`componentWillMount` but not in `componentWillReceiveProps`. Usually you need to
define both, but forget.

If `setup` is defined, it's called on the initial setup and later on each
meaningful props change. In technical terms, it's called on `componentWillMount`
and later on each `componentWillReceiveProps` if `shouldComponentUpdate` returns
`true`.

```js
const {PraxComponent} = require('prax')

class Greeting extends PraxComponent {
  subrender () {
    return <div>{this.state.msg}</div>
  }

  // If props change, state will correctly match them
  setup (props, _state) {
    this.setState({msg: `Hello ${props.name}!`})
  }
}
```

### `praxComponent.shouldComponentUpdate()`

`shouldComponentUpdate` is a standard lifecycle method of React components that
allows to reject unnecessary updates. An optimal `shouldComponentUpdate`
strategy is crucial for performance. Many developers ignore it, producing slow
apps and giving React a bad reputation.

`PraxComponent` implements a `shouldComponentUpdate` that deeply compares props
and state via
[`emerge.equal`](https://github.com/Mitranim/emerge#equalone-other). Prax
components tend to receive data from external observables, have shallow props,
and little to no state. Deep equality of props and state is typically far
cheaper than the redundant renders it prevents.

**Note**: when defining or binding functions inline, you pass a new reference
every time, completely negating this optimisation. For maximum performance, you
should prebind view methods, or use this more aggressive version of
`shouldComponentUpdate` that compares _all functions_ as equal:

```js
const {pseudoEqual} = require('prax')

class ParanoidComponent extends PraxComponent {
  shouldComponentUpdate (props, state) {
    // Will count all functions as "equal" and reject even more updates
    return !pseudoEqual(props, this.props) || !pseudoEqual(state, this.state)
  }
}
```

---

## `RenderQue`

Utility for scheduling React component updates. Lets you globally pause view
updates and later resume them in batch. This is useful when running a state
update that could trigger multiple render phases, leading to redundant work.

All `PraxComponent` instances schedule their updates through the
`RenderQue.global` singleton, which you can use to control their updates.

React already uses pausing and batching internally, but only for DOM event
listeners that it controls. `RenderQue` lets you deploy this optimisation
anywhere. The most common use case is a network callback. Example:

```js
const {RenderQue} = require('prax')
const {Xhttp} = require('xhttp')

function httpRequest (params, fun) {
  return Xhttp(params)
    .onDone(result => {
      // Pauses updates of Prax view components
      RenderQue.globalRenderQue.dam()
      try {
        // Suppose this triggers redundant renders
        fun(result)
      }
      finally {
        // Resumes updates
        RenderQue.globalRenderQue.flush()
      }
    })
    .start()
}
```

### `RenderQue.global`

Global singleton used by `PraxComponent` instances to schedule their updates.

### `renderQue.dam()`

Pauses the que. See usage example above.

### `renderQue.flush()`

Resumes the que, running any pending view updates. See usage example above.

---

## `byQuery(observableRef, query)`

`where query: ƒ(any): any`

Creates an observable that derives its value from `observableRef` by applying
`query` to it. Can be used in views or reactions.

```js
const {Atom, PraxComponent, byPath, putIn} = require('prax')

const atom = new Atom({msg: 'Hello', name: 'world'})

const greeting = byQuery(atom, ({msg, name}) => `${msg} ${name}!`)

const sub = greeting.subscribe(greeting => {
  console.info('greeting:', greeting.deref())
})

atom.swap(putIn, ['name'], 'sunshine')
// greeting: Hello sunshine!

// When you're done
sub.deinit()

class MyView extends PraxComponent {
  subrender({deref}) {
    return <div>{deref(greeting)}</div>
  }
}
```

Shortcut to
[`espo.Query`](https://mitranim.com/espo/#-query-observableref-path-equal-)
with [`emerge.equal`](https://github.com/Mitranim/emerge#equalone-other).

In RxJS terms, `byQuery(observableRef, query)` is equivalent to:

```js
const {equal} = require('emerge')
observable.map(query).distinctUntilChanged(equal)
```

---

## `byPath(observableRef, path)`

Creates an observable that derives its value by reading it from `observableRef`
at `path`.

```js
const {Atom, PraxComponent, byPath} = require('prax')

const atom = new Atom({msg: {greeting: 'Hello world!'}})

const greeting = byPath(atom, ['msg', 'greeting'])

const sub = greeting.subscribe(greeting => {
  console.info('greeting:', greeting.deref())
})

// When you're done
sub.deinit()
```

Shortcut to
[`espo.PathQuery`](https://mitranim.com/espo/#-pathquery-observableref-path-equal-)
with [`emerge.equal`](https://github.com/Mitranim/emerge#equalone-other).

---

## `computation(def)`

`where def: ƒ(reaction)`

Creates an _observable computation_ from the provided definition, using the same
procedural reactivity as [`PraxComponent`](#-praxcomponent-). Lazy: doesn't
update when it has no subscribers. Can be used in views or reactions.

See [Reactive Computations](examples#reactive-computations) for another example.

```js
const {Atom, PraxComponent, computation} = require('prax')

const greeting = new Atom('Hello')
const name = new Atom('world')

const msg = computation(({deref}) => {
  return `${deref(greeting)} ${deref(name)}!`
})

const sub = msg.subscribe(msg => {
  console.info('msg:', msg.deref())
})
// msg: Hello world!

name.reset('sunshine')
// msg: Hello sunshine!

// When you're done
sub.deinit()

class View extends PraxComponent {
  subrender ({deref}) {
    return <div>{deref(msg)}</div>
  }
}
```

Shortcut to
[`espo.Computation`](https://mitranim.com/espo/#-computation-def-equal-)
with [`emerge.equal`](https://github.com/Mitranim/emerge#equalone-other).

---

## `on(argPattern, fun)`

Pattern-matching utility for [event systems](examples#event-system). Creates
a function that tests its arguments against the pattern and runs `fun` if the
pattern matches.

Pattern matching is done by [`fpx.test`](https://mitranim.com/fpx/#-test-pattern-).

```js
const {on} = require('prax')

const listener = on(
  // 1st arg pattern     2nd arg pattern
  [{type: 'greeting'}, {message: isString} /* , ... more patterns */],
  ({type}, {message}) => {
    console.info(message)
    return true
  }
)

listener()
// no match

listener('greeting', 'message')
// no match, returns 'greeting'

listener({type: 'goodbye'}, {message: 'Farewell world!'})
// no match, returns {type: 'goodbye'}

listener({type: 'greeting'}, {message: 'Hello world!'})
// prints 'Hello world!', returns true
```

---

## Espo

General-purpose tools for observables, subscriptions, broadcasts. Lightweight
alternative to RxJS. Provides the core mechanisms Prax is built on: observable
refs such as [`Atom`](https://mitranim.com/espo/#-atom-value-), implicit
subscriptions via [`Reaction`](https://mitranim.com/espo/#-reaction-),
and an [event system](examples#event-system) via
[`MessageQue`](https://mitranim.com/espo/#-messageque-).

Docs: https://mitranim.com/espo/

## Emerge

Library for using plain JS data as immutable, functional data
structures. Lightweight alternative to ImmutableJS. Heavily influenced by
[Clojure's philosophy](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/AreWeThereYet.md)
and [`clojure.core`](https://clojuredocs.org/core-library).

Docs: https://github.com/Mitranim/emerge

## fpx

Functional programming utils. Lightweight alternative to Lodash with a richer
higher-order function toolkit.

Docs: https://mitranim.com/fpx/
