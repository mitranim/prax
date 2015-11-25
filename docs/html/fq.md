## `multimatch(pattern, func)`

takes a pattern and a function that takes a function and returns a function and
returns a function that takes a function and passes it to the returned function,
returning a function that takes a value and passes it to the passed or returned
function depending on whether the value matches the pattern

## `match(pattern, func)`

takes a pattern and a function that takes a value and returns a function that
takes a function and returns a function that takes a value and passes is to the
first or second passed function depending on whether the value matches the
pattern

```
pattern, receiverFunc => nextFunc => value => {/* unspecified */}
```

the end result is this:

```
value => {
  if (valueMatchesPattern) return receiverFunc(value)
  else return nextFunc(value)
}
```
