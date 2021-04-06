import * as x from '../prax.mjs'
import {E, cls} from '../prax.mjs'
import {is, eq, throws} from './test-utils.mjs'

Object.assign(window, x)

try {
  void function testBasicMarkup() {
    void function testInvalid() {
      void function testInvalidTag() {
        throws(E)
        throws(E, E)
        throws(E, {})
        throws(E, {toString() {return 'div'}})
      }()

      void function testInvalidProps() {
        throws(E, 'div', 10)
        throws(E, 'div', 'str')
        throws(E, 'div', [])
        throws(E, 'div', E)
        throws(E, 'div', new String())
        throws(E, 'div', new class {}())
        throws(E, 'div', {attributes: 10})
        throws(E, 'div', {attributes: 'str'})
        throws(E, 'div', {attributes: []})
        throws(E, 'div', {attributes: new class {}()})
        throws(E, 'div', {class: 10})
        throws(E, 'div', {class: new class {}()})
        throws(E, 'div', {class: []})
        throws(E, 'div', {style: 10})
        throws(E, 'div', {style: []})
        throws(E, 'div', {style: new class {}()})
        throws(E, 'div', {style: {width: 10}})
        throws(E, 'div', {dataset: 10})
        throws(E, 'div', {dataset: 'str'})
        throws(E, 'div', {dataset: []})
        throws(E, 'div', {dataset: new class {}()})
        throws(E, 'div', {className: 'str'})
        throws(E, 'div', {styles: 'str'})
        throws(E, 'div', {styles: {}})
        throws(E, 'div', {'http-equiv': 'str'})
        throws(E, 'div', {'data-val': 'str'})
        throws(E, 'div', {'aria-label': 'str'})
      }()
    }()

    void function testVoidElements() {
      asHtml(`<link>`, E('link'))

      asHtml(
        `<link rel="stylesheet" type="text/css" href="/styles/main.css">`,
        E('link', {rel: 'stylesheet', type: 'text/css', href: '/styles/main.css'}),
      )
    }()

    void function testBasicElements() {
      asHtml(`<div></div>`, E('div'))

      asHtml(
        `<out class="outer"><mid class="middle"><in class="inner"></in></mid></out>`,
        E('out', {class: 'outer'},
          E('mid', {class: 'middle'},
            E('in', {class: 'inner'}),
          ),
        ),
      )
    }()
  }()

  void function testPrimitiveChildren() {
    asHtml(
      `<div>010NaNInfinity-Infinitytruefalsestr</div>`,
      E('div', {},
        null,
        undefined,
        0,
        10,
        NaN,
        Infinity,
        -Infinity,
        true,
        false,
        'str',
      ),
    )
  }()

  void function testChildFlattening() {
    asHtml(
      `<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`,
      E('outer', {},
        undefined,
        [[[]]],
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
        'five',
      ),
    )
  }()

  // Unlike the Node version, the browser version prefers to assign props
  // rather than attributes, and allows arbitrary JS values for many of them.
  // Some well-known props/attrs, like `class`, are special-cased.
  void function testPropAssignment() {
    const node = E('div', {class: 'cls', unknown: 10})
    asHtml(`<div class="cls"></div>`, node)
    is(10, node.unknown)
  }()

  // This helps verify that our Node escaping is consistent with browsers.
  // Our browser implementation uses only `document.createElement` and
  // `new Text`, and never needs to escape text.
  void function testSsrTextEscaping() {
    is(
      `<one>&"</one>`,
      E('div', {}, `<one>&"</one>`).textContent,
    )

    asHtml(
      `<div>&lt;one&gt;&amp;"&lt;/one&gt;</div>`,
      E('div', {}, new String(`<one>&"</one>`)),
    )

    asHtml(
      `<outer><inner>&lt;one&gt;&amp;"&lt;/one&gt;</inner></outer>`,
      E('outer', {}, E('inner', {}, `<one>&"</one>`)),
    )
  }()

  // This helps verify that our Node escaping is consistent with browsers.
  // Our browser implementation uses only `.setAttribute`, and never needs
  // to escape text.
  void function testSsrAttrEscaping() {
    is(
      `<one>&"</one>`,
      E('div', {attributes: {attr: `<one>&"</one>`}}).attributes.attr.value,
    )

    asHtml(
      `<div attr="<one>&amp;&quot;</one>"></div>`,
      E('div', {attributes: {attr: `<one>&"</one>`}}),
    )

    asHtml(
      `<outer><inner attr="<one>&amp;&quot;</one>"></inner></outer>`,
      E('outer', {}, E('inner', {attributes: {attr: `<one>&"</one>`}})),
    )
  }()

  void function testStyle() {
    asHtml(
      `<div style="margin: 1rem; padding: 1rem"></div>`,
      E('div', {style: 'margin: 1rem; padding: 1rem'}),
    )

    asHtml(
      `<div style="margin: 1rem; padding: 1rem;"></div>`,
      E('div', {style: {margin: '1rem', padding: '1rem'}}),
    )
  }()

  void function testDataset() {
    asHtml(
      `<div data-one="two" data--three-four="five">content</div>`,
      E('div', {dataset: {one: 'two', ThreeFour: 'five', six: undefined, seven: null}}, 'content'),
    )

    throws(E, 'div', {'data-one': 'one'})
    throws(E, 'div', {dataset: {one: 10}})
  }()

  void function testAria() {
    asHtml(
      `<a aria-current="page">text</a>`,
      E('a', {ariaCurrent: 'page'}, 'text'),
    )

    asHtml(
      `<a aria-autocomplete="page">text</a>`,
      E('a', {ariaAutoComplete: 'page'}, 'text'),
    )

    throws(E, 'div', {'aria-current': 'page'})
  }()

  void function testBoolAttrs() {
    // Unlike our Node implementation, browsers don't seem to serialize `checked`.
    is(true, E('input', {type: 'checkbox', checked: true}).checked)
    is(false, E('input', {type: 'checkbox', checked: false}).checked)

    asHtml(
      `<input type="checkbox" hidden="" autofocus="" disabled="">`,
      E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: true}),
    )

    asHtml(
      `<input type="checkbox" disabled="">`,
      E('input', {type: 'checkbox', hidden: false, autofocus: false, disabled: true}),
    )
    is(true, E('input', {type: 'checkbox', checked: true}).checked)

    asHtml(
      `<input type="checkbox" hidden="" autofocus="">`,
      E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: null}),
    )

    throws(E, 'input', {hidden: ''})
    throws(E, 'input', {hidden: 10})
  }()

  // `attributes` is meaningless in Node, but potentially useful in browsers.
  // Supported in both for consistency.
  void function testAttributesEscapeHatch() {
    asHtml(
      `<div nonbool="one" hidden=""></div>`,
      E('div', {attributes: {nonbool: 'one', hidden: true, disabled: false}}),
    )

    throws(E, 'div', {attributes: {one: 10}})
    throws(E, 'div', {attributes: {one: true}})
    throws(E, 'div', {attributes: {hidden: 10}})
  }()

  void function testMeta() {
    asHtml(
      `<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`,
      E('meta', {httpEquiv: 'X-UA-Compatible', content: 'IE=edge,chrome=1'}),
    )

    throws(E, 'meta', {'http-equiv': 'X-UA-Compatible'})
  }()

  void function testCls() {
    eq('', cls())
    eq('', cls(undefined))
    eq('', cls(null))
    eq('one', cls(null, undefined, 'one'))
    eq('one', cls('one', null, undefined))
    eq('one two three', cls('one', null, ['two', undefined], null, [['three']]))

    throws(cls, 0)
    throws(cls, true)
    throws(cls, false)
    throws(cls, {})
  }()

  void function testOk() {
    x.reset(document.body, {},
      E('p', {class: 'size-double'}, '[test] ok!'),
    )
  }()
}
catch (err) {
  console.error(err)
  document.body.appendChild(new Text(err.stack))
}

function asHtml(str, node) {
  is(str, node.outerHTML)
}
