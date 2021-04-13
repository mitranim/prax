import {eq, throws} from './test-utils.mjs'
import {R, countChildren, mapChildren} from '../rcompat.mjs'

/*
Missing tests:

  * Passing functions to `R`. Support for classes and regular functions.

  * React's props "optimization" like [a] -> a.

  * Fragment handling.
*/
export function testRcompat({E: baseE}, eqm) {
  // Should be copied to application code.
  function E() {return R(baseE, ...arguments)}

  void function testPropsChildren() {
    eqm(`<div>one</div>`, E('div', {children: 'one'}))

    eqm(`<div>onetwo</div>`, E('div', {children: ['one', 'two']}))

    eqm(
      `<outer><inner>one</inner></outer>`,
      E('outer', {children: [E('inner', {}, 'one')]}),
    )

    void function testPropsChildrenComeBeforeOtherChildren() {
      eqm(
        `<div>onetwo</div>`,
        E('div', {children: ['one']}, 'two'),
      )
    }()
  }()

  void function testCountChildren() {
    eq(0, countChildren())
    eq(0, countChildren(undefined))
    eq(0, countChildren(null))
    eq(1, countChildren(10))
    eq(1, countChildren([10]))
    eq(1, countChildren([[10]]))
    eq(3, countChildren([[10], null, 20, undefined, [[30]]]))
  }()

  void function testMapChildren() {
    eq([],                 mapChildren(undefined, id))
    eq([],                 mapChildren(null, id))
    eq([],                 mapChildren([undefined], id))
    eq([],                 mapChildren([null], id))
    eq([10, 20],           mapChildren([null, [[[10], 20]], undefined], id))
    eq([[10, 0], [20, 1]], mapChildren([null, [[[10], 20]], undefined], args))

    throws(mapChildren)
    throws(mapChildren, [])

    function id(val) {return val}
    function args(...args) {return args}
  }()
}
