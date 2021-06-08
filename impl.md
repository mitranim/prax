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

Browsers technically allow appending children to a void element such as `link` or `img`. In the DOM, the children are present, but when serializing, they're ignored. We specifically forbid void element children, in order to minimize gotchas and ensure symmetry between `str.mjs` and `dom.mjs`.

## Str Performance

For `str.mjs`, many implementations were considered, implemented, and benchmarked. The naive string-bashing implementation emerged victorious.

All benchmarks were done in Node, version either 14 or 16. Other engines and versions might have different performance traits. The benchmark was limited and doesn't fully represent real apps; only _huge_ performance differences between approaches should be considered meaningful.

Caveat: variants using byte buffers performed on-the-fly conversion to `utf-8`, while string-bashing variants did not; I think for "fairness" conversion was performed separately at the end, but memory could be lying.

Attempted approaches:

* Naive string-bashing, inner-to-outer wrapping (winner).
* Assemble a tree of objects, then traverse the tree, generating HTML/XML.
  * Variant: output is a string; all encoding functions take a string, append to it, and return the string. Care was taken to always append, never prepend.
  * Variant: output is an arbitrary writer; all encoding functions take it and call `.write()`, passing strings to append. Care was taken to always write, instead of assembling intermediary values.
    * Variant: writer simply appends to a string.
    * Variant: writer appends to a `Buffer`, transcoding into `utf-8` on the fly, and growing the buffer as needed.
    * Variant: writer has a growing array of fixed-size `Buffer`s, appending to the last buffer with free space, allocating new chunks when needed, transcoding into `utf-8` on the fly.
    * Variant: same as single-`Buffer` strategy, but using `Uint8Array` and `TextEncoder`.
    * Variant: same as multiple-`Buffer` strategy, but using `Uint8Array` and `TextEncoder`.
    * Variant: writer is a Node writable stream created by opening a file.
* Same as tree of objects, but represent elements as thunks (partially applied functions).
  * Performance appears similar to tree of objects, in every respect.

Observations:

* Every variant involving `Buffer` or `Uint8Array` was significantly slower than strings.
  * Impact of on-the-fly `utf-8` conversion was not separately measured.
* Creating a tree of lightweight "elements", without any encoding, is _much_ faster than every other operation. However, subsequent traversal with encoding appears to be surprisingly costly.
* Taking care to always append to a string, as opposed to occasionally enclosing strings with a prefix and a suffix, doesn't seem to have a significant effect on performance.
* The writer _abstraction_ appears to be affordable. The wrong writer _implementation_ can dramatically slow you down.
* The simplest string-appending writer was by far the fastest writer.
* Directly using a Node file stream was incredibly slow, regardless of internal buffer size. Its write calls appear to have _way_ too much overhead.
  * Forgot if network streams were tested or not.
* One of the variants (possibly the one where all functions take and return a string, only appending to it) was marginally faster than the inner-to-outer string bashing, but at the cost of extra code complexity, which was judged unworthy.
* Using the `String` class or its subclass as the non-escape marker appears _significantly_ more efficient than any other wrapper object.
* In Node, automatic conversion of JS strings to `utf-8` when writing to a file or network socket appears to be well-optimized and insignificant compared to other operations tested here.

Naive string-bashing was chosen as the simplest among the fastest.
