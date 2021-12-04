import {t} from './lib.mjs'
import {R} from '../rcompat.mjs'

/*
Missing tests:

  * Passing functions to `R`. Support for classes and regular functions.

  * React`s props "optimization" like [a] -> a.

  * Fragment handling.
*/
export function testRcompat({E: baseE}, eqm) {
  // Should be copied to application code.
  function E() {return R(baseE, ...arguments)}

  t.test(function test_props_children() {
    eqm(E(`div`, {children: `one`}), `<div>one</div>`)

    eqm(E(`div`, {children: [`one`, `two`]}), `<div>onetwo</div>`)

    eqm(
      E(`outer`, {children: [E(`inner`, {}, `one`)]}),
      `<outer><inner>one</inner></outer>`,
    )

    t.test(function test_props_children_come_before_other_children() {
      eqm(
        E(`div`, {children: [`one`]}, `two`),
        `<div>onetwo</div>`,
      )
    })
  })
}
