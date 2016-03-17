{% extend('index.html', {title: 'scratch'}) %}

```sh
                      event queue
World               ---------------->             Events

  ^                                                 |
  |                                                 |
  |                                                 |  reduce
  |                     Main Loop                   |  compute
  |                                                 |
  |                                                 |
  |                                                 v

Effects             <----------------              Data
                       data events



World  -----> Events

Events -----> Data

Data   -----> Effects

Events --X--> Effects
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
state = ƒ(prev state, last event)

// compute
state = ƒ(prev state, next state)
```


### 4. Effects

Effects happen from _data events_, which are conditions defined on data. Effects
never happen as a direct response to events. Effects may alter the state of the
world and cause future events.

```sh
// effect
event = ƒ(prev state, next state)
```


### 5. Main Loop

The main loop consumes one event at a time, taking the following steps:
* thread state + event through reducers, produce new state
* thread state through computers, update it
* replace previous state
* scan state for data events, trigger effects


### Goals

This architecture aims to:
* isolate state mutations
* define application as function of state
* compose application out of pure functions
* eliminate the notion of time from application code

Where:
* time ≈ instruction sequences
