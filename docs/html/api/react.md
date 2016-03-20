{% extend('api.html', {title: 'react'}) %}

## Overview

Prax has optional React-specific addons. It complements React with:
* implicit data subscriptions
* automatic change detection
* views as pure functions

Prax frees you from manual subscriptions and triggers that permeate Flux apps,
while helping to eliminate unnecessary re-renders.

## `auto`

React `0.14` introduced an option to write views as functions:

```javascript
import React from 'react'

const MyView = props => (<div>...</div>)
```

This is currently useless and misleading. React re-renders these views
unconditionally, and you can't use `shouldComponentUpdate` and `forceUpdate` for
finer-grained updates. Rendering a tree of these things is probably slower than
bashing together a string and calling `document.body.innerHTML = ...`.

In contrast, function views in Prax are actually useful.

```javascript
import {App} from 'prax/app'
import {WatchNow} from 'prax/watch'
import {Auto} from 'prax/react'
import {Component} from 'react'

const app = App()
const auto = Auto(Component, WatchNow(app))

const ReactiveView = auto((props, read) => (
  <div>
    {read('one', props.one)}
    {read('two', props.two)}
  </div>
))

// Deconstructing props reduces the amount of typing:
auto(({one, two}, read) => (
  <div>
    {read('one', one)}
    {read('two', two)}
  </div>
))
```

In this example, instances of `ReactiveView` will automatically subscribe
to app data at paths `['one', props.one]` and `['one', props.two]`. They will
automatically re-render when that data is changed. If `props` change, the
subscriptions will automatically change.
