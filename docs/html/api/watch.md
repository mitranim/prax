{% extend('api.html', {title: 'watch'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [[WIP] `Watcher`]({{url(path)}}/#-watcher-func-)
* [[TODO] Watch]
* [[TODO] WatchNow]

## Overview

Most subscription systems are coarse-grained: they force you to manually
subscribe to different objects or events types, or write filtering functions for
streams. In other words, they require metadata. This produces boring boilerplate
code.

Prax's watching mechanism allows you to create extremely precise, fine-grained
subscriptions expressed as functions, without any explicit metadata.

## `Watcher(func)`

**[WIP] this is a stub!**

Takes a function with the following signature:

```javascript
function reader (read) {
  // read the data at the given path
  console.log(read('some', 'path'))
}
```

Wraps it into a watcher, returning a function with the following signature:

```javascript
function watcher (prev, next) {
  // may or may not call the reader
}
```

Basic example:

```javascript
// Implicitly subscribes to the path ['one', 'two']
function reader (read) {
  console.log(read('one', 'two'))
}

const watcher = Watcher(reader)

watcher(undefined, {one: {two: 2}})
// prints 2

watcher({one: {two: 2}}, {one: {two: 2, three: 3}})
// no effect

watcher({one: {two: 2}}, {one: {two: 'two'}})
// prints 'two'
```
