# Implementation Notes

## E, S, F

The names of these functions are abbreviated because they're typed and read _A LOT_.

"E" stands for "element" or "HTML element". In Node, it performs HTML serialization, with HTML-specific special cases. In browsers, it creates regular DOM nodes (without an explicit namespace).

"S" stands for "SVG". In Node, it should perform XML serialization without HTML special cases (but currently just calls E for simplicity; this should be fixed). In browsers, it creates DOM nodes that belong to the SVG namespace.

"F" stands for "fragment". In Node, it encodes multiple children without any wrappers or delimiters. In browsers, it creates a `DocumentFragment`, which serves the same purpose: a single node that stands for multiple nodes.

## `reset`

`reset` buffers child nodes in a `DocumentFragment` _before_ removing old nodes, to avoid blanking old content, failing with a rendering exception, and ending with a blank page.

Instead of this:

    content -> blank -> exception -> blank page

The worst case scenario is:

    content -> exception -> old content

`E` bypasses this because it always creates a new node. Exceptions during `E` don't break existing content, unless someone passes an array of pre-existing nodes to be "stolen".

## Strconv

Simple rules:

* Nil (`null` and `undefined`) means one of the following, in order of priority: remove; omit; "".

* To reduce gotchas, we forbid stringification of functions and objects without a sensible `.toString` method. Currently this is done via a blacklist of "known bad" stringification methods. In particular, we ban `Object.prototype.toString` and `Array.prototype.toString`, the largest sources of accidental bad printing.

## Void Elems

Browsers technically allow appending children to a void element such as `link` or `img`. In the DOM, the children are present, but when serializing, they're ignored. We specifically forbid this, in order to minimize gotchas and ensure symmetry between Node and browser.
