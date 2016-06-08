{% extend('api.html', {title: 'que'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`Que`]({{url(path)}}/#-que-)
  * [`Que#setConsumer`]({{url(path)}}/#-que-setconsumer-fun-)
  * [`Que#push`]({{url(path)}}/#-que-push-events-)
  * [`Que#die`]({{url(path)}}/#-que-die-)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/que.js" target="_blank">
`lib/que.js` <span class="fa fa-github"></span>
</a>

Don't bother reading if you're not interested in Prax internals.

Unbounded FIFO queue with one consumer. Flushes synchronously and linearly, even
in the face of exceptions. Used internally by [`App`](api/app/) to ensure
linear event timeline.

## `Que()`

Basic:

```js
const {Que} = require('prax/que')

const que = Que()

que.setConsumer(console.log.bind(console))

que.push('event0', 'event1', 'event2')
// event0
// event1
// event2

que.die()

que.push(10, 20)
// nothing
```

An exception in the consumer affects only the current tick, doesn't stop the
subsequent ticks:

```js
const que = Que()

que.setConsumer(event => {
  if (!event) throw Error(`Expected truthy value, got: ${event}`)
  console.log(event)
})

que.push('event0', null, 'event2')
// event0
// event2
// Uncaught Error: Expected truthy value, got: null
```

### `Que#setConsumer(fun)`

A que starts inert. This method attaches a function to process qued events.

```js
const que = Que()

que.setConsumer(console.log.bind(console))
```

### `Que#push(...events)`

Enqueues each event. If the consumer function is set, this will immediately
attempt to flush the que.

If `push` is called when the que is idle, the flush is guaranteed to finish
before `push` returns. Any new events pushed _during_ the flush will also be
processed as part of the flush. When `push` returns, the que is idle again.

If `push` is called _during_ a flush, the new events are enqueued after all
currently pending events. When `push` returns, they're still waiting to be
processed.

```js
que.push('event0', 'event1', 'event2')
```

### `Que#die()`

Empties the internal buffer and removes the consumer function. Use this when
disposing a que that may still asynchronously receive events you don't care
about.

```js
que.die()
que.push('event')  // ineffective
```
