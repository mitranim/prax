# Implementation Notes

## E, S, F

The names of these functions are abbreviated because they're typed and read _A LOT_.

## `reset`

`reset` buffers child nodes in a `DocumentFragment` _before_ removing old nodes, to avoid blanking old content, failing with a rendering exception, and ending with a blank page.

Instead of this:

    content -> blank -> exception -> blank page

The worst case scenario is:

    content -> exception -> old content

`E` bypasses this because it always creates a new node. Exceptions during `E` don't break existing content, unless someone passes an array of pre-existing nodes to be "stolen".

## Void Elems

Browsers technically allow appending children to a void element such as `link` or `img`. In the DOM, the children are present, but when serializing, they're ignored. We specifically forbid void element children, in order to minimize gotchas and ensure symmetry between Node and browser.
