{% extend('index.html', {title: 'concepts'}) %}

## Time and Space

[TODO]

## Immutable History

Mutable data bad:

* Synchronous state changes
* Mutation destroys information

Immutable data good:

* History of states
* Change = receiving next value
* Forces event loop, change detection

## Functional Purity

[TODO]

## Reactive vs Proactive

* Direction is relative
* Reactive: waiting to be called
  * Pure functions are reactive
* Proactive: calling something
  * Usually involves mutable objects
* ...

[TODO]

## Data Events

Consider typical:

* Event -> Data
* Event -> Effect

Broadly speaking, the _cause_ for effects is usually an event. Includes
callbacks, timers, function calls in general.

Now consider:

* Data -> Data
  * data is a function of itself
  * data = ƒ(data)

* Data -> Effect
  * condition true -> side effect happens

Advantages:

* [TODO]
