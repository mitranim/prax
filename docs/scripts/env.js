const {Agent, MessageQue} = require('espo')
const {patch} = require('emerge')
const {Dom} = require('./features/dom')

export class Env extends Agent {
  constructor(prevEnv) {
    super()
    this.reset({
      ...(prevEnv && prevEnv.deref()),
      mq: new MessageQue(),
      dom: new Dom(this),
    })
  }

  init() {
    this.deref().dom.init()
  }

  deinit() {
    // Views may react to deiniting, they should die first
    try {this.swap(patch, {dom: null})}
    finally {super.deinit()}
  }
}
