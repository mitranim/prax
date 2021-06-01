import * as hs from 'https://deno.land/std@0.97.0/http/server.ts'
import * as a from 'https://unpkg.com/afr@0.3.1/afr_deno.mjs'

const srvOpts = {port: 57286, hostname: 'localhost'}
const dirs = [a.dir('.', /[.](?:html|mjs$)/)]
const bro = new a.Broad()
const srv = hs.serve(srvOpts)

console.log(`[srv] listening on http://${srvOpts.hostname}:${srvOpts.port}/test/test.html`)

watch()
serve()

async function watch() {
  for await (const msg of a.watch('.', dirs)) await bro.send(msg)
}

async function serve() {
  for await (const req of srv) respond(req)
}

async function respond(req) {
  if (await bro.respond(req)) return
  if (await a.serveSiteWithNotFound(req, dirs)) return
  await req.respond({status: 404, body: 'not found'})
}
