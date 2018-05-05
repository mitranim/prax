import * as es from 'espo'
import * as e from 'emerge'
import * as f from 'fpx'

export function byPath(observableRef, path) {
  return new es.PathQuery(observableRef, path, e.equal)
}

export function byQuery(observableRef, query) {
  return new es.Query(observableRef, query, e.equal)
}

export function computation(def) {
  return new es.Computation(def, e.equal)
}

export function on(argPattern, fun) {
  f.validate(argPattern, f.isList)
  return function on_(arg) {
    return f.testBy(arguments, argPattern) ? fun(...arguments) : arg
  }
}

export function validateInstance(instance, Class) {
  f.validateInstance(instance, Class)
}
