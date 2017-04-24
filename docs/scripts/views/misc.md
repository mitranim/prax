## Definitions

Let's define our terms.

### _state_

Something that changes over time and has a "current" form.

Example: a mutable object; it has a "current" value that may change later.
Another example: a mutable [reference](https://mitranim.com/espo/#-atom-value-)
to a "current" immutable value.

Counter-example: an [immutable value](https://github.com/Mitranim/emerge)
that can't be modified and must be replaced in order to enact change. Another
counter-example: multiple values coming from a
[data stream](examples#event-system);
they're not glued together and therefore don't form a concrete state.

### _resource_

Something that can't be garbage-collected until you call some function or method
to deinitialise it. May produce side effects until deinitialised. In
Rust's terms, it has a _lifetime_ and must have an
[_owner_](https://doc.rust-lang.org/book/ownership.html#ownership) responsible
for it.

Example: an [event subscription](examples#event-system). Won't stop until
deinited. Another example: a websocket connection.

### _demand-driven_

Something that activates when it has users/consumers/subscribers and deactivates
when nobody is looking at it.

Bonus points if you noticed the complete opposite of "unidirectional flow"
(popular buzzword). It's a myth. Consumers and producers always have a dialog,
and it should be first-class.

Example: subscriber-counting observable that maintains a websocket connection
when it has subscribers, and drops it when nobody's looking.

```js
const {Atom} = require('prax')
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
