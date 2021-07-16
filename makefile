MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128

watch:
	$(PAR) test-str-w test-dom-w test-type-w

prep:
	$(PAR) test-str test-type lint

lint:
	deno lint

test-str-w:
	deno run --watch test/test-str.mjs

test-str:
	deno run test/test-str.mjs

test-type-w:
	deno run --config tsconfig.json test/test-type.ts

test-type:
	deno run --config tsconfig.json --watch test/test-type.ts

test-dom-w:
	deno run -A --watch --unstable test/srv.mjs
