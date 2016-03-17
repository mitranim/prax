{% extend('api.html', {title: 'react'}) %}

## Overview

Prax has optional React-specific addons. It complements React with:
* implicit data subscriptions
* automatic change detection
* components as pure functions

Prax frees you from manual subscriptions and triggers that permeate Flux apps.
It also eliminates all unnecessary re-renders.

The addons are not imported into the main library, so you don't pay the size
cost if you're using Prax without React.

## `auto`

React `0.14` introduced an option to write components as functions:

```javascript
import React from 'react'

const MyComponent = props => (<div>...</div>)
```

This is currently useless. React re-renders these components unconditionally,
and you can't use `shouldComponentUpdate` and `forceUpdate / setState` for
finer-grained updates.

Function components in Prax are actually useful.

```javascript
import {App} from 'prax/app'
import {WatchNow} from 'prax/watch'
import {Auto} from 'prax/react'
import {Component} from 'react'

const app = App()
const auto = Auto(Component, WatchNow(app))

const ReactiveComponent = auto((props, read) => (
  <div>
    {read('one', props.one)}
    {read('two', props.two)}
  </div>
))
```

In this example, instances of `ReactiveComponent` will automatically subscribe
to app data at paths `['one', props.one]` and `['one', props.two]`. They will
automatically re-render when that data is changed. If `props` change, the
subscriptions will automatically change.
