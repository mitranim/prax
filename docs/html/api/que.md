{% extend('api.html', {title: 'que'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`Que`]({{url(path)}}/#-que-)
  * [`Que#consumer`]({{url(path)}}/#-que-consumer-)
  * [`Que#push`]({{url(path)}}/#-que-enque-events-)
* [`Emit`]({{url(path)}}/#-emit-enque-)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/que.js" target="_blank">
`lib/que.js` <span class="fa fa-github"></span>
</a>

Unbounded FIFO queue with one consumer. Flushes synchronously and linearly, even
in the face of exceptions. Used with [`App`](api/app/) to ensure linear timeline
of events and state transitions.

## `Que([consumer])`

Basic:

```js
const {Que} = require('prax/que')

const consumer = console.log.bind(console)

const que = Que(consumer)

que.enque('event0', 'event1', 'event2')
// event0
// event1
// event2
```

An exception in the consumer affects only the current tick, doesn't stop the
subsequent ticks:

```js
const que = Que(consumer)

function consumer (event) {
  if (!event) throw Error(`Expected truthy value, got: ${event}`)
  console.log(event)
}

que.enque('event0', null, 'event2')
// event0
// event2
// Uncaught Error: Expected truthy value, got: null
```

### `que.consumer`

You can create an inert que and set the consumer later. You can also change the
consumer at any time.

```js
const que = Que()

que.consumer = console.log.bind(console)

que.consumer = console.info.bind(console)
```

### `Que#enque(...events)`

Schedules each event. If the consumer function is set, this will immediately
attempt to flush the que, consuming each event.

If `enque` is called when the que is idle, it's guaranteed to fully flush before
`enque` returns. Any new events pushed _during_ the flush are also consumed.
When `enque` returns, the que is idle again.

If `enque` is called _during_ a flush, the new events are scheduled after all
currently pending events. When `enque` returns, they're still waiting to be
processed.

```js
que.enque('event0', 'event1', 'event2')
```

## `Emit(enque)`

Creates a "delayed" version of `que.enque` that passes arguments to a
user-supplied function and schedules the result.

This allows to hide imperative invocations of `enque` behind pure functions that
return events.

```js
const emit = Emit(que.enque)

function clickEvent ({type, button}) {
  return {type, value: button}
}

// schedules `{type: 'click', value: 0}` on each LMB click
document.addEventListener('click', emit(clickEvent))
```
