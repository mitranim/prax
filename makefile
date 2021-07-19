MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128
DENO := deno run --config tsconfig.json

watch:
	$(PAR) test-str-w test-dom-w lint-w

prep:
	$(PAR) test-str lint

lint-w:
	watchexec -r -d=0 -e=mjs,ts -n -- make lint

lint:
	deno lint

test-str-w:
	$(DENO) --watch test/test-str.ts

test-str:
	$(DENO) test/test-str.ts

test-dom-w:
	$(DENO) -A --watch --unstable test/srv.mjs
