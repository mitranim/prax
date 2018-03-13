## Overview

Prax depends on 3 other libraries: `espo`, `emerge`, and `fpx`. They have their own documentation (see below). They're _peer dependencies_ and must be installed explicitly. Prax combines them to create a React adapter that enables implicit reactivity and global update scheduling. It also adds a few minor utilities.

Installation:

```sh
npm i -E prax espo emerge fpx
```

Prax is heavily inspired by [`clojure.core`](https://clojuredocs.org/core-library) and [Clojure's philosophy](https://github.com/matthiasn/talk-transcripts/blob/master/Hickey_Rich/AreWeThereYet.md). The React layer is heavily inspired by [Reagent](http://reagent-project.github.io). If you're familiar with them, you should feel right at home.

On this page, the entire library is available as `window.prax`. In addition, `React` and `ReactDOM` are available as globals. You can run most examples in the browser console.

---

## `PraxComponent`

`extends React.Component`

Base class for your React components. Automatically subscribes to observable
references such as
[`espo.Atom`](https://mitranim.com/espo/#-atom-value-) accessed during rendering.
It's a thin adapter between React components and
[`espo.Reaction`](https://mitranim.com/espo/#-reaction-), a general-purpose
tool for procedural reactivity.

```js
const React = require('react')
const {render} = require('react-dom')
const {PraxComponent, byPath} = require('prax')
const {Atom} = require('espo') // transitive dependency
const {putIn} = require('emerge') // transitive dependency

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
const {PraxComponent, byPath} = require('prax')
const {Atom} = require('espo') // transitive dependency

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

### `praxComponent.shouldComponentUpdate()`

`shouldComponentUpdate` is a standard lifecycle method of React components that
allows to reject unnecessary updates. An optimal `shouldComponentUpdate`
strategy is crucial for performance. Many developers ignore it, producing slow
apps and giving React a bad reputation.

`PraxComponent` implements a `shouldComponentUpdate` that deeply compares props
and state via [`reactEqual`](#-reactequal-left-right-). Prax components tend to
receive data from external observables, have shallow props aside from
`children`, and little to no state. Deep equality of props and state is
typically far cheaper than the redundant renders it prevents.

**Note**: when defining and passing functions inline, you create a new reference
every time, completely negating this optimisation. Make sure to prebind methods
in component constructor:

```js
class View extends PraxComponent {
  constructor() {
    super(...arguments)
    this.onAction = this.onAction.bind(this)
  }

  subrender() {
    // Fixed function reference makes equality check possible
    return <AnotherView onAction={this.onAction} />
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
  return Xhttp(params, response => {
    // Pauses updates of Prax view components
    RenderQue.global.dam()
    try {
      // Suppose this triggers redundant renders
      fun(response)
    }
    finally {
      // Resumes updates
      RenderQue.global.flush()
    }
  })
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
const {PraxComponent, byPath} = require('prax')
const {Atom} = require('espo') // transitive dependency
const {putIn} = require('emerge') // transitive dependency

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
const {PraxComponent, byPath} = require('prax')
const {Atom} = require('espo') // transitive dependency

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
const {PraxComponent, computation} = require('prax')
const {Atom} = require('espo') // transitive dependency

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

## `reactEqual(left, right)`

Deep equality with a few safety rules for React elements. Used internally by
[`praxComponent.shouldComponentUpdate`](#-praxcomponent-shouldcomponentupdate-).

Defined in terms of [`emerge.equalBy`](https://github.com/Mitranim/emerge#equalbytest-one-other)

```js
const {reactEqual} = require('react')

reactEqual(prevProps, nextProps)

reactEqual(prevState, nextState)
```

---

## Espo

Library for reactive and stateful programming: observables, implicit reactivity, automatic resource cleanup. Provides Prax's core mechanisms: observable [`atoms`](https://mitranim.com/espo/#-atom-value-) and implicit subscriptions via [`Reaction`](https://mitranim.com/espo/#-reaction-).

Docs: https://mitranim.com/espo/

## Emerge

Library for using plain JS data as immutable, functional data structures. Lightweight alternative to ImmutableJS. Heavily inspired by data functions in [`clojure.core`](https://clojuredocs.org/core-library).

Docs: https://github.com/Mitranim/emerge

## fpx

Functional programming utils. Lightweight alternative to Lodash.

Docs: https://mitranim.com/fpx/
