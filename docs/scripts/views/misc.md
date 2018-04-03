## Definitions

Let's define our terms.

### _state_

Something that changes over time and has a "current" form.

Example: a mutable object; it has a "current" value that may change later.
Another example: a mutable [reference](https://mitranim.com/espo/#-atom-value-)
to a "current" immutable value.

Counter-example: an [immutable value](api#emerge) that can't be modified and
must be replaced in order to enact change. Another counter-example: multiple
values coming from a [data stream](examples#event-system); they're not glued
together and therefore don't form a concrete state.

### _resource_

Something that can't be garbage-collected until you call some function or method
to deinitialize it. May produce side effects until deinitialized. In
Rust's terms, it has a _lifetime_ and must have an
[_owner_](https://doc.rust-lang.org/book/ownership.html#ownership) responsible
for it.

Examples:

  * [event subscription](examples#event-system)
  * observable with subscribers
  * websocket connection
  * timer reference from `setTimeout`
  * blob URL that must be [manually garbage-collected](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL)

Counter-example: plain data that can be GCed if dropped.

Bad example: an HTTP [fetch](https://github.com/github/fetch) promise. All you
have is a promise, the reference to the real resource is lost, and you can't
abort the request.

### _data_

Something that's not a [resource](#_resource_). Doesn't matter if it's an
object, a primitive, or a pure function; a built-in type or a custom type; has
methods or not; mutable or immutable. The defining quality of data is that it's
_inert_. It can be safely cloned or dropped, and doesn't become a resource at
any point in its lifecycle.

Examples:

  * primitive values
  * plain [immutable data](api#emerge) such as `Object.freeze({})`
  * a "model class" without external side effects

Counter-example: an observable reference such as
[`Atom`](https://mitranim.com/espo/#-atom-value-). It's a resource that
_contains_ data. It's inert when it has no subscribers, but with subscribers, it
can't be GCed until deinited.

### _demand-driven_

Something that activates when it has users/consumers/subscribers and deactivates
when nobody is looking at it.

Bonus points if you have noticed that this is a complete opposite of
"unidirectional flow", which is a popular buzzword and a myth. Consumers and
producers always have a dialog, and it should be first-class.

Example: a subscriber-counting observable that maintains a websocket connection
when it has subscribers, and drops it when nobody's looking.

See [another example](examples#demand-driven-resources).

```js
const {Atom} = require('espo') // peer dependency
const {Webbs} = require('webbs')

class MyResource extends Atom {
  onInit () {
    this.ws = new Webbs('wss://my-resource-endpoint')
    this.ws.onmessage = ({data}) => {
      this.reset(JSON.parse(data))
    }
    this.ws.open()
  }

  onDeinit () {
    this.ws.close()
  }
}

const resource = new MyResource()

// Implicitly opens websocket
const sub = resource.subscribe(resource => {
  console.info(resource.deref())
})

// Implicitly closes websocket
sub.deinit()
```

Note for RxJS users: this concept exists in Rx, and is called "cold/hot
observables". Doesn't get enough attention, thanks to their habitually
convoluted API.
