import * as x from '../dom.mjs'
import {E, F} from '../dom.mjs'
import {is, eq, throws} from './test-utils.mjs'
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

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  void function testReset() {
    throws(x.reset)

    void function testResetIdentity() {
      const node = E('div')
      is(node, x.reset(node))
    }()

    eqm(
      `<div class="three">four</div>`,
      x.reset(E('div', {class: 'one'}, 'two'), {class: 'three'}, 'four'),
    )
  }()

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  void function testResetProps() {
    throws(x.resetProps)

    void function testResetPropsIdentity() {
      const node = E('div')
      is(node, x.resetProps(node))
    }()

    eqm(
      `<div class="three">two</div>`,
      x.resetProps(E('div', {class: 'one'}, 'two'), {class: 'three'}, 'four'),
    )
  }()

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  void function testReplace() {
    throws(x.replace)
    throws(x.replace, E('div'))
    is(undefined, x.replace(E('div', {}, 'text').firstChild))

    const node = E('div', {}, E('one'), E('two'), E('three'))
    eqm(`<div><one></one><two></two><three></three></div>`, node)

    is(undefined, x.replace(node.childNodes[1], 'four', null, 'five'))
    eqm(`<div><one></one>fourfive<three></three></div>`, node)
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
