const React = require('react')
const {pipe, hackClassBy} = require('prax')
const {cachingTypeTransform, coerceToComponentClass,
  atomComponentProps, safeRenderingComponentProps} = require('prax/react')
const {root} = require('./root')

const transformType = cachingTypeTransform(pipe(
  coerceToComponentClass,
  hackClassBy(atomComponentProps(root.store)),
  hackClassBy(function addContext ({prototype: {componentWillMount}}) {
    return {
      componentWillMount () {
        this.root = root
        this.context = {root, ...this.context}
        if (componentWillMount) componentWillMount.apply(this, arguments)
      },
    }
  }),
  hackClassBy(safeRenderingComponentProps),
))

module.exports = function createElement () {
  'use strict'
  arguments[0] = transformType(arguments[0])
  return React.createElement(...arguments)
}
