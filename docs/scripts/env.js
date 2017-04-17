const {Atom, Lifecycler, DeinitDict, MessageQue, bindAll, derefIn, assign} = require('prax')
const dom = require('./features/dom')
const misc = require('./features/misc')
const {MockUserResource} = require('./features/user-atom')

export class Env extends Lifecycler {
  constructor () {
    super()
    bindAll(this)
    this.dd = new DeinitDict()
  }

  onInit (prevEnv) {
    this.onDeinit(this.dd.deinit)

    const owned = {
      mq: new MessageQue(),
      atom: new Atom(derefIn(prevEnv, ['atom'])),
      user: new MockUserResource(this),
    }

    this.dd.own(owned)
    assign(this, owned)

    if (prevEnv) prevEnv.deinit()

    misc.onInit(this)

    dom.onInit(this)
  }

  send (msg) {
    this.mq.push(this, msg)
  }
}
