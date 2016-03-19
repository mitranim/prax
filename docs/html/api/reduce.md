{% extend('api.html', {title: 'reduce'}) %}

## TOC

* [`when`]({{url(path)}}/#-when-predicate-effect-)

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
