import {t} from './lib.mjs'
import {testCommon} from './test_common.mjs'
import {testRcompat} from './test_rcompat.mjs'
import * as x from '../str.mjs'
import {E, F, Raw, doc} from '../str.mjs'

// deno-lint-ignore no-explicit-any
(Error as any).stackTraceLimit = Infinity

// Short for "equal markup".
function eqm(val: Raw, str: string) {t.eq(val, new Raw(str))}

testCommon(x, eqm)
testRcompat(x, eqm)

// Recommendation: prefer `class`.
t.test(function testClassVsClassName() {
  eqm(
    E('div', {class: 'one', className: 'two'}),
    `<div class="one" class="two"></div>`,
  )

  eqm(
    E('div', {className: 'one', class: 'two'}),
    `<div class="one" class="two"></div>`,
  )
})

// Testing only in "str" because browsers ignore this invalid style property.
t.test(function testStyleEscaping() {
  eqm(
    E('div', {style: {width: `<one>&"</one>`}}),
    `<div style="width: <one>&amp;&quot;</one>;"></div>`,
  )
})

// Testing only in "str" because:
//   * Wouldn't work in browsers.
//   * Unnecessary in browsers.
t.test(function testChildEscaping() {
  // This horribly breaks inline scripts... which might be a decent default.
  // Users must escape them in an appropriate language-specific way and then
  // use `Raw`. We might be unable to provide a generic solution because
  // script languages/syntaxes are technically an open set. Even just for JS
  // and JSON, the correct way to escape </script> depends on the syntactic
  // context.
  eqm(
    E('script', {}, `console.log('</script>')`),
    `<script>console.log('&lt;/script&gt;')</script>`,
  )

  // This generates broken markup. The test simply demonstrates the possibility.
  // For sane markup, see the corresponding test in the "common" file.
  t.test(function testDontEscapeStringObject() {
    eqm(
      E('outer', {}, new Raw(`<<&>>`)),
      `<outer><<&>></outer>`,
    )
  })
})

// `str`-specific; in browsers, it's a `DocumentFragment` which doesn't have any
// sensible serialization behavior.
t.test(function testFragment() {
  t.is(true, F() instanceof Raw)

  eqm(
    F(new Raw(`<!doctype html>`), E('html', {}, 'text')),
    `<!doctype html><html>text</html>`,
  )

  eqm(F(`<!doctype html>`), `&lt;!doctype html&gt;`)
})

// `str`-specific; in browsers, this is a pass-through.
t.test(function testDoc() {
  t.is('string', typeof doc(undefined))
  t.is(`<!doctype html>`, doc(undefined))
  t.is(`<!doctype html>`, doc(``))
  t.is(`<!doctype html><html>text</html>`, doc(E('html', {}, 'text')))
})

console.log('[test] ok!')
