import * as ht from 'http'
import * as afr from 'afr'

const srv = new ht.Server()
const aio = new afr.Aio()

aio.watch('test')
aio.watch('prax.mjs')
aio.serve('test', /^test[/]test.html$/)
aio.serve('.')

srv.listen(57286, onListen)
srv.on('request', aio.handleSiteOr404)

function onListen(err) {
  if (err) throw err
  console.log(`listening on http://localhost:${srv.address().port}/test.html`)
}
