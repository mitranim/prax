{% extend('api.html', {title: 'pattern'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`toTest`]({{url(path)}}/#-totest-pattern-)

## Overview

Provides a limited form of pattern testing used in some other Prax modules.
Together with ES2015 destructuring, it lets you crudely approximate pattern
matching, a feature common in functional languages but missing from JavaScript.

Examples on this page imply imports:

```js
import {toTest} from 'prax/pattern'
import {is, isArray, isObject} from 'prax/lang'
```

## `toTest(pattern)`

Returns a function that checks a value against the pattern. The nature of the
function depends on the provided pattern.

A function is already a test:

```js
toTest(isFinite)  =  isFinite
```

A primitive produces an exact equality test:

```js
toTest(null)    =  x => is(x, null)
toTest(1)       =  x => is(x, 1)
toTest(NaN)     =  x => is(x, NaN)
toTest(false)   =  x => is(x, false)
toTest('test')  =  x => is(x, 'test')
```

A regex produces a regex test:

```js
toTest(/blah/)  =  x => /blah/.test(x)
```

An object produces a fuzzy match. Its key-value pairs become tests in their own
right (recursively). When testing a value, its properties must match them all.

```js
toTest({})               =  x => isObject(x)
toTest({one: /oen!11/})  =  x => isObject(x) && /oen!11/.test(x.one)
toTest({two: isArray})   =  x => isObject(x) && isArray(x.two)
toTest({a: {b: 'c'}})    =  x => isObject(x) && isObject(x.a) && is(x.a.b, 'c')
```
