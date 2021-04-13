# Implementation Notes

## `reset`

`reset` buffers child nodes in a `DocumentFragment` _before_ removing old nodes, to avoid blanking old content, failing with a rendering exception, and ending with a blank page.

Instead of this:

    content -> blank -> exception -> blank page

The worst case scenario is:

    content -> exception -> old content

`E` bypasses this because it always creates a new node. Exceptions wouldn't break existing content.

## Strconv

Simple rules:

* Nil (`null` and `undefined`) means one of the following, in order of priority: remove; omit; "".

* To reduce gotchas, we forbid stringification of functions and objects without a sensible `.toString` method. Currently this is done via a blacklist of "known bad" stringification methods. In particular, we ban `Object.prototype.toString` and `Array.prototype.toString`, the largest sources of accidental bad printing.

## Void Elems

Browsers technically allow appending children to a void element such as `link` or `img`. In the DOM, the children are present, but when serializing, they're ignored. We specifically forbid this, in order to minimize gotchas and ensure symmetry between Node and browser.
