MAKEFLAGS := --silent --always-make
PAR := $(MAKE) -j 128

watch:
	$(PAR) test-str-w test-dom-w

prep:
	$(PAR) test-str lint

lint:
	deno lint

test-str-w:
	deno run --watch test/test-str.mjs

test-str:
	deno run test/test-str.mjs

test-dom-w:
	deno run --allow-net --allow-read --watch test/srv.mjs
