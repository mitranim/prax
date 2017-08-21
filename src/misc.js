import {PathQuery, Query, Computation} from 'espo'
import {equal} from 'emerge'
import {ifonly, rest, test, isList, validate} from 'fpx'

export function byPath (observableRef, path) {
  return new PathQuery(observableRef, path, equal)
}

export function byQuery (observableRef, query) {
  return new Query(observableRef, query, equal)
}

export function computation (def) {
  return new Computation(def, equal)
}

export function on (argPattern, fun) {
  validate(isList, argPattern)
  return ifonly(rest(test(argPattern)), fun)
}
