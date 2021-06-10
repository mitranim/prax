import * as x from '../str.mjs'
import {E, F, Raw, doc} from '../str.mjs'
import {is, eq} from './test-utils.mjs'
import {testCommon} from './test-common.mjs'
import {testRcompat} from './test-rcompat.mjs'

Error.stackTraceLimit = Infinity

// "equal markup"
function eqm(str, val) {eq(new Raw(str), val)}

testCommon(x, eqm)
testRcompat(x, eqm)

// Recommendation: prefer `class`.
void function testClassVsClassName() {
  eqm(
    `<div class="one" class="two"></div>`,
    E('div', {class: 'one', className: 'two'}),
  )

  eqm(
    `<div class="one" class="two"></div>`,
    E('div', {className: 'one', class: 'two'}),
  )
}()

// Testing only in Node because browsers ignore this invalid property.
void function testStyleEscaping() {
  eqm(
    `<div style="width: <one>&amp;&quot;</one>;"></div>`,
    E('div', {style: {width: `<one>&"</one>`}}),
  )
}()

// Testing only in Node because:
//   * Wouldn't work in browsers.
//   * Unnecessary in browsers.
void function testChildEscaping() {
  // This horribly breaks inline scripts... which might be a decent default.
  // Users must escape them in an appropriate language-specific way and then
  // use `Raw`. We might be unable to provide a generic solution because
  // script languages/syntaxes are technically an open set. Even just for JS
  // and JSON, the correct way to escape </script> depends on the syntactic
  // context.
  eqm(
    `<script>console.log('&lt;/script&gt;')</script>`,
    E('script', {}, `console.log('</script>')`),
  )

  // This generates broken markup. The test simply demonstrates the possibility.
  // For sane markup, see the corresponding test in the "common" file.
  void function testDontEscapeStringObject() {
    eqm(
      `<outer><<&>></outer>`,
      E('outer', {}, new String(`<<&>>`)),
    )

    eqm(
      `<outer><<&>></outer>`,
      E('outer', {}, new Raw(`<<&>>`)),
    )
  }()
}()

// `str`-specific; in browsers, it's a `DocumentFragment` which doesn't have any
// sensible serialization behavior.
void function testFragment() {
  is(true, F() instanceof Raw)

  eqm(
    `<!doctype html><html>text</html>`,
    F(new Raw(`<!doctype html>`), E('html', {}, 'text')),
  )

  eqm(`&lt;!doctype html&gt;`, F(`<!doctype html>`))
}()

// `str`-specific; in browsers, we're not allowed to construct `DocumentType`.
void function testDoc() {
  is('string', typeof doc())
  is(`<!doctype html>`, doc())
  is(`<!doctype html><html>text</html>`, doc(E('html', {}, 'text')))
}()

console.log('[test] ok!')
