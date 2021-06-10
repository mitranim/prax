import {R} from '../rcompat.mjs'

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
}
