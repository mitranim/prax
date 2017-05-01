const {Agent, MessageQue, unwrap, deinit} = require('prax')
const {Dom} = require('./features/dom')

export class Env extends Agent {
  init (prevEnv) {
    this.reset({
      ...unwrap(prevEnv),
      mq: new MessageQue(),
      dom: new Dom(this),
    })

    deinit(prevEnv)

    this.deref().dom.init()
  }
}
