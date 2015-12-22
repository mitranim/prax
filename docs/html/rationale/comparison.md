## Flux

## Redux

The store is called _atom_ and it's only concerned with _reading_ data. You
update it by writing the entire new state. The atom has _watch_ and _change
detection_ mechanisms.

The message-passing approach to commands / actions is a separate concept:
_message bus_; you can view it as Redux middleware supercharged by pattern
matching. Unlike Redux, it's a broadcast rather than a queue.
