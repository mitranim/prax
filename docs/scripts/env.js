const {Agent, MessageQue, patch} = require('prax')
const {Dom} = require('./features/dom')

export class Env extends Agent {
  init (prevEnv) {
    this.reset({
      ...(prevEnv && prevEnv.deref()),
      mq: new MessageQue(),
      dom: new Dom(this),
    })

    if (prevEnv) {
      prevEnv.swap(patch, {dom: null})
      prevEnv.deinit()
    }

    this.deref().dom.init()
  }
}
