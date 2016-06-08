{% extend('api.html', {title: 'react'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [`Auto`]({{url(path)}}/#-auto-)
* [TODO] `ReactiveRender`

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/react.js" target="_blank">
`lib/react.js` <span class="fa fa-github"></span>
</a>

Prax has optional React utils that enable _implicit subscriptions_.

Prax-based views look like pure functions, but behind the scenes, they establish
precise subscriptions for fine-grained updates, using React to its fullest.

## `Auto`

Creates a view factory that converts "pure function" views into full-featured
React classes. Views created by `auto` implicitly subscribe to the data accessed
by the view function, and update when it's changed. They also use
`shouldComponentUpdate` to reject unnecessary parent renders.

```js
const {Component} = require('react')
const {App, WatchNow} = require('prax')
const {Auto} = require('prax/react')

const app = App()
const auto = Auto(Component, WatchNow(app))

const ReactiveView = auto((props, read) => (
  <div>
    {read('one', props.someKey)}
    {read('two', props.someKey)}
  </div>
))
```

In this example, `ReactiveView` will automatically subscribe to application data
accessed through `read`, and automatically re-render when that data is changed.
If `props` change, the subscriptions will also change.

**Note**: this is very different from function-style views introduced in React
`0.14`. React re-renders them unconditionally, and you can't use
`shouldComponentUpdate` and `forceUpdate` for finer-grained updates. Rendering a
tree of "pure function" views is probably slower than bashing together a string
and calling `document.body.innerHTML = ...`. In contrast, `Auto` views re-render
only on changes in the data they _really_ use.
