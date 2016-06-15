## Paths

* [`readCursors`]({{url(path)}}/#-readcursors-cursors-value-)
* [`cursorsChanged`]({{url(path)}}/#-cursorschanged-cursors-prev-next-)
* [`changed`]({{url(path)}}/#-changed-)
* [`pan`]({{url(path)}}/#-pan-cursors-fun-)
* [`give`]({{url(path)}}/#-give-cursors-fun-)

Utils for:
* resolving paths and functions into values
* change detection

### `readCursors(cursors, value)`

Takes a list of cursors, which may be paths or functions, and maps them against
`value`, returning the list of results.

Cursors can be paths:

```js
const cursors = [['a'], ['b', 'c']]

const value = {a: 'shallow', {b: {c: 'nested'}}}

readCursors(cursors, value)
// ['shallow', 'nested']
```

They can also be functions.

```js
const {scan} = require('prax')

const cursors = [['a'], value => scan(value, 'b', 'c')]

const value = {a: 'c', {b: {c: 'nested'}}}

readCursors(cursors, value)
// ['c', 'nested']
```

### `cursorsChanged(cursors, prev, next)`

True if `prev` and `next` differ for any cursor among `cursors`.

Uses
<a href="http://mitranim.com/fpx/#-is-one-other-" target="_blank">`fpx/is`</a>
for equality (basically `===`). With referential equality guarantees provided by
<a href="https://github.com/Mitranim/emerge" target="_blank">Emerge</a>,
this enables extremely efficient change detection.

```js
// https://github.com/Mitranim/emerge#putatpath-prev-value
const {putAt, cursorsChanged} = require('prax')

const cursors = [['one', 'two']]

const prev = {one: {two: [2]}}

// Keeps the old references because the value is unchanged
// next === prev  ->  true
const next = putAt(['one', 'two'], prev, [2])

cursorsChanged(cursors, prev, next)
// false

const next0 = putAt(['one', 'two'], prev, [3])

cursorsChanged(cursors, prev, next)
// true
```

### `changed`

<a href="http://mitranim.com/fpx/#-defer-fun-args-" target="_blank">Deferred</a>
version of `cursorsChanged`. Useful in function composition contexts.

```js
const one = ['one']
const three = ['two', 'three']

const x = changed([one, three])

x({}, {})
// false

x({}, {one: 1})
// true
```

### `pan(cursors, fun)`

Creates a function that resolves `cursors` against a value, passing results
to `fun` as separate arguments. Useful in function composition contexts.

```js
function plus (a, b) {return a + b}

const cursors = [['one'], ['two', 'three']]

const report = pan(cursors, plus)

report({one: 1, two: {three: 3}})
// 3
```

### `give(cursors, fun)`

Like `pan` but ignores its first argument, resolving values against the _second_
argument. Useful when composing effects.

```js
function plus (a, b) {return a + b}

const cursors = [['one'], ['two', 'three']]

const report = give(cursors, plus)

report(null, {one: 1, two: {three: 3}})
// 3
```
