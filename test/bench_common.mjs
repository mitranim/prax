import {t} from './lib.mjs'

/*
Placeholder. Needs more benchmarks. A lot of benchmarks and optimizations have
already been done, but those were ad-hoc and not properly recorded.
*/
export function benchCommon(x) {
  const {E} = x

  t.bench(function bench_E_simple() {
    E(`one`, {two: `three`},
      E(`four`, {five: `six`, seven: `eight`, nine: 10},
        E(`eleven`, {twelve: `thirteen`, fourteen: 15, sixteen: true})
      )
    )
  })
}
