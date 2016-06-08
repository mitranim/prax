{% extend('api.html', {title: 'index'}) %}

## Overview

The default import:

```js
require('prax')
```

gets you the index module. It re-exports everything from:

* [`app`](api/app/)
* [`que`](api/que/)
* [`words`](api/words/)
* <a href="https://github.com/Mitranim/emerge" target="_blank">`emerge` <span class="fa fa-github"></span></a>
* <a href="https://github.com/Mitranim/fpx" target="_blank">`fpx` <span class="fa fa-github"></span></a>

Example:

```js
const {
  App,      // prax/app
  compute,  // prax/words
  putAt,    // emerge
  ifelse    // fpx
} = require('prax')
```
