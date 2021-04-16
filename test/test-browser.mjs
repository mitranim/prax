import * as x from '../prax.mjs'
import {E, F} from '../prax.mjs'
import {is, eq} from './test-utils.mjs'
import {testCommon} from './test-common.mjs'

Error.stackTraceLimit = Infinity

window.x = x
Object.assign(window, x)

// "equal markup"
function eqm(str, node) {is(str, node.outerHTML)}

try {
  testCommon(x, eqm)

  void function testUnknownPropsBecomeAttrs() {
    eqm(`<div unknown="10"></div>`, E('div', {unknown: 10}))
  }()

  void function testKnownPropsPreserveVals() {
    const node = E('input', {maxLength: 10})
    eqm(`<input maxlength="10">`, node)
    is(10, node.maxLength)
  }()

  // Recommendation: prefer `class`.
  void function testClassVsClassName() {
    eqm(`<div class="two"></div>`, E('div', {class:     'one', className: 'two'}))
    eqm(`<div class="two"></div>`, E('div', {className: 'one', class: 'two'}))
  }()


  void function testBoolAttrsAsProps() {
    is(true, E('input', {type: 'checkbox', checked: true}).checked)
    is(false, E('input', {type: 'checkbox', checked: false}).checked)
  }()

  // Additional test for the tree structure, not just the serialized output.
  // We don't create text nodes for nil and "".
  void function testChildFlattening() {
    const elem = (
      E('outer', {},
        undefined,
        [[['']]],
        [[['one']]],
        [
          null,
          E('mid', {},
            undefined,
            ['two', [E('inner', {}, [['three']], undefined)]],
            null,
            'four',
          ),
        ],
        '',
        'five',
      )
    )

    eqm(
      `<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`,
      elem,
    )

    eq(['one', ['two', ['three'], 'four'], 'five'], toChildTextTree(elem))
  }()

  void function testFragment() {
    is(true, F() instanceof DocumentFragment)

    eq([], toChildTextTree(F()))

    eq(
      ['one', '10', ['two']],
      toChildTextTree(F('one', [10], E('div', {}, 'two'))),
    )
  }()

  void function testChildKidnapping() {
    const prev = E('div', {}, 'one', 'two', 'three')
    const next = E('p', {}, ...prev.childNodes)

    eqm(`<div></div>`, prev)
    eqm(`<p>onetwothree</p>`, next)

    eq([], toChildTextTree(prev))
    eq(['one', 'two', 'three'], toChildTextTree(next))
  }()

  void function testOk() {
    x.reset(document.body, {},
      E('p', {class: 'size-double text-center'}, '[test] ok!'),
    )
  }()
}
catch (err) {
  console.error(err)
  document.body.append(err.stack)
}

function toChildTextTree(node) {
  if (node instanceof Text) return node.textContent
  return [...node.childNodes].map(toChildTextTree)
}
