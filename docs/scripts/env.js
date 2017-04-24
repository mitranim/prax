const {Atom, Lifecycler, MessageQue, bindAll, derefIn} = require('prax')
const dom = require('./features/dom')

export class Env extends Lifecycler {
  constructor () {
    super()
    bindAll(this)
  }

  onInit (prevEnv) {
    this.mq = new MessageQue()
    this.onDeinit(() => this.mq.deinit())

    this.atom = new Atom(derefIn(prevEnv, ['atom']))
    this.onDeinit(() => this.atom.deinit())

    if (prevEnv) prevEnv.deinit()

    dom.onInit(this)
  }

  send (msg) {
    this.mq.push(this, msg)
  }
}
