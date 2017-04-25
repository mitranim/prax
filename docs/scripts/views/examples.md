## Basic Usage

```js
const React = require('react')
const {render} = require('react-dom')
const {Atom, PraxComponent, byPath} = require('prax')

const store = new Atom({message: {greeting: 'Hello world!'}})

class View extends PraxComponent {
  subrender ({deref}) {
    // Automatically subscribes to updates
    const msg = deref(byPath(store, ['message', 'greeting']))

    return (
      <div>
        <input
          value={msg || ''}
          onChange={({target: {value}}) => {
            store.swap(putIn, ['message', 'greeting'], value)
          }} />
        <span> Message: {msg}</span>
      </div>
    )
  }
}

render(<View />, document.getElementById('root'))
```

## Demand-Driven Resources

Biggest disadvantage of centralising your data and making it all immutable: it
becomes difficult to implement demand-driven design where resources initialise
when used, and unused resources are deinitialised and evicted from cache.

"Unused resources" includes HTTP requests, websockets, blob URLs that must be
[manually garbage-collected](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL),
large data that could be moved to a disk cache, and so on.

Prax makes it extremely easy with
[lazy observables](https://mitranim.com/espo/#-observable-)
that initialise/deinitialise based on subscription count.

```js
const {Atom, PraxComponent} = require('prax')
const {Xhttp} = require('xhttp')

class SomeResource extends Atom {
  // Runs when adding first subscription
  onInit () {
    this.xhr = Xhttp({url: '/api/some-resource'})
      .onDone(result => {
        this.xhr = null
        // Could delegate storage to the central store
        this.reset({result})
      })
      .start()
    this.reset({syncing: true})
  }

  // Runs when removing last subscription
  onDeinit () {
    if (this.xhr) this.xhr.abort()
  }
}

// Suppose this is our central store
const store = new Atom({
  someResource: new SomeResource(),
})

class View extends PraxComponent {
  subrender ({deref}) {
    // Subscribes and activates resource
    // Resource will deactivate when nobody is pulling data from it
    const {syncing, result} = deref(store.deref().someResource)

    return (
      syncing ?
      <div>...syncing</div> :
      result ?
      <div>Response: {JSON.stringify(result.body)}</div> :
      null
    )
  }
}
```

If we navigate away from `View` before the request has finished, and no other
component is trying to read data from `someResource`, _the unused request will
be aborted_. How cool is that?

## Event System

Having a global broadcast system is a popular and useful pattern in modern web
applications. Prax comes with nifty utilities for that.

[`espo.MessageQue`](https://mitranim.com/espo/#-messageque-) and
[`on`](api#-on-argpattern-fun-) are strictly more expressive than Node.js-style
event emitters. You decide your own event format, argument count, and so on.

`MessageQue` is a better event system than a Redux store. It supports arbitrary
arguments and can enque more than 1 dispatch at a time, processing them linearly
without overlaps. It's also resilient to exceptions: exceptions in subscribers
never interfere with other subscribers or messages. This can prevent subtle
gotchas and potentially save you hours of debugging.

```js
const {MessageQue, on, truthy} = require('prax')

const mq = new MessageQue()

// Match two arguments
const sub0 = mq.subscribe(on(
  ['greeting', {message: truthy}],
  (type, {message}) => {
    console.info('greeted:', message)
  }
))

// Match one argument
const sub1 = mq.subscribe(on(
  [{type: 'key', keyName: 'Enter'}],
  ({keyName}) => {
    console.info('Enter pressed')
  }
))

mq.push('greeting', {message: 'Hello world!'})

mq.push({type: 'key', keyName: 'Enter'})

// Eventually you're done
sub0.deinit()
sub1.deinit()
```

## Reactive Logic

Forget event handlers. Write application logic, and side effects, as reactive
definitions!

Suppose we're writing a chat application, and need to load the current user's
message feed from [Firebase](https://firebase.google.com). We need the user's ID
to subscribe to its feed, and we _must_ eventually unsubscribe. Consider:

Messages   | User       | Subscription | Action
:---------:|:----------:|:------------:|-----------:
don't want | *          | have         | unsubscribe
*          | don't have | have         | unsubscribe
want       | have       | don't have   | subscribe
want       | changed    | have         | resubscribe
...        | ...        | ...          | ...

Imagine implementing this in an event-driven way. At a glance, you'd need 4
event handlers with around 8 boolean branches. You also need to track _how many_
consumers want the messages to be loaded, and it's not even in the table. We are
merely scratching the surface.

Despite the usefulness of [broadcast systems](#event-system), using them for
coordination doesn't scale. Anything but the most trivial case (1 event, 1
response) requires a _state machine_ where the number of states and reactions
_combinatorially explodes_ with the number of logical conditions and events
involved.

So, best case scenario: explicit state machine. Also, maintenance job for life.
Common case scenario: ad-hoc, informal state machine made of crutches. It's
never pretty.

To stop the combinatorial runoff, we need to condense these conditions
and reactions into one function that reacts to _conditions_ rather than events.
It should define _side effects as a function of current state_.

This example also demonstrates [demand-driven resources](#demand-driven-resources).

```js
const {Atom, PraxComponent, byPath, putIn, noop} = require('prax')
const firebase = require('firebase/app').initializeApp(myConfig)

class MessagesResource extends Atom {
  constructor (store) {
    super(null)
    this.store = store
    this.unsub = noop
  }

  // This runs when adding first subscriber (view starts demanding data)
  onInit () {
    const resource = this

    // Note: this has only 1-2 branches.
    resource.reaction = Reaction.loop(({deref}) => {
      resource.unsub()
      resource.reset(null)

      // Reruns when unauthed or authed as a different user
      const userId = deref(byPath(resource.store, ['user', 'uid']))

      // Adding new conditions is trivial: just pull more data
      // const otherRelevantInfo = deref(someOtherResource)

      if (userId) {
        const ref = firebase.database().ref(`messages/${userId}`)
        const sub = ref.on('value', snap => {
          resource.reset(snap.val())
        })
        resource.unsub = () => ref.off('value', sub)
      }
    })
  }

  // This runs when losing last subscriber (view disappears)
  onDeinit () {
    this.reaction.deinit()
    this.unsub()
  }
}

// Suppose this is our central store
const store = new Atom({
  user: null,
  messages: null,
})

store.swap(putIn, ['messages'], new MessagesResource(store))

firebase.onAuthStateChanged(user => {
  store.swap(putIn, ['user'], user.toJSON())
})

class MessagesView extends PraxComponent {
  subrender ({deref}) {
    // (1) get data
    // (2) subscribe to updates
    // (3) initialise resource; it will load messages when authed
    const messages = deref(store.deref().messages)

    return !messages
      ? null
      : messages.map(message => (
        <Message message={message} key={message.id} />
      ))
  }
}
```

## Reactive Computations

Define your data as a reactive computation on other data by using
[`computation`](api#-computation-def-).

This idea is lifted directly from [Reagent's `reaction`](https://github.com/Day8/re-frame/blob/master/docs/SubscriptionFlow.md#how-flow-happens-in-reagent).

```js
const {Atom, PraxComponent, byPath, computation} = require('prax')

const store = new Atom({user: {firstName: 'Mira', lastName: 'Nova'}})

const fullName = computation(({deref}) => {
  const first = deref(byPath(store, ['user', 'firstName']))
  const last = deref(byPath(store, ['user', 'lastName']))
  return `${first} ${last}`
})

const sub = fullName.subscribe(fullName => {
  console.info(fullName.deref())
})

// When you're done
sub.deinit()

class UserView extends PraxComponent {
  subrender ({deref}) {
    return <div>{deref(fullName)}</div>
  }
}
```
