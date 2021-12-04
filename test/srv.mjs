/* global Deno */

import * as a from 'https://deno.land/x/afr@0.4.1/afr.mjs'

const srvOpts = {port: 57286, hostname: 'localhost'}
const dirs = [a.dir('.', /[.](?:html|mjs$)/)]
const bro = new a.Broad()
const lis = Deno.listen(srvOpts)

console.log(`[srv] listening on http://${srvOpts.hostname}:${srvOpts.port}/test/test.html`)

watch()
listen(lis)

async function watch() {
  for await (const msg of a.watch('.', dirs)) await bro.send(msg)
}

async function listen(lis) {
  for await (const conn of lis) {
    serve(conn).catch(a.logErr)
  }
}

async function serve(conn) {
  for await (const event of Deno.serveHttp(conn)) {
    event.respondWith(response(event.request)).catch(a.logErr)
  }
}

async function response(req) {
  const {pathname} = new URL(req.url)
  if (pathname.startsWith(`/Users`)) return a.resExactFile(pathname)

  return (
    await bro.res(req) ||
    (await a.resSiteWithNotFound(req, dirs)) ||
    new Response('not found', {status: 404})
  )
}
