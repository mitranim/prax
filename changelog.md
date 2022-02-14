## `0.7.12`

`reg` is now idempotent. This allows `reg(new.target)`, which can automate registration of subclasses.

## `0.7.11`

`toStr` is also exported by `str.mjs` (undocumented).

## `0.7.10`

Added iterator support. Iterators, such as those from `function*`, are now automatically traversed just like arrays.

Added `lax` and support for "lax mode".

Added `reg`: shortcut for registering custom elements.

Added more mutation shortcuts: `resetDoc`, `resetHead`, `resetBody`, `resetText`.

## `0.7.9`

Added `merge`.

## `0.7.8`

Better compatibility with dead code elimination. Bundlers should now remove `voidElems`, `boolAttrs`, and `e` if unused.

## `0.7.7`

`dom.d.ts` now pre-declares any DOM globals that it depends on. These declarations get merged with any externals, such as from `lib="dom"`. This allows Prax to be imported in any environment.

## `0.7.6`

Allow `.ts` on NPM (previously auto-banned in `.npmignore`).

## `0.7.5`

Added functions `vac` and `props`.

Because props returned by `props` may include dict-like `DOMStringMap` (most notably `dataset`), to make `props` reversible without resorting to unnecessary object copying, this version also removes the undocumented requirement of using plain dicts (`{}` or null-prototype objects) for props, `dataset`, `attributes` and `style`. Prax now allows them to be non-plain objects. This is tentative, and may be revised in future versions.

Minor tweaks in TS definitions.

## `0.7.4`

Now has `.d.ts` definitions, courtesy of @pleshevskiy.

## `0.7.3`

`dom.mjs`: fixed ARIA properties such as `ariaCurrent` for FF and possibly other non-Blink browsers.

## `0.7.2`

`reset` no longer internally allocates a `DocumentFragment` when called only with 2 arguments.

## `0.7.1`

`doc` is now isomorphic and documented. In `dom.mjs`, it's just a pass-through.

## `0.7.0`

* Added `replace`.
* `resetProps` now returns the same node, like `reset`.
* Renamed `countChildren` → `len`, moved from `rcompat.mjs` to main API.
* Renamed `mapChildren` → `map`, moved from `rcompat.mjs` to main API.

## `0.6.0`

Better lexicon:

  * `node.mjs` → `str.mjs`.
  * `prax.mjs` → `dom.mjs`.

Added undocumented function `doc` to `str.mjs`.

## `0.5.3`

Consistently report key names in exceptions for invalid properties in nested props such as `dataset`.

## `0.5.2`

Minor consistency tweaks in class and style assignment. Minor code cosmetics.

## `0.5.1`

`resetProps` and `reset` avoid reassigning identical prop values. This sometimes avoids expensive style recalculations.

## `0.5.0`

Prior versions were a weird cross-section of several libraries, whose functionality eventually got integrated into those libraries. `0.5.0` is an entirely new and different system, completely standalone. See the docs.
