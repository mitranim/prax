## Paths

* [`readSources`]({{url(path)}}/#-readsources-sources-value-)
* [`pathsChanged`]({{url(path)}}/#-pathschanged-paths-prev-next-)
* [`changed`]({{url(path)}}/#-changed-)
* [`pan`]({{url(path)}}/#-pan-sources-fun-)
* [`give`]({{url(path)}}/#-give-sources-fun-)

Utils for:
* resolving paths into values
* change detection

### `readSources(sources, value)`

Takes a list of sources, which may be paths or functions, and maps them against
`value`, returning the list of results.

Sources can be paths:

```js
const sources = [['a'], ['b', 'c']]

const value = {a: 'shallow', {b: {c: 'nested'}}}

readSources(sources, value)
// ['shallow', 'nested']
```

They can also be functions. A function source is called with the result of the
previous source.

```js
const sources = [['a'], key => ['b', key]]

const value = {a: 'c', {b: {c: 'nested'}}}

readSources(sources, value)
// ['c', 'nested']
```

### `pathsChanged(paths, prev, next)`

True if any path among `paths` is different between `prev` and `next`.

Uses
<a href="http://mitranim.com/fpx/#-is-one-other-" target="_blank">`fpx/is`</a>
for equality (basically `===`). With referential equality guarantees provided by
<a href="https://github.com/Mitranim/emerge" target="_blank">Emerge</a>,
this enables extremely efficient change detection.

```js
// https://github.com/Mitranim/emerge#putatpath-prev-value
const {putAt, pathsChanged} = require('prax')

const paths = [['one', 'two']]

const prev = {one: {two: [2]}}

// Keeps the old references because the value is unchanged
// next === prev  ->  true
const next = putAt(['one', 'two'], prev, [2])

pathsChanged(paths, prev, next)
// false

const next0 = putAt(['one', 'two'], prev, [3])

pathsChanged(paths, prev, next)
// true
```

### `changed`

<a href="http://mitranim.com/fpx/#-defer-fun-args-" target="_blank">Deferred</a>
version of `pathsChanged`. Useful in function composition contexts.

```js
const one = ['one']
const three = ['two', 'three']

const x = changed([one, three])

x({}, {})
// false

x({}, {one: 1})
// true
```

### `pan(sources, fun)`

Creates a function that resolves `sources` against a value, passing results
to `fun` as separate arguments. Useful in function composition contexts.

```js
function plus (a, b) {return a + b}

const sources = [['one'], ['two', 'three']]

const report = pan(sources, plus)

report({one: 1, two: {three: 3}})
// 3
```

### `give(sources, fun)`

Like `pan` but ignores its first argument, resolving values against the _second_
argument. Useful when composing effects.

```js
function plus (a, b) {return a + b}

const sources = [['one'], ['two', 'three']]

const report = give(sources, plus)

report(null, {one: 1, two: {three: 3}})
// 3
```
