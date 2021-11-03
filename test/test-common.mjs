import {eq, throws} from './test-utils.mjs'

export function testCommon(x, eqm) {
  const {E, F, e} = x

  throws(E, 'link', {}, null)

  void function test_invalid() {
    void function test_invalid_type() {
      throws(E)
      throws(E, E)
      throws(E, {})
      throws(E, {toString() {return 'div'}})
    }()

    void function test_invalid_props() {
      throws(E, 'div', 10)
      throws(E, 'div', 'str')
      throws(E, 'div', {fun() {}})
      throws(E, 'div', [])
      throws(E, 'div', E)
      throws(E, 'div', new String())
      throws(E, 'div', new x.Raw())
      throws(E, 'div', {attributes: 10})
      throws(E, 'div', {attributes: 'str'})
      throws(E, 'div', {attributes: []})
      throws(E, 'div', {class: []})
      throws(E, 'div', {className: []})
      throws(E, 'div', {class: {}})
      throws(E, 'div', {className: {}})
      throws(E, 'div', {class: new class {}()})
      throws(E, 'div', {className: new class {}()})
      throws(E, 'div', {class: 10})
      throws(E, 'div', {className: 10})
      throws(E, 'div', {style: 10})
      throws(E, 'div', {style: []})
      throws(E, 'div', {dataset: 10})
      throws(E, 'div', {dataset: 'str'})
      throws(E, 'div', {dataset: []})
      throws(E, 'div', {children: null})
      throws(E, 'div', {children: {}})
      throws(E, 'div', {children: []})
      throws(E, 'div', {children: 'str'})
    }()
  }()

  void function test_tag_closing() {
    void function test_void_elems() {
      // See `impl.md`.
      void function test_void_elems_with_children() {
        throws(E, 'link', {}, null)
        throws(E, 'link', {}, undefined)
        throws(E, 'link', {}, '')
        throws(E, 'link', {}, [])
        throws(E, 'img',  {}, null)
        throws(E, 'img',  {}, undefined)
        throws(E, 'img',  {}, '')
        throws(E, 'img',  {}, [])
      }()

      void function test_empty_void_elem_self_closing() {
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

    void function test_normal_elems() {
      eqm(`<div></div>`, E('div'))
      eqm(`<a-elem></a-elem>`, E('a-elem'))
    }()
  }()

  void function test_props() {
    void function test_void_elem_attrs() {
      eqm(
        `<link rel="stylesheet" href="main.css">`,
        E('link', {rel: 'stylesheet', href: 'main.css'}),
      )

      // eqm(
      //   `<input type="num" value="10">`,
      //   E('input', {type: 'num', value: '10'}),
      // )
    }()

    void function test_attr_val_encoding() {
      void function test_attr_forbidden_stringer() {
        throws(E, 'div', {one: {}})
        throws(E, 'div', {one: new class {}()})
        throws(E, 'div', {}, () => {})
        throws(E, 'div', {}, function fun() {})
        throws(E, 'div', {}, Promise.resolve())

        // Banned specifically in attrs, but allowed in children.
        throws(E, 'div', {one: []})
        throws(E, 'div', {one: new class extends Array {}()})
      }()

      void function test_nil_encoding() {
        eqm(`<div></div>`, E('div', {one: null, two: undefined}))
      }()

      void function test_prim_encoding() {
        eqm(
          `<div one="" two="10" three="0" four="false" five="Symbol(&quot;)"></div>`,
          E('div', {one: '', two: '10', three: 0, four: false, five: Symbol(`"`)}),
        )
      }()

      void function test_attr_arbitrary_stringer() {
        eqm(
          `<div one="https://example.com/"></div>`,
          E('div', {one: new URL(`https://example.com`)}),
        )
      }()

      void function test_attr_val_escaping() {
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

    void function test_class() {
      // Recommendation: prefer `class`.
      eqm(`<div class="one"></div>`, E('div', {class:     'one'}))
      eqm(`<div class="one"></div>`, E('div', {className: 'one'}))

      void function test_class_escaping() {
        eqm(
          `<div class="<one>&amp;&quot;</one>"></div>`,
          E('div', {class: `<one>&"</one>`}),
        )
      }()
    }()

    void function test_style() {
      throws(E, 'div', {style: 10})
      throws(E, 'div', {style: []})
      throws(E, 'div', {style: new x.Raw()})
      throws(E, 'div', {style: {margin: 10}})

      eqm(
        `<div style="margin: 1rem; padding: 1rem"></div>`,
        E('div', {style: 'margin: 1rem; padding: 1rem'}),
      )

      eqm(
        `<div style="margin: 1rem; padding: 1rem;"></div>`,
        E('div', {style: {margin: '1rem', padding: '1rem'}}),
      )

      void function test_style_non_strings() {
        throws(E, 'div', {style: {margin: 10}})

        eqm(`<div></div>`, E('div', {style: {margin: null}}))

        eqm(`<div></div>`, E('div', {style: {margin: undefined}}))
      }()

      void function test_style_escaping() {
        eqm(
          `<div style="<one>&amp;&quot;</one>"></div>`,
          E('div', {style: `<one>&"</one>`}),
        )
      }()
    }()

    void function test_data_attrs() {
      void function test_data_attrs_basic() {
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

      void function test_dataset_basic() {
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

      void function test_dataset_prop_name_to_attr_name() {
        eqm(
          `<div data--one="" data--two-three="" data--f-o-u-r=""></div>`,
          E('div', {dataset: {One: '', TwoThree: '', FOUR: ''}}),
        )
      }()

      void function test_data_attr_escaping() {
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

    void function test_aria_attrs() {
      void function test_aria_props_camel() {
        eqm(
          `<div></div>`,
          E('div', {ariaCurrent: null, ariaChecked: undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {ariaCurrent: 'page', ariaChecked: 'mixed'}),
        )
      }()

      void function test_aria_attrs_kebab() {
        eqm(
          `<div></div>`,
          E('div', {'aria-current': null, 'aria-checked': undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {'aria-current': 'page', 'aria-checked': 'mixed'}),
        )
      }()

      void function test_aria_mixed() {
        eqm(
          `<div></div>`,
          E('div', {ariaCurrent: null, 'aria-checked': undefined}),
        )

        eqm(
          `<a aria-current="page" aria-checked="mixed"></a>`,
          E('a', {ariaCurrent: 'page', 'aria-checked': 'mixed'}),
        )
      }()

      void function test_aria_multi_humped_camel() {
        eqm(
          `<a aria-autocomplete="page">text</a>`,
          E('a', {ariaAutoComplete: 'page'}, 'text'),
        )
      }()
    }()

    void function test_bool_attrs() {
      throws(E, 'input', {hidden: ''})
      throws(E, 'input', {hidden: 10})

      eqm(
        `<input autofocus="" disabled="" hidden="">`,
        E('input', {autofocus: true, disabled: true, hidden: true}),
      )

      eqm(
        `<input disabled="">`,
        E('input', {hidden: false, autofocus: false, disabled: true}),
      )

      eqm(
        `<input hidden="">`,
        E('input', {hidden: true, autofocus: null, disabled: undefined}),
      )
    }()

    void function test_attributes_prop() {
      throws(E, 'div', {attributes: {hidden: 10}})

      eqm(
        `<div nonbool="one" hidden=""></div>`,
        E('div', {attributes: {nonbool: 'one', hidden: true, disabled: false}}),
      )

      void function test_attributes_prop_escaping() {
        eqm(
          `<div attr="<one>&amp;&quot;</one>"></div>`,
          E('div', {attributes: {attr: `<one>&"</one>`}}),
        )
      }()
    }()

    void function test_unknown_weird_attrs() {
      eqm(
        `<div one-two="three" four.five="six"></div>`,
        E('div', {'one-two': 'three', 'four.five': 'six'}),
      )
    }()

    void function test_meta_attrs() {
      eqm(`<meta http-equiv="content-type">`, E('meta', {httpEquiv: 'content-type'}))

      eqm(`<meta http-equiv="content-type">`, E('meta', {'http-equiv': 'content-type'}))

      eqm(
        `<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`,
        E('meta', {httpEquiv: 'X-UA-Compatible', content: 'IE=edge,chrome=1'}),
      )
    }()
  }()

  void function test_children() {
    void function test_child_forbidden_stringer() {
      throws(E, 'div', {}, {})
      throws(E, 'div', {}, new class {}())
      throws(E, 'div', {}, () => {})
      throws(E, 'div', {}, function fun() {})
      throws(E, 'div', {}, Promise.resolve())
    }()

    void function test_prim_children() {
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

    void function test_child_arbitrary_stringer() {
      eqm(`<div>https://example.com/</div>`, E('div', {}, new URL(`https://example.com`)))
    }()

    void function test_child_flattening() {
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

    void function test_child_escaping() {
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

      void function test_dont_escape_string_object() {
        eqm(
          `<outer><inner>text</inner></outer>`,
          E('outer', {}, new x.Raw(`<inner>text</inner>`)),
        )
        eqm(
          `<div><a>one</a><b>two</b><c>three</c></div>`,
          E('div', {}, new x.Raw(`<a>one</a><b>two</b><c>three</c>`)),
        )
      }()
    }()

    // Fragment's type and structure is different between `str.mjs` and
    // `dom.mjs`, and tested separately.
    void function test_fragment() {
      void function test_fragment_as_child() {
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

  void function test_cls() {
    throws(x.cls, true)
    throws(x.cls, {})

    eq('', x.cls())
    eq('', x.cls(null))
    eq('', x.cls(undefined))
    eq('', x.cls(0))
    eq('', x.cls(false))
    eq('one', x.cls(null, undefined, 'one'))
    eq('one', x.cls('one', null, undefined))
    eq('one two three', x.cls('one', null, ['two', undefined], null, [['three']]))
  }()

  void function test_e() {
    eqm(`<div></div>`,                      e('div')())
    eqm(`<div class="one"></div>`,          e('div', {class: 'one'})())
    eqm(`<div class="one">some text</div>`, e('div', {class: 'one'}, 'some text')())
    eqm(`<div class="one">some text</div>`, e('div', {class: 'one'})('some text'))
    eqm(`<div class="one">some text</div>`, e('div')({class: 'one'}, 'some text'))
  }()

  void function test_len() {
    eq(0, x.len())
    eq(0, x.len(undefined))
    eq(0, x.len(null))
    eq(1, x.len(10))
    eq(1, x.len([10]))
    eq(1, x.len([[10]]))
    eq(3, x.len([[10], null, 20, undefined, [[30]]]))
  }()

  void function test_vac() {
    eq(undefined, x.vac(undefined))
    eq(undefined, x.vac(null))
    eq(undefined, x.vac([]))
    eq(undefined, x.vac([[]]))
    eq(undefined, x.vac([[[null]]]))

    eq(0,             x.vac(0))
    eq(false,         x.vac(false))
    eq(NaN,           x.vac(NaN))
    eq([0],           x.vac([0]))
    eq([false],       x.vac([false]))
    eq([NaN],         x.vac([NaN]))
    eq([null, 0],     x.vac([null, 0]))
    eq([null, false], x.vac([null, false]))
    eq([null, NaN],   x.vac([null, NaN]))
  }()

  void function test_map() {
    eq([],                 x.map(undefined, id))
    eq([],                 x.map(null, id))
    eq([],                 x.map([undefined], id))
    eq([],                 x.map([null], id))
    eq([10, 20],           x.map([null, [[[10], 20]], undefined], id))
    eq([[10, 0], [20, 1]], x.map([null, [[[10], 20]], undefined], args))

    throws(x.map)
    throws(x.map, [])

    function id(val) {return val}
    function args(...args) {return args}
  }()

  void function test_merge() {
    eq(undefined, x.merge())
    eq(undefined, x.merge(undefined, null))
    eq({}, x.merge(undefined, {}, null))

    eq(
      {one: 10, two: 20, three: 40},
      x.merge({one: 10, three: 30}, {two: 20, three: 40}),
    )

    eq(
      {one: 10, two: 20, class: `three four`},
      x.merge({one: 10, class: `three`}, {two: 20, class: [`four`]}),
    )

    eq(
      {one: 10, two: 20, className: `three four`},
      x.merge({one: 10, className: `three`}, {two: 20, className: [`four`]}),
    )

    eq(
      {one: 10, two: 20, attributes: {three: 30, four: 40}},
      x.merge({one: 10, attributes: {three: 30}}, {two: 20, attributes: {four: 40}}),
    )

    eq(
      {one: 10, two: 20, dataset: {three: 30, four: 40}},
      x.merge({one: 10, dataset: {three: 30}}, {two: 20, dataset: {four: 40}}),
    )

    eq(
      {one: 10, two: 20, style: {three: 30, four: 40}},
      x.merge({one: 10, style: {three: 30}}, {two: 20, style: {four: 40}}),
    )

    eq(
      {one: 10, two: 20, style: {three: 30}},
      x.merge({one: 10, style: {three: 30}}, {two: 20, style: undefined}),
    )

    eq(
      {one: 10, two: 20, style: {three: 40}},
      x.merge({one: 10, style: undefined}, {two: 20, style: {three: 40}}),
    )

    throws(x.merge, `str`)
    throws(x.merge, 10)
    throws(x.merge, x.merge)
  }()
}
