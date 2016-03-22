{% extend('index.html', {title: 'scratch'}) %}

```sh

    History
    -------


              event               event
    state n   ---->   state n+1   ---->   state n+2   ---->   ...




    App
    ---


           -----------------  World  <----------------
          |                                           |
          |                                           |
          v                                           |
                                                      |
    [Event Queue]  <--------  events  <---------------
        event                                         |
        event                                         |
        event                                         |
        event                                         |
        event
         ...  event  ---------------------------->   Main





    Main
    ----

    Data Phase

      reduce

        state = ƒ(state, event)

      compute

        state = ƒ(prev state, state)

    Effect Phase

      side effects

        events = ƒ(prev state, state, event)

        events -> queue



    World   -----> Events

    Events  -----> Data

    Data    -----> Effects

    Events  -----> Effects

    Effects -----> Events

    Events  --X--> Events
```


### 1. World

The world is everything external to the application. The state of the world is
unpredictable and changes without notice. Output channels such as GUI, DOM, or
terminal are considered to be part of the world.


### 2. Events

Events come from external APIs (OS, hardware, etc). A timeout or ajax callback
qualifies as an external event. The main loop consumes one event at a time,
while pending events are buffered.


### 3. Data

Data is the entire application state. It's defined as a product of the previous
state and last event, and is updated by the main loop in response to events.

```sh
// reduce
state = ƒ(prev state, event)

// compute
state = ƒ(prev state, next state)
```


### 4. Effects

Effects may happen directly in response to events, or from _data events_, which
are conditions defined on data. Effects may alter the state of the world and
return new events.

```sh
// effect
event(s) = ƒ(prev state, next state, event)
```


### 5. Main Loop

The main loop consumes one event at a time, taking the following steps:

* compute new state using reducer functions
* recompute new state using computer functions
* replace previous state
* run effect functions, passing two most recent states and the event
* enqueue any new events returned by effects


### Goals

* isolate state mutations
* define application as function of state
* compose application out of pure functions
* minimise the notion of time in application code

Where:

* time ≈ instruction sequences
