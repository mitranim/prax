import {t} from './lib.mjs'

export function testCommon(x, eqm) {
  const {E, F, e} = x

  t.throws(() => E(`link`, {}, null), Error, `unexpected children for void element`)

  t.test(function test_invalid() {
    t.test(function test_invalid_type() {
      t.throws(E,                                    TypeError, `satisfy test`)
      t.throws(() => E(E),                           TypeError, `satisfy test`)
      t.throws(() => E({}),                          TypeError, `satisfy test`)
      t.throws(() => E({toString() {return `div`}}), TypeError, `satisfy test`)
    })

    t.test(function test_invalid_props() {
      t.throws(() => E(`div`, 10),                          TypeError, `satisfy test`)
      t.throws(() => E(`div`, `str`),                       TypeError, `satisfy test`)
      t.throws(() => E(`div`, {fun() {}}),                  TypeError, `not stringable`)
      t.throws(() => E(`div`, []),                          TypeError, `satisfy test`)
      t.throws(() => E(`div`, E),                           TypeError, `satisfy test`)
      t.throws(() => E(`div`, new String()),                TypeError, `satisfy test`)
      t.throws(() => E(`div`, new x.Raw()),                 TypeError, `satisfy test`)
      t.throws(() => E(`div`, {attributes: 10}),            TypeError, `satisfy test`)
      t.throws(() => E(`div`, {attributes: `str`}),         TypeError, `satisfy test`)
      t.throws(() => E(`div`, {attributes: []}),            TypeError, `satisfy test`)
      t.throws(() => E(`div`, {class: []}),                 TypeError, `satisfy test`)
      t.throws(() => E(`div`, {className: []}),             TypeError, `satisfy test`)
      t.throws(() => E(`div`, {class: {}}),                 TypeError, `satisfy test`)
      t.throws(() => E(`div`, {className: {}}),             TypeError, `satisfy test`)
      t.throws(() => E(`div`, {class: new class {}()}),     TypeError, `satisfy test`)
      t.throws(() => E(`div`, {className: new class {}()}), TypeError, `satisfy test`)
      t.throws(() => E(`div`, {class: 10}),                 TypeError, `satisfy test`)
      t.throws(() => E(`div`, {className: 10}),             TypeError, `satisfy test`)
      t.throws(() => E(`div`, {style: 10}),                 TypeError, `style must be string or dict`)
      t.throws(() => E(`div`, {style: []}),                 TypeError, `style must be string or dict`)
      t.throws(() => E(`div`, {dataset: 10}),               TypeError, `satisfy test`)
      t.throws(() => E(`div`, {dataset: `str`}),            TypeError, `satisfy test`)
      t.throws(() => E(`div`, {dataset: []}),               TypeError, `satisfy test`)
      t.throws(() => E(`div`, {children: null}),            Error,     `prax/rcompat.mjs`)
      t.throws(() => E(`div`, {children: {}}),              Error,     `prax/rcompat.mjs`)
      t.throws(() => E(`div`, {children: []}),              Error,     `prax/rcompat.mjs`)
      t.throws(() => E(`div`, {children: `str`}),           Error,     `prax/rcompat.mjs`)
    })
  })

  t.test(function test_tag_closing() {
    t.test(function test_void_elems() {
      // See `impl.md`.
      t.test(function test_void_elems_with_children() {
        t.throws(() => E(`link`, {}, null),      Error, `unexpected children for void element`)
        t.throws(() => E(`link`, {}, undefined), Error, `unexpected children for void element`)
        t.throws(() => E(`link`, {}, ``),        Error, `unexpected children for void element`)
        t.throws(() => E(`link`, {}, []),        Error, `unexpected children for void element`)
        t.throws(() => E(`img`,  {}, null),      Error, `unexpected children for void element`)
        t.throws(() => E(`img`,  {}, undefined), Error, `unexpected children for void element`)
        t.throws(() => E(`img`,  {}, ``),        Error, `unexpected children for void element`)
        t.throws(() => E(`img`,  {}, []),        Error, `unexpected children for void element`)
      })

      t.test(function test_empty_void_elem_self_closing() {
        eqm(E(`area`), `<area>`)
        eqm(E(`base`), `<base>`)
        eqm(E(`br`), `<br>`)
        eqm(E(`col`), `<col>`)
        eqm(E(`embed`), `<embed>`)
        eqm(E(`hr`), `<hr>`)
        eqm(E(`img`), `<img>`)
        eqm(E(`input`), `<input>`)
        eqm(E(`link`), `<link>`)
        eqm(E(`meta`), `<meta>`)
        eqm(E(`param`), `<param>`)
        eqm(E(`source`), `<source>`)
        eqm(E(`track`), `<track>`)
        eqm(E(`wbr`), `<wbr>`)

        eqm(E(`link`, {}), `<link>`)
        eqm(E(`link`, null), `<link>`)
        eqm(E(`link`, undefined), `<link>`)
      })
    })

    t.test(function test_normal_elems() {
      eqm(E(`div`), `<div></div>`)
      eqm(E(`a-elem`), `<a-elem></a-elem>`)
    })
  })

  t.test(function test_props() {
    t.test(function test_void_elem_attrs() {
      eqm(
        E(`link`, {rel: `stylesheet`, href: `main.css`}),
        `<link rel="stylesheet" href="main.css">`,
      )

      // Doesn't work in browsers because `value` doesn't become an attribute.
      // eqm(
      //   E(`input`, {type: `num`, value: `10`}),
      //   `<input type="num" value="10">`,
      // )
    })

    t.test(function test_attr_val_encoding() {
      t.test(function test_attr_verboten_stringer() {
        t.test(function test_mode_strict() {
          t.throws(() => E(`div`, {one: {}}),                  TypeError, `not stringable`)
          t.throws(() => E(`div`, {one: Object.create(null)}), TypeError, `not stringable`)
          t.throws(() => E(`div`, {one: new class {}()}),      TypeError, `not stringable`)
          t.throws(() => E(`div`, {}, () => {}),               TypeError, `not stringable`)
          t.throws(() => E(`div`, {}, function fun() {}),      TypeError, `not stringable`)
          t.throws(() => E(`div`, {}, Promise.resolve()),      TypeError, `not stringable`)

          // Banned specifically in attrs, but allowed in children.
          t.throws(() => E(`div`, {one: []}), TypeError, `not stringable`)
          t.throws(() => E(`div`, {one: new class extends Array {}()}), TypeError, `not stringable`)
        })

        x.lax(true)

        t.test(function test_mode_lax() {
          eqm(E(`div`, {one: {}}), `<div></div>`)
          eqm(E(`div`, {one: Object.create(null)}), `<div></div>`)
          eqm(E(`div`, {one: new class {}()}), `<div></div>`)
          eqm(E(`div`, {}, () => {}), `<div></div>`)
          eqm(E(`div`, {}, function fun() {}), `<div></div>`)
          eqm(E(`div`, {}, Promise.resolve()), `<div></div>`)
          eqm(E(`div`, {one: [10, 20]}), `<div></div>`)
          eqm(E(`div`, {one: new class extends Array {}(10, 20)}), `<div></div>`)
        })

        x.lax(false)
      })

      t.test(function test_nil_encoding() {
        eqm(E(`div`, {one: null, two: undefined}), `<div></div>`)
      })

      t.test(function test_prim_encoding() {
        eqm(
          E(`div`, {one: ``, two: `10`, three: 0, four: false, five: Symbol(`"`)}),
          `<div one="" two="10" three="0" four="false" five="Symbol(&quot;)"></div>`,
        )
      })

      t.test(function test_attr_arbitrary_stringer() {
        eqm(
          E(`div`, {one: new URL(`https://example.com`)}),
          `<div one="https://example.com/"></div>`,
        )
      })

      t.test(function test_attr_val_escaping() {
        eqm(
          E(`div`, {attr: `<one>&"</one>`}),
          `<div attr="<one>&amp;&quot;</one>"></div>`,
        )

        eqm(
          E(`outer`, {}, E(`inner`, {attr: `<one>&"</one>`})),
          `<outer><inner attr="<one>&amp;&quot;</one>"></inner></outer>`,
        )
      })
    })

    t.test(function test_class() {
      // Recommendation: prefer `class`.
      eqm(E(`div`, {class:     `one`}), `<div class="one"></div>`)
      eqm(E(`div`, {className: `one`}), `<div class="one"></div>`)

      t.test(function test_class_escaping() {
        eqm(
          E(`div`, {class: `<one>&"</one>`}),
          `<div class="<one>&amp;&quot;</one>"></div>`,
        )
      })
    })

    t.test(function test_style() {
      t.throws(() => E(`div`, {style: 10}),           TypeError, `style must be string or dict`)
      t.throws(() => E(`div`, {style: []}),           TypeError, `style must be string or dict`)
      t.throws(() => E(`div`, {style: new x.Raw()}),  TypeError, `style must be string or dict`)
      t.throws(() => E(`div`, {style: {margin: 10}}), TypeError, `invalid property "margin": expected 10 to satisfy isString`)

      eqm(
        E(`div`, {style: `margin: 1rem; padding: 1rem`}),
        `<div style="margin: 1rem; padding: 1rem"></div>`,
      )

      eqm(
        E(`div`, {style: {margin: `1rem`, padding: `1rem`}}),
        `<div style="margin: 1rem; padding: 1rem;"></div>`,
      )

      t.test(function test_style_non_strings() {
        t.throws(() => E(`div`, {style: {margin: 10}}), TypeError, `invalid property "margin": expected 10 to satisfy isString`)

        eqm(E(`div`, {style: {margin: null}}), `<div></div>`)

        eqm(E(`div`, {style: {margin: undefined}}), `<div></div>`)
      })

      t.test(function test_style_escaping() {
        eqm(
          E(`div`, {style: `<one>&"</one>`}),
          `<div style="<one>&amp;&quot;</one>"></div>`,
        )
      })
    })

    t.test(function test_data_attrs() {
      t.test(function test_data_attrs_basic() {
        eqm(E(`div`, {'data-one': null}), `<div></div>`)
        eqm(E(`div`, {'data-one': undefined}), `<div></div>`)
        eqm(E(`div`, {'data-one': ``}), `<div data-one=""></div>`)
        eqm(E(`div`, {'data-one': `str`}), `<div data-one="str"></div>`)
        eqm(E(`div`, {'data-one': 0}), `<div data-one="0"></div>`)
        eqm(E(`div`, {'data-one': false}), `<div data-one="false"></div>`)

        eqm(
          E(`div`, {'data-one': ``, 'data-two': 0, 'data-three': false}),
          `<div data-one="" data-two="0" data-three="false"></div>`,
        )
      })

      t.test(function test_dataset_basic() {
        eqm(E(`div`, {dataset: {one: null}}), `<div></div>`)
        eqm(E(`div`, {dataset: {one: undefined}}), `<div></div>`)
        eqm(E(`div`, {dataset: {one: ``}}), `<div data-one=""></div>`)
        eqm(E(`div`, {dataset: {one: `str`}}), `<div data-one="str"></div>`)
        eqm(E(`div`, {dataset: {one: 0}}), `<div data-one="0"></div>`)
        eqm(E(`div`, {dataset: {one: false}}), `<div data-one="false"></div>`)

        eqm(
          E(`div`, {dataset: {one: ``, two: 0, three: false, four: null, five: undefined}}),
          `<div data-one="" data-two="0" data-three="false"></div>`,
        )
      })

      t.test(function test_dataset_prop_name_to_attr_name() {
        eqm(E(`div`, {dataset: {one: ``}}), `<div data-one=""></div>`)
        eqm(E(`div`, {dataset: {One: ``}}), `<div data--one=""></div>`)
        eqm(E(`div`, {dataset: {oneTwo: ``}}), `<div data-one-two=""></div>`)
        eqm(E(`div`, {dataset: {OneTwo: ``}}), `<div data--one-two=""></div>`)
        eqm(E(`div`, {dataset: {oneTWO: ``}}), `<div data-one-t-w-o=""></div>`)
        eqm(E(`div`, {dataset: {OneTWO: ``}}), `<div data--one-t-w-o=""></div>`)
        eqm(E(`div`, {dataset: {ONE: ``}}), `<div data--o-n-e=""></div>`)
      })

      t.test(function test_data_attr_escaping() {
        eqm(
          E(`div`, {'data-attr': `<one>&"</one>`}),
          `<div data-attr="<one>&amp;&quot;</one>"></div>`,
        )
        eqm(
          E(`div`, {dataset: {attr: `<one>&"</one>`}}),
          `<div data-attr="<one>&amp;&quot;</one>"></div>`,
        )
      })
    })

    t.test(function test_aria_attrs() {
      t.test(function test_aria_props_camel() {
        eqm(
          E(`div`, {ariaCurrent: null, ariaChecked: undefined}),
          `<div></div>`,
        )

        eqm(
          E(`a`, {ariaCurrent: `page`, ariaChecked: `mixed`}),
          `<a aria-current="page" aria-checked="mixed"></a>`,
        )
      })

      t.test(function test_aria_attrs_kebab() {
        eqm(
          E(`div`, {'aria-current': null, 'aria-checked': undefined}),
          `<div></div>`,
        )

        eqm(
          E(`a`, {'aria-current': `page`, 'aria-checked': `mixed`}),
          `<a aria-current="page" aria-checked="mixed"></a>`,
        )
      })

      t.test(function test_aria_mixed() {
        eqm(
          E(`div`, {ariaCurrent: null, 'aria-checked': undefined}),
          `<div></div>`,
        )

        eqm(
          E(`a`, {ariaCurrent: `page`, 'aria-checked': `mixed`}),
          `<a aria-current="page" aria-checked="mixed"></a>`,
        )
      })

      t.test(function test_aria_multi_humped_camel() {
        eqm(
          E(`a`, {ariaAutoComplete: `page`}, `text`),
          `<a aria-autocomplete="page">text</a>`,
        )
      })
    })

    t.test(function test_bool_attrs() {
      t.throws(() => E(`input`, {hidden: ``}), TypeError, `invalid property "hidden": expected "" to satisfy isBool`)
      t.throws(() => E(`input`, {hidden: 10}), TypeError, `invalid property "hidden": expected 10 to satisfy isBool`)

      eqm(
        E(`input`, {autofocus: true, disabled: true, hidden: true}),
        `<input autofocus="" disabled="" hidden="">`,
      )

      eqm(
        E(`input`, {hidden: false, autofocus: false, disabled: true}),
        `<input disabled="">`,
      )

      eqm(
        E(`input`, {hidden: true, autofocus: null, disabled: undefined}),
        `<input hidden="">`,
      )
    })

    t.test(function test_attributes_prop() {
      t.throws(() => E(`div`, {attributes: {hidden: 10}}), TypeError, `invalid property "hidden": expected 10 to satisfy isBool`)

      eqm(
        E(`div`, {attributes: {nonbool: `one`, hidden: true, disabled: false}}),
        `<div nonbool="one" hidden=""></div>`,
      )

      t.test(function test_attributes_prop_escaping() {
        eqm(
          E(`div`, {attributes: {attr: `<one>&"</one>`}}),
          `<div attr="<one>&amp;&quot;</one>"></div>`,
        )
      })
    })

    t.test(function test_unknown_weird_attrs() {
      eqm(
        E(`div`, {'one-two': `three`, 'four.five': `six`}),
        `<div one-two="three" four.five="six"></div>`,
      )
    })

    t.test(function test_meta_attrs() {
      eqm(E(`meta`, {httpEquiv: `content-type`}), `<meta http-equiv="content-type">`)

      eqm(E(`meta`, {'http-equiv': `content-type`}), `<meta http-equiv="content-type">`)

      eqm(
        E(`meta`, {httpEquiv: `X-UA-Compatible`, content: `IE=edge,chrome=1`}),
        `<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">`,
      )
    })
  })

  t.test(function test_children() {
    t.test(function test_child_verboten_stringer() {
      t.test(function test_mode_strict() {
        t.throws(() => E(`div`, {}, {}),                  TypeError, `not stringable`)
        t.throws(() => E(`div`, {}, Object.create(null)), TypeError, `not stringable`)
        t.throws(() => E(`div`, {}, new class {}()),      TypeError, `not stringable`)
        t.throws(() => E(`div`, {}, () => {}),            TypeError, `not stringable`)
        t.throws(() => E(`div`, {}, function fun() {}),   TypeError, `not stringable`)
        t.throws(() => E(`div`, {}, Promise.resolve()),   TypeError, `not stringable`)
      })

      x.lax(true)

      t.test(function test_mode_lax() {
        eqm(E(`div`, {}, {}), `<div></div>`)
        eqm(E(`div`, {}, Object.create(null)), `<div></div>`)
        eqm(E(`div`, {}, new class {}()), `<div></div>`)
        eqm(E(`div`, {}, () => {}), `<div></div>`)
        eqm(E(`div`, {}, function fun() {}), `<div></div>`)
        eqm(E(`div`, {}, Promise.resolve()), `<div></div>`)
      })

      x.lax(false)
    })

    t.test(function test_prim_children() {
      eqm(E(`div`, {}, null), `<div></div>`)
      eqm(E(`div`, {}, undefined), `<div></div>`)
      eqm(E(`div`, {}, 0), `<div>0</div>`)
      eqm(E(`div`, {}, 10), `<div>10</div>`)
      eqm(E(`div`, {}, NaN), `<div>NaN</div>`)
      eqm(E(`div`, {}, Infinity), `<div>Infinity</div>`)
      eqm(E(`div`, {}, -Infinity), `<div>-Infinity</div>`)
      eqm(E(`div`, {}, true), `<div>true</div>`)
      eqm(E(`div`, {}, false), `<div>false</div>`)
      eqm(E(`div`, {}, `str`), `<div>str</div>`)
      eqm(E(`div`, {}, Symbol(`sym`)), `<div>Symbol(sym)</div>`)

      eqm(
        E(`div`, {},
          null,
          undefined,
          0,
          10,
          NaN,
          Infinity,
          -Infinity,
          true,
          false,
          `str`,
          Symbol(`sym`),
        ),
        `<div>010NaNInfinity-InfinitytruefalsestrSymbol(sym)</div>`,
      )
    })

    t.test(function test_child_arbitrary_stringer() {
      eqm(E(`div`, {}, new URL(`https://example.com`)), `<div>https://example.com/</div>`)
    })

    t.test(function test_child_flattening() {
      eqm(
        E(`outer`, {},
          undefined,
          [[[]]],
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
          `five`,
        ),
        `<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`,
      )

      eqm(
        E(`outer`, {}, gen(
          undefined,
          gen(gen(gen([]))),
          gen(gen(gen(`one`))),
          gen(
            null,
            E(`mid`, {}, gen(
              undefined,
              gen(`two`, gen(E(`inner`, {}, gen(gen([`three`]), undefined)))),
              null,
              [`four`],
            )),
          ),
          `five`,
        )),
        `<outer>one<mid>two<inner>three</inner>four</mid>five</outer>`,
      )
    })

    t.test(function test_child_escaping() {
      eqm(
        E(`div`, {}, `<one>&"</one>`),
        `<div>&lt;one&gt;&amp;"&lt;/one&gt;</div>`,
      )

      eqm(
        E(`div`, {}, `<script></script>`),
        `<div>&lt;script&gt;&lt;/script&gt;</div>`,
      )

      eqm(
        E(`outer`, {}, E(`inner`, {}, `<one>&"</one>`)),
        `<outer><inner>&lt;one&gt;&amp;"&lt;/one&gt;</inner></outer>`,
      )

      eqm(
        E(`div`, {}, Symbol(`<script></script>`)),
        `<div>Symbol(&lt;script&gt;&lt;/script&gt;)</div>`,
      )

      t.test(function test_dont_escape_string_object() {
        eqm(
          E(`outer`, {}, new x.Raw(`<inner>text</inner>`)),
          `<outer><inner>text</inner></outer>`,
        )
        eqm(
          E(`div`, {}, new x.Raw(`<a>one</a><b>two</b><c>three</c>`)),
          `<div><a>one</a><b>two</b><c>three</c></div>`,
        )
      })
    })

    // Fragment's type and structure is different between `str.mjs` and
    // `dom.mjs`, and tested separately.
    t.test(function test_fragment() {
      t.test(function test_fragment_as_child() {
        eqm(
          E(`div`, {}, F(null, `one`, undefined, [`two`], [])),
          `<div>onetwo</div>`,
        )

        eqm(
          E(`outer`, {}, F(F(F(E(`inner`, {}, `text`))))),
          `<outer><inner>text</inner></outer>`,
        )
      })
    })
  })

  t.test(function test_cls() {
    t.throws(() => x.cls(true), TypeError, `satisfy test isString`)
    t.throws(() => x.cls({}),   TypeError, `satisfy test isString`)

    t.is(x.cls(), ``)
    t.is(x.cls(null), ``)
    t.is(x.cls(undefined), ``)
    t.is(x.cls(0), ``)
    t.is(x.cls(false), ``)
    t.is(x.cls(null, undefined, `one`), `one`)
    t.is(x.cls(`one`, null, undefined), `one`)
    t.is(x.cls(`one`, null, [`two`, undefined], null, [[`three`]]), `one two three`)
  })

  t.test(function test_e() {
    eqm(e(`div`)(), `<div></div>`)
    eqm(e(`div`, {class: `one`})(), `<div class="one"></div>`)
    eqm(e(`div`, {class: `one`}, `some text`)(), `<div class="one">some text</div>`)
    eqm(e(`div`, {class: `one`})(`some text`), `<div class="one">some text</div>`)
    eqm(e(`div`)({class: `one`}, `some text`), `<div class="one">some text</div>`)
  })

  t.test(function test_len() {
    t.is(x.len(), 0)
    t.is(x.len(undefined), 0)
    t.is(x.len(null), 0)
    t.is(x.len(10), 1)
    t.is(x.len([10]), 1)
    t.is(x.len([[10]]), 1)
    t.is(x.len([[10], null, 20, undefined, [[30]]]), 3)
  })

  t.test(function test_vac() {
    t.is(x.vac(undefined), undefined)
    t.is(x.vac(null), undefined)
    t.is(x.vac([]), undefined)
    t.is(x.vac([[]]), undefined)
    t.is(x.vac([[[null]]]), undefined)

    t.is(x.vac(0), undefined)
    t.is(x.vac(false), undefined)
    t.is(x.vac(NaN), undefined)
    t.is(x.vac([0]), undefined)
    t.is(x.vac([false]), undefined)
    t.is(x.vac([NaN]), undefined)
    t.is(x.vac([null, 0]), undefined)
    t.is(x.vac([null, false]), undefined)
    t.is(x.vac([null, NaN]), undefined)

    t.is(x.vac(10), 10)
    t.is(x.vac(true), true)
    t.eq(x.vac([10]), [10])
    t.eq(x.vac([true]), [true])
    t.eq(x.vac([null, 10]), [null, 10])
    t.eq(x.vac([null, true]), [null, true])
  })

  t.test(function test_map() {
    t.eq(x.map(undefined, id), [])
    t.eq(x.map(null, id), [])
    t.eq(x.map([undefined], id), [])
    t.eq(x.map([null], id), [])
    t.eq(x.map([null, [[[10], 20]], undefined], id), [10, 20])
    t.eq(x.map([null, [[[10], 20]], undefined], args), [[10, 0], [20, 1]])

    t.throws(x.map, TypeError, `satisfy test isFun`)
    t.throws(() => x.map([]), TypeError, `satisfy test isFun`)

    function id(val) {return val}
    function args(...args) {return args}
  })

  t.test(function test_merge() {
    t.is(x.merge(), undefined)
    t.is(x.merge(undefined, null), undefined)
    t.eq(x.merge(undefined, {}, null), {})

    t.eq(
      x.merge({one: 10, three: 30}, {two: 20, three: 40}),
      {one: 10, two: 20, three: 40},
    )

    t.eq(
      x.merge({one: 10, class: `three`}, {two: 20, class: [`four`]}),
      {one: 10, two: 20, class: `three four`},
    )

    t.eq(
      x.merge({one: 10, className: `three`}, {two: 20, className: [`four`]}),
      {one: 10, two: 20, className: `three four`},
    )

    t.eq(
      x.merge({one: 10, attributes: {three: 30}}, {two: 20, attributes: {four: 40}}),
      {one: 10, two: 20, attributes: {three: 30, four: 40}},
    )

    t.eq(
      x.merge({one: 10, dataset: {three: 30}}, {two: 20, dataset: {four: 40}}),
      {one: 10, two: 20, dataset: {three: 30, four: 40}},
    )

    t.eq(
      x.merge({one: 10, style: {three: 30}}, {two: 20, style: {four: 40}}),
      {one: 10, two: 20, style: {three: 30, four: 40}},
    )

    t.eq(
      x.merge({one: 10, style: {three: 30}}, {two: 20, style: undefined}),
      {one: 10, two: 20, style: {three: 30}},
    )

    t.eq(
      x.merge({one: 10, style: undefined}, {two: 20, style: {three: 40}}),
      {one: 10, two: 20, style: {three: 40}},
    )

    t.throws(() => x.merge(`str`),   TypeError, `satisfy test isStruct`)
    t.throws(() => x.merge(10),      TypeError, `satisfy test isStruct`)
    t.throws(() => x.merge(x.merge), TypeError, `satisfy test isStruct`)
  })

  t.test(function test_lax() {
    t.no(x.lax())
    t.no(x.lax())
    t.ok(x.lax(true))
    t.ok(x.lax())
    t.no(x.lax(false))
    t.no(x.lax())

    t.throws(() => x.lax(`true`),  TypeError, `satisfy test isBool`)
    t.throws(() => x.lax(`false`), TypeError, `satisfy test isBool`)
    t.throws(() => x.lax(0),       TypeError, `satisfy test isBool`)
    t.throws(() => x.lax(1),       TypeError, `satisfy test isBool`)
    t.throws(() => x.lax([]),      TypeError, `satisfy test isBool`)
    t.throws(() => x.lax({}),      TypeError, `satisfy test isBool`)

    t.no(x.lax())
  })
}

function* gen(...vals) {for (const val of vals) yield val}
