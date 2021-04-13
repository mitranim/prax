import {eq, throws} from './test-utils.mjs'

export function testCommon({E, F, Raw, cls, e}, eqm) {
  throws(E, 'link', {}, null)

  void function testInvalid() {
    void function testInvalidType() {
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
      throws(E, 'div', {class: []})
      throws(E, 'div', {className: []})
      throws(E, 'div', {class: new class {}()})
      throws(E, 'div', {className: new class {}()})
      throws(E, 'div', {class: 10})
      throws(E, 'div', {className: 10})
      throws(E, 'div', {style: 10})
      throws(E, 'div', {style: []})
      throws(E, 'div', {style: new class {}()})
      throws(E, 'div', {dataset: 10})
      throws(E, 'div', {dataset: 'str'})
      throws(E, 'div', {dataset: []})
      throws(E, 'div', {dataset: new class {}()})
      throws(E, 'div', {children: null})
      throws(E, 'div', {children: {}})
      throws(E, 'div', {children: []})
      throws(E, 'div', {children: 'str'})
    }()
  }()

  void function testTagClosing() {
    void function testVoidElems() {
      // See `impl.md`.
      void function testVoidElemsWithChildren() {
        throws(E, 'link', {}, null)
        throws(E, 'link', {}, undefined)
        throws(E, 'link', {}, '')
        throws(E, 'link', {}, [])
        throws(E, 'img',  {}, null)
        throws(E, 'img',  {}, undefined)
        throws(E, 'img',  {}, '')
        throws(E, 'img',  {}, [])
      }()

      void function testEmptyVoidElemSelfClosing() {
        eqm(`<area>`,   E('area'))
        eqm(`<base>`,   E('base'))
        eqm(`<br>`,     E('br'))
        eqm(`<col>`,    E('col'))
        eqm(`<embed>`,  E('embed'))
        eqm(`<hr>`,     E('hr'))
        eqm(`<img>`,    E('img'))
        eqm(`<input>`,  E('input'))
        eqm(`<link>`,   E('link'))
        eqm(`<meta>`,   E('meta'))
        eqm(`<param>`,  E('param'))
        eqm(`<source>`, E('source'))
        eqm(`<track>`,  E('track'))
        eqm(`<wbr>`,    E('wbr'))

        eqm(`<link>`, E('link', {}))
        eqm(`<link>`, E('link', null))
        eqm(`<link>`, E('link', undefined))
      }()
    }()

    void function testNormalElems() {
      eqm(`<div></div>`, E('div'))
      eqm(`<a-elem></a-elem>`, E('a-elem'))
    }()
  }()

  void function testProps() {
    void function testVoidElemAttrs() {
      eqm(
        `<link rel="stylesheet" href="main.css">`,
        E('link', {rel: 'stylesheet', href: 'main.css'}),
      )

      // eqm(
      //   `<input type="num" value="10">`,
      //   E('input', {type: 'num', value: '10'}),
      // )
    }()

    void function testAttrValEncoding() {
      void function testAttrForbiddenStringer() {
        throws(E, 'div', {one: {}})
        throws(E, 'div', {one: new class {}()})
        throws(E, 'div', {}, () => {})
        throws(E, 'div', {}, function fun() {})
        throws(E, 'div', {}, Promise.resolve())

        // Banned specifically in attrs, but allowed in children.
        throws(E, 'div', {one: []})
        throws(E, 'div', {one: new class extends Array {}()})
      }()

      void function testNilEncoding() {
        eqm(`<div></div>`, E('div', {one: null, two: undefined}))
      }()

      void function testPrimEncoding() {
        eqm(
          `<div one="" two="10" three="0" four="false" five="Symbol(&quot;)"></div>`,
          E('div', {one: '', two: '10', three: 0, four: false, five: Symbol(`"`)}),
        )
      }()

      void function testAttrArbitraryStringer() {
        eqm(
          `<div one="https://example.com/"></div>`,
          E('div', {one: new URL(`https://example.com`)}),
        )
      }()

      void function testAttrValEscaping() {
        eqm(
          `<div attr="<one>&amp;&quot;</one>"></div>`,
          E('div', {attr: `<one>&"</one>`}),
        )

        eqm(
          `<outer><inner attr="<one>&amp;&quot;</one>"></inner></outer>`,
          E('outer', {}, E('inner', {attr: `<one>&"</one>`})),
        )
      }()
    }()

    void function testClass() {
      // Recommendation: prefer `class`.
      eqm(`<div class="one"></div>`, E('div', {class:     'one'}))
      eqm(`<div class="one"></div>`, E('div', {className: 'one'}))

      void function testClassEscaping() {
        eqm(
          `<div class="<one>&amp;&quot;</one>"></div>`,
          E('div', {class: `<one>&"</one>`}),
        )
      }()
    }()

    void function testStyle() {
      throws(E, 'div', {style: 10})
      throws(E, 'div', {style: []})
      throws(E, 'div', {style: new Raw()})
      throws(E, 'div', {style: {margin: 10}})

      eqm(
        `<div style="margin: 1rem; padding: 1rem"></div>`,
        E('div', {style: 'margin: 1rem; padding: 1rem'}),
      )

      eqm(
        `<div style="margin: 1rem; padding: 1rem;"></div>`,
        E('div', {style: {margin: '1rem', padding: '1rem'}}),
      )

      void function testStyleNonStrings() {
        throws(E, 'div', {style: {margin: 10}})

        eqm(`<div></div>`, E('div', {style: {margin: null}}))

        eqm(`<div></div>`, E('div', {style: {margin: undefined}}))
      }()

      void function testStyleEscaping() {
        eqm(
          `<div style="<one>&amp;&quot;</one>"></div>`,
          E('div', {style: `<one>&"</one>`}),
        )
      }()
    }()

    void function testDataAttrs() {
      void function testDataAttrsBasic() {
        eqm(`<div></div>`,                  E('div', {'data-one': null}))
        eqm(`<div></div>`,                  E('div', {'data-one': undefined}))
        eqm(`<div data-one=""></div>`,      E('div', {'data-one': ''}))
        eqm(`<div data-one="str"></div>`,   E('div', {'data-one': 'str'}))
        eqm(`<div data-one="0"></div>`,     E('div', {'data-one': 0}))
        eqm(`<div data-one="false"></div>`, E('div', {'data-one': false}))

        eqm(
          `<div data-one="" data-two="0" data-three="false"></div>`,
          E('div', {'data-one': '', 'data-two': 0, 'data-three': false}),
        )
      }()

      void function testDatasetBasic() {
        eqm(`<div></div>`,                  E('div', {dataset: {one: null}}))
        eqm(`<div></div>`,                  E('div', {dataset: {one: undefined}}))
        eqm(`<div data-one=""></div>`,      E('div', {dataset: {one: ''}}))
        eqm(`<div data-one="str"></div>`,   E('div', {dataset: {one: 'str'}}))
        eqm(`<div data-one="0"></div>`,     E('div', {dataset: {one: 0}}))
        eqm(`<div data-one="false"></div>`, E('div', {dataset: {one: false}}))

        eqm(
          `<div data-one="" data-two="0" data-three="false"></div>`,
          E('div', {dataset: {one: '', two: 0, three: false, four: null, five: undefined}}),
        )
      }()

      void function testDatasetPropNameToAttrName() {
        eqm(
          `<div data--one="" data--two-three="" data--f-o-u-r=""></div>`,
          E('div', {dataset: {One: '', TwoThree: '', FOUR: ''}}),
        )
      }()

      void function testDataAttrEscaping() {
        eqm(
          `<div data-attr="<one>&amp;&quot;</one>"></div>`,
          E('div', {'data-attr': `<one>&"</one>`}),
        )
        eqm(
          `<div data-attr="<one>&amp;&quot;</one>"></div>`,
          E('div', {dataset: {attr: `<one>&"</one>`}}),
        )
      }()
    }()

    void function testAriaAttrs() {
      void function testAriaPropsCamel() {
        eqm(
          `<div></div>`,
          E('div', {ariaCurrent: null, ariaChecked: undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {ariaCurrent: 'page', ariaChecked: 'mixed'}),
        )
      }()

      void function testAriaAttrsKebab() {
        eqm(
          `<div></div>`,
          E('div', {'aria-current': null, 'aria-checked': undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {'aria-current': 'page', 'aria-checked': 'mixed'}),
        )
      }()

      void function testAriaMixed() {
        eqm(
          `<div></div>`,
          E('div', {ariaCurrent: null, 'aria-checked': undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {ariaCurrent: 'page', 'aria-checked': 'mixed'}),
        )
      }()

      void function testAriaMultiHumpedCamel() {
        eqm(
          `<a aria-autocomplete="page">text</a>`,
          E('a', {ariaAutoComplete: 'page'}, 'text'),
        )
      }()
    }()

    void function testBoolAttrs() {
      throws(E, 'input', {hidden: ''})
      throws(E, 'input', {hidden: 10})

      eqm(
        `<input type="checkbox" hidden="" autofocus="" disabled="" checked="">`,
        E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: true, checked: true}),
      )

      eqm(
        `<input type="checkbox" disabled="" checked="">`,
        E('input', {type: 'checkbox', hidden: false, autofocus: false, disabled: true, checked: true}),
      )

      eqm(
        `<input type="checkbox" hidden="" autofocus="">`,
        E('input', {type: 'checkbox', hidden: true, autofocus: true, disabled: null, checked: undefined}),
      )
    }()

    void function testAttributesProp() {
      throws(E, 'div', {attributes: {hidden: 10}})

      eqm(
        `<div nonbool="one" hidden=""></div>`,
        E('div', {attributes: {nonbool: 'one', hidden: true, disabled: false}}),
      )

      void function testAttributesPropEscaping() {
        eqm(
          `<div attr="<one>&amp;&quot;</one>"></div>`,
          E('div', {attributes: {attr: `<one>&"</one>`}}),
        )
      }()
    }()

    void function testUnknownWeirdAttrs() {
      eqm(
        `<div one-two="three" four.five="six"></div>`,
        E('div', {'one-two': 'three', 'four.five': 'six'}),
      )
    }()

    void function testMetaAttrs() {
      eqm(`<meta http-equiv="">`, E('meta', {httpEquiv: ''}))

      eqm(`<meta http-equiv="">`, E('meta', {'http-equiv': ''}))

      eqm(
        `<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`,
        E('meta', {httpEquiv: 'X-UA-Compatible', content: 'IE=edge,chrome=1'}),
      )
    }()
  }()

  void function testChildren() {
    void function testChildForbiddenStringer() {
      throws(E, 'div', {}, {})
      throws(E, 'div', {}, new class {}())
      throws(E, 'div', {}, () => {})
      throws(E, 'div', {}, function fun() {})
      throws(E, 'div', {}, Promise.resolve())
    }()

    void function testPrimChildren() {
      eqm(`<div></div>`,            E('div', {}, null))
      eqm(`<div></div>`,            E('div', {}, undefined))
      eqm(`<div>0</div>`,           E('div', {}, 0))
      eqm(`<div>10</div>`,          E('div', {}, 10))
      eqm(`<div>NaN</div>`,         E('div', {}, NaN))
      eqm(`<div>Infinity</div>`,    E('div', {}, Infinity))
      eqm(`<div>-Infinity</div>`,   E('div', {}, -Infinity))
      eqm(`<div>true</div>`,        E('div', {}, true))
      eqm(`<div>false</div>`,       E('div', {}, false))
      eqm(`<div>str</div>`,         E('div', {}, 'str'))
      eqm(`<div>Symbol(sym)</div>`, E('div', {}, Symbol('sym')))

      eqm(
        `<div>010NaNInfinity-InfinitytruefalsestrSymbol(sym)</div>`,
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
          Symbol('sym'),
        ),
      )
    }()

    void function testChildArbitraryStringer() {
      eqm(`<div>https://example.com/</div>`, E('div', {}, new URL(`https://example.com`)))
    }()

    void function testChildFlattening() {
      eqm(
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

    void function testChildEscaping() {
      eqm(
        `<div>&lt;one&gt;&amp;"&lt;/one&gt;</div>`,
        E('div', {}, `<one>&"</one>`),
      )

      eqm(
        `<div>&lt;script&gt;&lt;/script&gt;</div>`,
        E(`div`, {}, `<script></script>`),
      )

      eqm(
        `<outer><inner>&lt;one&gt;&amp;"&lt;/one&gt;</inner></outer>`,
        E('outer', {}, E('inner', {}, `<one>&"</one>`)),
      )

      eqm(
        `<div>Symbol(&lt;script&gt;&lt;/script&gt;)</div>`,
        E(`div`, {}, Symbol(`<script></script>`)),
      )

      void function testDontEscapeStringObject() {
        eqm(
          `<outer><inner>text</inner></outer>`,
          E('outer', {}, new Raw(`<inner>text</inner>`)),
        )
      }()
    }()

    // Fragment's type and structure is different between Node and browsers, and
    // tested separately.
    void function testFragment() {
      void function testFragmentAsChild() {
        eqm(
          `<div>onetwo</div>`,
          E('div', {}, F(null, 'one', undefined, ['two'], [])),
        )

        eqm(
          `<outer><inner>text</inner></outer>`,
          E('outer', {}, F(F(F(E('inner', {}, 'text'))))),
        )
      }()
    }()
  }()

  void function testCls() {
    throws(cls, 0)
    throws(cls, true)
    throws(cls, false)
    throws(cls, {})

    eq('', cls())
    eq('', cls(undefined))
    eq('', cls(null))
    eq('one', cls(null, undefined, 'one'))
    eq('one', cls('one', null, undefined))
    eq('one two three', cls('one', null, ['two', undefined], null, [['three']]))
  }()

  void function testBoundE() {
    eqm(`<div></div>`,                      e('div')())
    eqm(`<div class="one"></div>`,          e('div', {class: 'one'})())
    eqm(`<div class="one">some text</div>`, e('div', {class: 'one'}, 'some text')())
    eqm(`<div class="one">some text</div>`, e('div', {class: 'one'})('some text'))
    eqm(`<div class="one">some text</div>`, e('div')({class: 'one'}, 'some text'))
  }()
}
