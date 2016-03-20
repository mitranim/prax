{% extend('api.html', {title: 'effects'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`when`]({{url(path)}}/#-when-predicate-effect-)

## Overview

The app invokes all effects on each tick of its main loop. At the most basic
level, each effect is a function of three arguments:

```javascript
function effect (prevState, meanState, event) {
  // perform side effects
  // return event(s)
}
```

## `when(predicate, effect)`

Format:

```javascript
predicate(read)  ->  result
effect(result)   ->  event | [event] | void
```

Examples:

```javascript
import {when} from 'prax/reduce'

export default [
  when(
    read => read('somewhere', 'myData'),
    myData => {
      // ... side effects
      // optional
      return someEvent
    }
  ),

  // Build abstractions for better readability.
  when(
    isLoggedIn,
    loadProfile
  )
]

function isLoggedIn (read) {
  return read('...')
}

function loadProfile (loggedIn) {
  return ajax(...)
}
```
