## Overview

Prax is:
* an architecture for realtime applications
* a library implementing that architecture

Prax is designed to complement React or any React-style rendering library. Its
concepts are applicable to more than just GUI apps.

Borrows many concepts from Clojure / Om, Haskell, Erlang, and others. Somewhat
similar to Redux, but much more feature-complete.

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
