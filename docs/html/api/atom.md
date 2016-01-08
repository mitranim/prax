{% extend('index.html', {title: 'atom'}) %}

## Overview

An _atom_ is the place for all changing data in a Prax application. It's
basically a mutable reference that you can read, write, and watch for changes at
individual paths.

This should look familiar if you ever used Clojure. This is basically the same
thing as Clojure atoms, minus the atomic transactions (doesn't apply in JS).

## Lifecycle

    create ->
      [... read] [... watch]
      [write  ->  find changes  ->  run watchers]
      ...

## API

### `createAtom`

```javascript
import {createAtom} from 'prax'

const exampleState = {
  one: {two: 2},
  three: 3
}

const atom = createAtom(exampleState)

// Methods are detachable
const {read, write, watch, stop} = atom
```

### `read(...path)`

Reads data on the given path.

```javascript
console.log(read('one', 'two'))  // 2
```

If this is called inside `watch`, the function is considered to be watching
this path, and will rerun when this value changes.

### `write(newState)`

Replaces the atom's value.

```javascript
write({one: {two: {three: 3}}})

console.log(read())  // {one: {two: {three: 3}}}
```

`write` triggers watchers.

### `watch(watcherFunc)`

Takes a function and runs it once. Calling `read` inside `watch` tells the atom
which paths to watch. The watcher is rerun on changes to any of those paths.

```javascript
function watcher (read) {
  console.log(read('one', 'two'))
}

watch(watcher)  // logs {three: 3}
                // returns watcher

write({one: {two: 2}})  // logs 2
```

### `stop(watcherFunc)`

Stops the given watcher.

```javascript
stop(watcher)
```

## Immutability

You're expected to treat application data as immutable, in the sense that it's
updated by replacement rather than by in-place mutation. Atom change detection
works by comparing watched values in last and current tree. When there's a
change, you must `write` a new data structure. Prax provides a few
[functions](immutability/) to make deep updates trivial.
