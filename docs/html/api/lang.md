{% extend('api.html', {title: 'lang'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [List]({{url(path)}}/#list)
  * [`slice`]({{url(path)}}/#-slice-value-start-end-)
  * [`concat`]({{url(path)}}/#-concat-values-)
  * [`foldl`]({{url(path)}}/#-foldl-func-accumulator-list-)
  * [`foldr`]({{url(path)}}/#-foldr-func-accumulator-list-)
  * [`indexOf`]({{url(path)}}/#-indexof-value-list-)
  * [`remove`]({{url(path)}}/#-remove-value-list-)
  * [`last`]({{url(path)}}/#-last-list-)
  * [`flat`]({{url(path)}}/#-flat-list-)
  * [`map`]({{url(path)}}/#-map-func-list-)
* [Object]({{url(path)}}/#object)
  * [`mapObject`]({{url(path)}}/#-mapobject-func-object-)
  * [`mapValues`]({{url(path)}}/#-mapvalues-func-object-)
  * [`mapKeys`]({{url(path)}}/#-mapkeys-func-object-)
* [Func]({{url(path)}}/#func)
  * [`apply`]({{url(path)}}/#-apply-func-args-)
  * [`bind`]({{url(path)}}/#-bind-func-args-)
  * [`pipe`]({{url(path)}}/#-pipe-funcs-)
  * [`seq`]({{url(path)}}/#-seq-funcs-)
  * [`and`]({{url(path)}}/#-and-funcs-)
  * [`or`]({{url(path)}}/#-or-funcs-)
  * [`not`]({{url(path)}}/#-not-func-)
  * [`ifelse`]({{url(path)}}/#-ifelse-test-left-right-)
  * [`ifthen`]({{url(path)}}/#-ifthen-test-func-)
* [Bool]({{url(path)}}/#bool)
  * [`is`]({{url(path)}}/#-is-one-other-)
  * [`isPlainObject`]({{url(path)}}/#-isplainobject-value-)
  * [`isObject`]({{url(path)}}/#-isobject-value-)
  * [`isArray`]({{url(path)}}/#-isarray-value-)
  * [`isRegExp`]({{url(path)}}/#-isregexp-value-)
  * [`isFunction`]({{url(path)}}/#-isfunction-value-)
  * [`isPromise`]({{url(path)}}/#-ispromise-value-)
* [Misc]({{url(path)}}/#misc)
  * [`it`]({{url(path)}}/#-it-value-)

## Overview

The `lang` module contains general purpose utility functions.

All examples on this page imply an import:

```javascript
import {someFunction} from 'prax/lang'
```

## List

### `slice(value, [start], [end])`

Like
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice" target="_blank">`Array#slice`</a>,
but with the sliceable as the first argument.

```javascript
slice([1, 2, 3], 2)
// [3]
slice('hello world', 3, 5)
// 'lo'
```

### `concat(...values)`

Like
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat" target="_blank">`Array#concat`</a>,
but with `this` as the first argument.

```javascript
concat([1], [2], 3)
// [1, 2, 3]
```

### `foldl(func, accumulator, list)`

Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce" target="_blank">`Array#reduce`</a>,
but with an FP-friendly argument order (more suitable for currying and partial
application).

```javascript
function add (a, b) {
  return a + b
}

foldl(add, 10, [1, 2, 3])
// 10 + 1 + 2 + 3 = 16
```

### `foldr(func, accumulator, list)`

Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight" target="_blank">`Array#reduceRight`</a>,
but with an FP-friendly argument order.

```javascript
function sub (a, b) {
  return a - b
}

foldr(sub, 100, [1, 5, 20])
// 100 - 20 - 5 - 1 = 74
```

### `indexOf(value, list)`

Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf" target="_blank">`Array#indexOf`</a>,
but with an FP-friendly argument order. Unlike `Array#indexOf`, it detects `NaN`.

```javascript
indexOf(1, [3, 2, 1])
// 2
indexOf(NaN, [3, 2, NaN])
// 2
```

### `remove(value, list)`

Returns a new list with one occurrence of `value` removed. Doesn't change the
original list. Returns the original if it doesn't include `value`.

```javascript
remove('two', ['one', 'two', 'three'])
// ['one', 'three']
```

### `last(list)`

Returns the last element of the given list or `undefined`.

```javascript
last([1, 2, 3])
// 3
last('try me')
// 'e'
```

### `flat(list)`

Deeply flattens the given list.

```javascript
flat([1, [2], [[3]]])
// [1, 2, 3]
```

### `map(func, list)`

Like
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map" target="_blank">`Array#map`</a>,
but with an FP-friendly argument order.

```javascript
function double (a) {
  return a * 2
}

map(double, [1, 2, 3])
// [2, 4, 6]
```

## Object

### `mapObject(func, object)`

Like [`map`]({{url(path)}}/#-map-func-list-), but takes an object rather than
a list.

```javascript
function inc (a) {
  return a + 1
}

mapObject(inc, {one: 1, two: 2})
// [2, 3]
```

### `mapValues(func, object)`

Like [`mapObject`]({{url(path)}}/#-mapobject-func-object-), but preserves
key-value pairing, returning an object rather than an array.

Similar to lodash's `_.mapValues`.

```javascript
function bang (a) {
  return a + '!'
}

mapValues(bang, {ping: 'ping', pong: 'pong'})
// {ping: 'ping!', pong: 'pong!'}
```

### `mapKeys(func, object)`

Like [`mapValues`]({{url(path)}}/#-mapvalues-func-object-), but alters keys
rather than values.

Similar to lodash's `_.mapKeys`.

```javascript
mapKeys(last, {one: 'one', two: 'two'})
// {e: 'one', o: 'two'}
```

## Func

### `apply(func, args)`

Like
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply" target="_blank">`Function#apply`</a>,
but with the function as the first argument and an implicit `this = null`.

```javascript
function add (a, b) {
  return a + b
}

apply(add, [1, 2])
// 3

// equivalent
// apply(add, [1, 2]) = add.apply(null, [1, 2])
```

### `bind(func, ...args)`

Like
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind" target="_blank">`Function#bind`</a>,
but with the function as the first argument and an implicit `this = null`.

Returns a new function that represents
<a href="https://en.wikipedia.org/wiki/Partial_application" target="_blank">partial application</a>
of the given function, a common tool in functional programming. When called, it
joins arguments from both calls and invokes the original function. Think of it
like splitting a function call in two (or more).

Equivalent to lodash's `_.partial` if you ignore `this`.

```javascript
function add (a, b) {
  return a + b
}

const inc = bind(add, 1)

inc(2)
// 3

const incMany = bind(map, inc)

incMany([1, 2, 3])
// [2, 3, 4]

// equivalent
// bind(map, inc) = map.bind(null, inc)
```

### `pipe(...funcs)`

Returns a new function that represents
<a href="https://en.wikipedia.org/wiki/Function_composition_(computer_science)" target="_blank">composition</a>
of the given functions, a common tool in functional programming. When called, it
passes all arguments to the first function, and pipes the output through the
rest.

Equivalent to lodash's `_.flow`.

```javascript
function add (a, b, c) {
  return a + b + c
}

function double (a) {
  return a * 2
}

function bang (a) {
  return a + '!'
}

const x = pipe(add, double, bang)

x(1, 2, 3)
// (1 + 2 + 3) * 2 + '!' = '12!'
```

### `seq(...funcs)`

Returns a new function that runs the given functions independently from each
other, passing all arguments to each and returning the result of the last one.
Useful for combining operations that have side effects.

```javascript
function first (a, b) {
  console.log('first:', a, b)
}

function second (a, b) {
  console.log('second:', a, b)
}

function add (a, b) {
  return a + b
}

const x = seq(first, second, add)

x(1, 2)
// prints 'first: 1 2'
// prints 'second: 1 2'
// 3
```

### `and(...funcs)`

Represents the `&&` operation in terms of functions rather than expressions.
Returns a new function that `&&`s calls to the given functions, passing all
arguments to each.

Like `&&`, it's lazy and aborts early when a function returns a falsy value.

```javascript
function isNumber (value) {
  return typeof value === 'number'
}

function isPositive (value) {
  return value > 0
}

// this:
const isPosNum = and(isNumber, isPositive)

// is equivalent to:
function isPosNum () {
  return isNumber(...arguments) && isPositive(...arguments)
}

isPosNum(1)
// isNumber(1) && isPositive(1) = true

isPosNum('1')
// isNumber('1') = false
```

### `or(...funcs)`

Represents the `||` operation in terms of functions rather than expressions.
Returns a new function that `||`s calls to the given functions, passing all
arguments to each.

Like `||`, it's lazy and aborts early when a function returns a truthy value.

```javascript
function isNumber (value) {
  return typeof value === 'number'
}

function isString (value) {
  return typeof value === 'string'
}

// this:
const isPrintable = or(isNumber, isString)

// is equivalent to:
function isPrintable () {
  return isNumber(...arguments) || isString(...arguments)
}

isPrintable(NaN)
// isNumber(NaN) = true

isPrintable([])
// isNumber([]) || isString([]) = false
```

### `not(func)`

Represents the `!` operation in function terms. Returns a new function that
negates the result of the given function.

```javascript
function eq (a, b) {
  return a === b
}

// this:
const different = not(eq)

// is equivalent to:
function different () {
  return !eq(...arguments)
}

different(1, 2)
// !eq(1, 2) = true
```

### `ifelse(test, left, right)`

Represents the `_ ? _ : _` operation in terms of functions rather than
expressions. Returns a new function that calls `left` if `test` succeeds and
`right` otherwise, passing all arguments to each.

```javascript
function isNumber (a) {
  return typeof a === 'number'
}

function inc (a) {
  return a + 1
}

function bang (a) {
  return a + '!'
}

// this:
const oneone11 = ifelse(isNumber, inc, bang)


// is equivalent to:
function oneone11 () {
  return (isNumber(...arguments) ? inc : bang)(...arguments)
}

oneone11(1)
// isNumber(1) ? inc(1) : _ = 2

oneone11('1')
// isNumber('1') ? _ : bang('1') = '1!'
```

### `ifthen(test, func)`

Like `ifelse` without the `else` clause.

```javascript
ifthen(test, func)  ->  ifelse(test, func, () => undefined)
```

## Bool

### `is(one, other)`

Like `===` but considers `NaN` equal to itself.

```javascript
is(1, '1')
// false

is(NaN, NaN)
// true
```

### `isPlainObject(value)`

True if `value` is a normal, honest-to-goodness object and not something
fancy-shmancy.

```javascript
isPlainObject({})
// true

isPlainObject(Object.create(null))
// true

isPlainObject([])
// false
```

### `isObject(value)`

True if `value` has the type `'object'` and isn't `null`. This covers arrays,
regexes, user-defined classes, DOM nodes, and so on. Doesn't consider functions
to be objects, even though technically they are.

```javascript
isObject('blah')
// false

isObject(/blah/)
// true

isObject([])
// true

isObject(Object.create(null))
// true

isObject(() => {})
// false
```

### `isArray(value)`

True if `value` inherits from `Array.prototype`.

```javascript
isArray([])
// true
```

### `isRegExp(value)`

```javascript
isRegExp(/blah/)
// true
```

### `isFunction(value)`

```javascript
isFunction(() => {})
// true
```

### `isPrimitive(value)`

Definition:

```javascript
not(or(isObject, isFunction))
```

This includes:
  * numbers
  * strings
  * booleans
  * symbols
  * `null` and `undefined`

### `isPromise(value)`

True if the value
<a href="https://en.wikipedia.org/wiki/Duck_test" target="_blank">quacks</a>
like an ES2015 promise. The value doesn't have to
inherit from the built-in `Promise.prototype`.

```javascript
isPromise(Promise.resolve('test'))
// true

isPromise({then () {}, catch () {}})
// true

isPromise({then () {}})
// false
```

## Misc

### `it(value)`

Identity function: returns its argument unchanged. Useful in boolean contexts.

```javascript
it(1)
// 1
```
