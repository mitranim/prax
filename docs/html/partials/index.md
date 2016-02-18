## Overview

Prax is:
* an architecture for GUI apps
* a library implementing that architecture

Prax complements React. It's not React-specific, and should complement any
React-inspired rendering library.

Borrows many concepts from Clojure / Om, Erlang, Elm, and others. Similar to
Redux, but more feature-complete. Very powerful but extremely small (5 KB
minified).

## Example

React component with Prax:

<!--:
<div class="demo-pair">
:-->

```javascript
const Root = auto((props, read) => {
  return (
    <div>
      <pre className='pad'>
        {JSON.stringify(read(), null, 2)}
      </pre>
    </div>
  )
})

React.render(<Root />, document.getElementById('root'))
```

<!--:
  <div data-state></div>
</div>
:-->

Class-style components are also available, see the [React addons](api/react) API.

## Compatibility

Any ES5 environment (IE9+).
