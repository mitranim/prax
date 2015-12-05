## Installation

Prerequisites:
* <a href="https://www.npmjs.com" target="_blank">`npm`</a>
* module-friendly build system (browserify, Webpack, SystemJS)

```sh
npm i --save-dev prax
```

## Atom

Create an _atom_. It's an object that contains the entire application state.

```javascript
import {createAtom} from 'prax'

const initialState = {
  one: {two: 2}
}

const atom = createAtom(initialState)

// Atom API
const {read, write, watch, stop} = atom
```

Just for fun, you can watch the atom for changes:

```javascript
function watcher (read) {
  console.log(read('one', 'two'))
}

watch(watcher)

atom.write({one: {two: 'two'}})  // watcher prints 'two'

stop(watcher)
```



We want to prevent accidental data mutation. We also want to update atom state
in a way that retains old references of unchanged objects, so we can compare
them with `===`.

Prax has utilities just for that:

```javascript
import {replaceAtPath, mergeAtPath} from 'prax'

function writer (message) {
  if (message.type === 'set') {
    const state = replaceAtPath(atom.read(), message.value, message.path)
    atom.write(state)
  } else if (message.type === 'patch') {
    const state = mergeAtPath(atom.read(), message.value, message.path)
    atom.write(state)
  }
}
```

These functions are [immutability helpers](api/immutability/). They take a data
tree and a patch to apply to that tree, and return a new version of the tree
after applying the patch. The new structure is immutable and retains the
original references of all unchanged objects.
