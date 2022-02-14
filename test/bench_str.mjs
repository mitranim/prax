import {t} from './lib.mjs'
import {benchCommon} from './bench_common.mjs'
import * as s from '../str.mjs'
import * as d from '../dom.mjs'

const cli = t.Args.os()
t.conf.benchFilterFrom(cli.get(`run`))
t.conf.verb = cli.bool(`v`)
t.conf.benchRep = t.ConsoleAvgReporter.with(t.tsNano)

benchCommon(s)

t.bench(function bench_camelToKebab() {
  d.camelToKebab(`oneTwoThreeFour`)
})

t.bench(function bench_camelToKebab_cached() {
  s.cached(s.styleKeys, `oneTwoThreeFour`, d.camelToKebab)
})

t.bench(function bench_clsTag() {
  d.clsTag(Array)
})

t.deopt()
t.benches()
