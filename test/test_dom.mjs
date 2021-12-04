import {t} from './lib.mjs'
import {testCommon} from './test_common.mjs'
import * as x from '../dom.mjs'
import {E, F} from '../dom.mjs'

/* Setup */

Error.stackTraceLimit = Infinity

// For REPL.
window.x = x
Object.assign(window, x)

// Short for "equal markup".
function eqm(node, str) {t.is(node.outerHTML, str)}

const msgOk = `[test] ok!`
const msgFail = `[test] fail`

/* Tests */

try {
  testCommon(x, eqm)

  t.test(function testUnknownPropsBecomeAttrs() {
    eqm(E(`div`, {unknown: 10}), `<div unknown="10"></div>`)
  })

  t.test(function testKnownPropsPreserveVals() {
    const node = E(`input`, {maxLength: 10})
    eqm(node, `<input maxlength="10">`)
    t.is(node.maxLength, 10)
  })

  // Recommendation: prefer `class`.
  t.test(function testClassVsClassName() {
    eqm(E(`div`, {class:     `one`, className: `two`}), `<div class="two"></div>`)
    eqm(E(`div`, {className: `one`, class: `two`}), `<div class="two"></div>`)
  })

  t.test(function testBoolAttrsAsProps() {
    t.ok(E(`input`, {type: `checkbox`, checked: true}).checked)
    t.no(E(`input`, {type: `checkbox`, checked: false}).checked)
  })

  // Additional test for the tree structure, not just the serialized output.
  // We don't create text nodes for nil and "".
  t.test(function testChildFlattening() {
    const elem = (
      E(`outer`, {},
        undefined,
        [[[``]]],
        [[[`one`]]],
        [
          null,
          E(`mid`, {},
            undefined,
            [`two`, [E(`inner`, {}, [[`three`]], undefined)]],
            null,
            `four`,
          ),
        ],
        ``,
        `five`,
      )
    )

    eqm(
      elem,
      `<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`,
    )

    t.eq(toChildTextTree(elem), [`one`, [`two`, [`three`], `four`], `five`])
  })

  t.test(function testFragment() {
    t.ok(F() instanceof DocumentFragment)

    t.eq(toChildTextTree(F()), [])

    t.eq(
      toChildTextTree(F(`one`, [10], E(`div`, {}, `two`))),
      [`one`, `10`, [`two`]],
    )
  })

  t.test(function testChildKidnapping() {
    const prev = E(`div`, {}, `one`, `two`, `three`)
    const next = E(`p`, {}, ...prev.childNodes)

    eqm(prev, `<div></div>`)
    eqm(next, `<p>onetwothree</p>`)

    t.eq(toChildTextTree(prev), [])
    t.eq(toChildTextTree(next), [`one`, `two`, `three`])
  })

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  t.test(function testReset() {
    t.throws(x.reset, TypeError, `instance of Element`)

    t.test(function testResetIdentity() {
      const node = E(`div`)
      t.is(x.reset(node), node)
    })

    t.test(function testResetRemovesChildren() {
      eqm(
        x.reset(E(`div`, {class: `one`}, `two`), {class: `three`}),
        `<div class="three"></div>`,
      )
    })

    t.test(function testResetReplacesChildren() {
      eqm(
        x.reset(E(`div`, {class: `one`}, `two`), {class: `three`}, `four`),
        `<div class="three">four</div>`,
      )
    })
  })

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  t.test(function testResetProps() {
    t.throws(x.resetProps, TypeError, `instance of Element`)

    t.test(function testResetPropsIdentity() {
      const node = E(`div`)
      t.is(x.resetProps(node), node)
    })

    eqm(
      x.resetProps(E(`div`, {class: `one`}, `two`), {class: `three`}),
      `<div class="three">two</div>`,
    )
  })

  // Parts of this function are tested elsewhere.
  // We only need a sanity check here.
  t.test(function testReplace() {
    t.throws(x.replace, TypeError, `instance of Node`)
    t.throws(() => x.replace(E(`div`)), TypeError, `properties of null`)
    t.is(x.replace(E(`div`, {}, `text`).firstChild), undefined)

    const node = E(`div`, {}, E(`one`), E(`two`), E(`three`))
    eqm(node, `<div><one></one><two></two><three></three></div>`)

    t.is(x.replace(node.childNodes[1], `four`, null, `five`), undefined)
    eqm(node, `<div><one></one>fourfive<three></three></div>`)
  })

  // `dom`-specific; in `str`, this prepends a doctype.
  t.test(function testDoc() {
    t.is(x.doc(undefined), undefined)

    const node = E(`html`)
    t.is(x.doc(node), node)
  })

  // This test is very limited and needs to be expanded.
  t.test(function testProps() {
    t.throws(x.props, TypeError, `instance of Element`)

    t.eq(
      toPlain(x.props(E(`div`, {
        dataset: {two: `three`},
        'data-four': `five`,
        class: `one`,
        style: {padding: `1rem`},
      }))),
      {
        dataset: {two: `three`, four: `five`},
        class: `one`,
        style: `padding: 1rem;`,
      },
    )

    const props = {
      dataset: {two: `three`, four: `five`},
      class: `one`,
      style: `padding: 1rem;`,
    }

    eqm(
      E(`div`, props),
      `<div data-two="three" data-four="five" class="one" style="padding: 1rem;"></div>`,
    )

    eqm(
      E(`div`, x.props(E(`div`, props))),
      `<div data-two="three" data-four="five" class="one" style="padding: 1rem;"></div>`,
    )

    eqm(
      E(`div`, x.props(E(`div`, x.props(E(`div`, props))))),
      `<div data-two="three" data-four="five" class="one" style="padding: 1rem;"></div>`,
    )
  })

  t.test(function test_resetText() {
    t.throws(x.resetText, TypeError, `instance of Element`)

    const node = E(`div`, {class: `one`}, `two`)
    eqm(node, `<div class="one">two</div>`)

    t.throws(() => x.resetText(node, {}), TypeError, `not stringable`)
    eqm(node, `<div class="one">two</div>`)

    t.is(x.resetText(node), node)
    eqm(node, `<div class="one"></div>`)

    t.is(x.resetText(node, `three`), node)
    eqm(node, `<div class="one">three</div>`)

    t.is(x.resetText(node, new x.Raw(`four`)), node)
    eqm(node, `<div class="one">four</div>`)

    t.is(x.resetText(node, [`five`, null, [`_`, [`six`]]]), node)
    eqm(node, `<div class="one">five_six</div>`)
  })

  t.test(function test_resetHead() {
    t.throws(x.resetHead, TypeError, `instance of HTMLHeadElement`)

    const prev = [...document.head.children]

    x.resetHead(E(`head`))
    t.eq([...document.head.children], prev)

    x.resetHead(E(`head`))
    t.eq([...document.head.children], prev)

    t.test(function test_reset_title() {
      t.eq(document.title, `prax test`)

      x.resetHead(E(`head`, {}, E(`title`, {}, `test title 0`)))
      t.eq([...document.head.children], prev)
      t.eq(document.title, `test title 0`)

      x.resetHead(E(`head`, {}, E(`title`, {}, `test title 1`)))
      t.eq([...document.head.children], prev)
      t.eq(document.title, `test title 1`)
    })

    t.test(function test_reset_nodes() {
      const nodes0 = [
        E(`meta`, {name: `author`, content: `test author 0`}),
        E(`meta`, {name: `description`, content: `test description 0`}),
      ]
      x.resetHead(E(`head`, {}, ...nodes0))

      t.eq(
        [...document.head.children],
        [...prev, ...nodes0],
      )
      t.eq(document.title, `test title 1`)

      const nodes1 = [
        E(`meta`, {name: `author`, content: `test author 1`}),
        E(`link`, {rel: `icon`, href: `data:;base64,=`}),
      ]
      x.resetHead(E(`head`, {}, E(`title`, {}, `test title 2`), ...nodes1))

      t.eq(
        [...document.head.children],
        [...prev, ...nodes1],
      )
      t.eq(document.title, `test title 2`)
    })
  })

  t.test(function test_ok() {
    x.resetDoc(
      E(`head`, {}, E(`title`, {}, msgOk)),
      E(`body`, x.props(document.body),
        E(`p`, {class: `size-double text-cen`}, msgOk),
      )
    )
  })
  console.log(msgOk)
}
catch (err) {
  console.error(err)
  document.title = msgFail
  document.body.textContent = err.stack
}

function toChildTextTree(node) {
  if (node instanceof Text) return node.textContent
  return [...node.childNodes].map(toChildTextTree)
}

function toPlain(val) {return JSON.parse(JSON.stringify(val))}
