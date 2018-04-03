## Overview

Prax is a framework of time and state for React applications. It's heavily
inspired by Clojure and ClojureScript libraries, particularly Reagent, and has
been battle-tested in large apps since 2015. In terms of popular JS libraries,
Prax's role in your app can be roughly described as: Redux with addons +
ImmutableJS + RxJS + Rust-style runtime for deterministic object destructors.

Another, simplistic, way to describe Prax: it's like React for _everything_, not
just for views.

Prax is not buzz-driven, not particularly functional, object-oriented,
event-based, or FRP-centric. It builds on solid ideas carefully pilfered from
multiple languages and frameworks, it tries hard to be general and not
over-abstract, and it attacks real, hard problems.

Dive into the [API Reference](api) and [examples](examples). Read forth for the
[motivation](#problems-and-solutions) and [big ideas](#big-ideas) behind Prax.

## Problems and Solutions

Problem: reactive UI and event-driven logic requires subscriptions and
unsubscriptions. This is equivalent to manual memory management, and we
shouldn't have to do it.

* Non-solution: manual subscriptions; humans can't be trusted with cleanup.
Another non-solution: specialized "declarative" APIs like `react-redux`. They
tend to be specialized for one purpose. We can do better.

* Prax solution: reactivity driven by _procedural_ data access. See
[`PraxComponent`](api#-praxcomponent-) for a UI example,
[Reactive Logic](examples#reactive-logic) for a side effect example, and
[Reactive Computations](examples#reactive-computations) for a data example.

Problem: unused resources should automatically deinitialize. I call this
[demand-driven design](misc#_demand-driven_). When nobody's looking, you should
evict data from cache, abort requests, close websockets, etc., and it should be
part of your reactivity model. This is crucial for a subscription-based API such
as Firebase.

* Non-solution: using only immutable data and pure functions. Many
[resources](misc#_resource_) are inherently mutable, you can't pretend that
you're only dealing with data; pure functions can't track subscribers.

* Prax solution: lazy resources that init/deinit on demand; see
[example](examples#demand-driven-resources). Define multiple resources that
manage the lifecycle of immutable data.

Problem: coordinating async activities that depend on multiple conditions.
Example: loading user profile when authorized, evicting it when deauthorized,
and reloading it if the user has changed. It's even harder to write asynchronous
code that may start an activity, then _restart_ or _change_ it when the
conditions change.

* Non-solution: ignoring the problem. It leads to nasty race conditions such as
trying to load private data before authorising the user. Another non-solution:
using promises or any inherently asynchronous abstraction. It leads to UI jank.

* Prax solution: expressing logic and side effects as reactive definitions. See
[Reactive Logic](examples#reactive-logic).

## Big Ideas

[Implicit reactivity](api#-praxcomponent-) driven by procedural data access.

[Demand-driven resources](examples#demand-driven-resources), friendly to lazy
init/deinit and cache eviction.

[Reactive logic](examples#reactive-logic), defining side effects as a function
of state.

Combine the strengths of FP and OOP. Store your data in immutable, functional
data types, manipulating it with [generic functions](api#emerge). Conduct the
_flow_ of data and side effects with OO tools such as
[lazy observables](examples#demand-driven-resources) and
[event streams](examples#event-system), or the novel tools offered by Prax.

Centralize your resources and data into a hierarchy of ownership, starting with
a root object. Make the root available everywhere in the app. This avoids the
need for over-designed props, dependency injection, etc.

## Inspiration

* Clojure, `clojure.core`: functional data structures, atoms
* Redux: centralization
* Reagent, Re-frame: implicit reactivity
* Redux, Re-frame: global event broadcast
* Erlang: pattern matching
* Haskell: higher order functions
* Rust: ownership and lifetimes
