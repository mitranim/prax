## Watch

* [`Watcher`]({{url(path)}}/#-watcher-fun-)

Utils for detecting changes in the data tree.

Prax lets you "watch" the application state, detecting changes with extreme
efficiency. Factors that make it possible:

* The state is an immutable value. On any change, we recreate the entire tree.
* We treat the state as a _persistent_ data structure with _structural sharing_.
  Adjacent versions share as many references as possible. This enables change
  detection via `!==`, where pointer unequality guarantees change.
  (See the <a href="https://github.com/Mitranim/emerge" target="_blank">Emerge</a> library.)
* On each state transition, _both_ versions of the state (`prev`/`next`) are
provided to subscribers.

## `Watcher(fun)`

Most subscription systems are coarse-grained: they force you to manually
subscribe to different objects or events types, or write filtering functions for
streams. In other words, they require metadata. This produces boring boilerplate
code.

`Watcher` allows you to create extremely precise, fine-grained subscriptions
expressed as functions, without any explicit metadata.

It uses active observation: when a function uses the provided data source, the
watcher remembers its interests and uses this knowledge to filter updates.

Takes a function with the following signature:

```js
function reader (read) {
  // read the data at the given path
  console.log(read('some', 'path'))
}
```

Wraps it into a watcher, returning a function with the compute/effect signature:

```js
function watcher (prev, next) {
  // may or may not call the reader
}
```

Basic example:

```js
// Implicitly subscribes to the path ['one', 'two']
function reader (read) {
  console.log(read('one', 'two'))
}

const watcher = Watcher(reader)

watcher(undefined, {one: {two: 2}})
// prints 2

watcher({one: {two: 2}}, {one: {two: 2, three: 3}})
// no change at watched path -> no effect

watcher({one: {two: 2}}, {one: {two: 'two'}})
// change at watched path -> print 'two'
```
