MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128
DENO := deno run --reload --unstable --allow-hrtime
RUN := $(if $(run),--run "$(run)",)
VERB := $(if $(filter $(verb),true),-v,)
TEST_STR := test/test_str.ts $(VERB) $(RUN)
BENCH_STR := test/bench_str.mjs $(VERB) $(RUN)

watch:
	$(PAR) test_str_w test_dom_w

prep:
	$(PAR) test_str lint

lint_w:
	watchexec -r -d=0 -e=mjs,ts -n -- $(MAKE) lint

lint:
	deno lint --rules-exclude=no-empty,require-yield

test_str_w:
	$(DENO) --watch $(TEST_STR)

test_str:
	$(DENO) $(TEST_STR)

test_dom_w:
	$(DENO) --no-check --watch -A test/srv.mjs

bench_w:
	$(DENO) --no-check --watch $(BENCH_STR)

bench:
	$(DENO) --no-check $(BENCH_STR)
