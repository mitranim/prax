import {E, Raw, cls} from '../node.mjs'
import {eq, throws} from './test-utils.mjs'

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
      throws(E, 'div', {fun() {}})
      throws(E, 'div', [])
      throws(E, 'div', E)
      throws(E, 'div', new Raw())
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
      throws(E, 'div', {style: {padding: 10}})
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

      // Node-only.
      throws(E, 'div', {unknown: 10})
    }()
  }()

  void function testVoidElements() {
    eq(new Raw(`<area>`), E('area'))
    eq(new Raw(`<base>`), E('base'))
    eq(new Raw(`<br>`), E('br'))
    eq(new Raw(`<col>`), E('col'))
    eq(new Raw(`<embed>`), E('embed'))
    eq(new Raw(`<hr>`), E('hr'))
    eq(new Raw(`<img>`), E('img'))
    eq(new Raw(`<input>`), E('input'))
    eq(new Raw(`<link>`), E('link'))
    eq(new Raw(`<meta>`), E('meta'))
    eq(new Raw(`<param>`), E('param'))
    eq(new Raw(`<source>`), E('source'))
    eq(new Raw(`<track>`), E('track'))
    eq(new Raw(`<wbr>`), E('wbr'))

    eq(new Raw(`<link>`), E('link', {}))
    eq(new Raw(`<link>`), E('link', undefined))
    eq(new Raw(`<link>`), E('link', null))

    eq(
      new Raw(`<link rel="stylesheet" src="main.css">`),
      E('link', {rel: 'stylesheet', src: 'main.css'}),
    )

    eq(
      new Raw(`<input type="num" value="10">`),
      E('input', {type: 'num', value: '10'}),
    )

    throws(eq, `<link>`, E('link'))
    throws(E, 'link', 'inner text instead of props')
    throws(E, 'link', {}, 'inner text in void element')
  }()

  void function testNormalElements() {
    eq(new Raw(`<div></div>`), E('div'))

    eq(
      new Raw(`<a-elem class="some-class">some text</a-elem>`),
      E('a-elem', {class: 'some-class'}, 'some text'),
    )
  }()
}()

// Known inconsistency: this allows symbols, but browser `new Text(val)` does not.
void function testPrimitiveChildren() {
  eq(
    new Raw(`<div>010NaNInfinity-Infinitytruefalsestr</div>`),
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
  eq(
    new Raw(`<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`),
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

void function testTextEscaping() {
  void function testEscapePrimitiveString() {
    eq(
      new Raw(`<div>&lt;one&gt;&amp;"&lt;/one&gt;</div>`),
      E('div', {}, `<one>&"</one>`),
    )
  }()

  void function testDontEscapeStringObject() {
    eq(
      new Raw(`<outer><<&>></outer>`),
      E('outer', {}, new String(`<<&>>`)),
    )
    eq(
      new Raw(`<outer><<&>></outer>`),
      E('outer', {}, new Raw(`<<&>>`)),
    )
  }()

  eq(
    new Raw(`<outer><inner>&lt;one&gt;&amp;"&lt;/one&gt;</inner></outer>`),
    E('outer', {}, E('inner', {}, `<one>&"</one>`)),
  )
}()

void function testAttrEscaping() {
  eq(
    new Raw(`<div attr="<one>&amp;&quot;</one>"></div>`),
    E('div', {attr: `<one>&"</one>`}),
  )

  eq(
    new Raw(`<outer><inner attr="<one>&amp;&quot;</one>"></inner></outer>`),
    E('outer', {}, E('inner', {attr: `<one>&"</one>`})),
  )
}()

void function testStyle() {
  eq(
    new Raw(`<div style="margin: 1rem; padding: 1rem"></div>`),
    E('div', {style: 'margin: 1rem; padding: 1rem'}),
  )

  eq(
    new Raw(`<div style="margin: 1rem; padding: 1rem"></div>`),
    E('div', {style: {margin: '1rem', padding: '1rem'}}),
  )
}()

void function testDataset() {
  eq(
    new Raw(`<div data-one="two" data--three-four="five">content</div>`),
    E('div', {dataset: {one: 'two', ThreeFour: 'five', six: undefined, seven: null}}, 'content'),
  )

  throws(E, 'div', {'data-one': 'one'})
  throws(E, 'div', {dataset: {one: 10}})
}()

void function testAria() {
  eq(
    new Raw(`<a aria-current="page">text</a>`),
    E('a', {ariaCurrent: 'page'}, 'text'),
  )

  eq(
    new Raw(`<a aria-autocomplete="page">text</a>`),
    E('a', {ariaAutoComplete: 'page'}, 'text'),
  )

  throws(E, 'div', {'aria-current': 'page'})
}()

void function testBoolAttrs() {
  eq(
    new Raw(`<input type="checkbox" hidden autofocus disabled checked>`),
    E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: true, checked: true}),
  )

  eq(
    new Raw(`<input type="checkbox" disabled checked>`),
    E('input', {type: 'checkbox', hidden: false, autofocus: false, disabled: true, checked: true}),
  )

  eq(
    new Raw(`<input type="checkbox" hidden autofocus>`),
    E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: null, checked: undefined}),
  )

  throws(E, 'input', {hidden: ''})
  throws(E, 'input', {hidden: 10})
}()

// `attributes` is meaningless in Node, but potentially useful in browser.
// Supported in both for consistency.
void function testAttributesEscapeHatch() {
  eq(
    new Raw(`<div nonbool="one" hidden></div>`),
    E('div', {attributes: {nonbool: 'one', hidden: true, disabled: false}}),
  )

  throws(E, 'div', {attributes: {one: 10}})
  throws(E, 'div', {attributes: {one: true}})
  throws(E, 'div', {attributes: {hidden: 10}})
}()

void function testMeta() {
  eq(
    new Raw(`<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`),
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

console.log('[test] ok!')
