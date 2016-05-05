{% extend('api.html', {title: 'pattern'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`test`]({{url(path)}}/#-test-pattern-)
* [`mask`]({{url(path)}}/#-mask-pattern-)
* [Recipes]({{url(path)}}/#recipes)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/pattern.js" target="_blank">
`lib/pattern.js` <span class="fa fa-github"></span>
</a>

Provides a limited form of pattern testing used in some other Prax modules.
Together with ES2015 destructuring, it lets you crudely approximate pattern
matching, a feature common in functional languages but missing from JavaScript.

Examples on this page imply imports:

```js
import {test} from 'prax/pattern'
import {is, isArray, isObject} from 'prax/lang'
```

## `test(pattern)`

Returns a function that checks a value against the pattern. The nature of the
function depends on the provided pattern.

A function is already a test:

```js
test(isFinite)  =  isFinite
```

A primitive produces an exact equality test via [`lang/is`](api/lang/#-is-one-other-):

```js
test(null)    =  x => is(x, null)
test(1)       =  x => is(x, 1)
test(NaN)     =  x => is(x, NaN)
test(false)   =  x => is(x, false)
test('test')  =  x => is(x, 'test')
```

A regex produces a regex test:

```js
test(/blah/)  =  x => /blah/.test(x)
```

An object produces a fuzzy test. Its values become tests in their own right
(recursively). When testing a value, its properties must match them all.

```js
test({})               =  x => isObject(x)
test({one: /oen!11/})  =  x => isObject(x) && /oen!11/.test(x.one)
test({two: isArray})   =  x => isObject(x) && isArray(x.two)
test({a: {b: 'c'}})    =  x => isObject(x) && isObject(x.a) && is(x.a.b, 'c')
```

## `mask(pattern)`

Returns a function that overlays the pattern on any value. The nature of the
result depends on the provided pattern.

A function is already a mask:

```js
mask(isFinite)  =  isFinite
```

A primitive becomes a function that always returns that primitive:

```js
mask(null)    =  () => null
mask(1)       =  () => 1
mask(NaN)     =  () => NaN
mask(false)   =  () => false
mask('mask')  =  () => 'mask'
```

A regex produces a regex test:

```js
mask(/blah/)  =  x => /blah/.test(x)
```

An object produces a mask that treats included properties as masks in their own
right (recursively) and hides other properties.

For simplicity, these examples show property access via `.`, but internally it's
done more safely.

```js
mask({})               =  _ => ({})
mask({one: /oen!11/})  ≈  x => ({one: /oen!11/.test(x.one)})
mask({two: isArray})   ≈  x => ({two: isArray(x.two)})
mask({a: {b: 'c'}})    ≈  x => ({a: {b: 'c'}})
```

## Recipes

Using `test` and ES2015 destructuring to approximate pattern matching:

```js
import {ifthen, isNumber} from 'prax/lang'
import {test} from 'prax/pattern'

// Utility

function match (pattern, func) {
  return ifthen(test(pattern), func)
}

// Usage

const x = match({type: 'double', value: isNumber}, ({value}) => value * 2)

x('test')
// undefined

x({type: 'double', value: 10})
// 20
```
