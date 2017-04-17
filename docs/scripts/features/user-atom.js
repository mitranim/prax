const {Atom, DeinitDict, patch, derefIn, call, isFunction, validate, flushBy} = require('prax')

export class MockUserResource extends Atom {
  constructor (env) {
    super({value: undefined, error: undefined, syncing: false, synced: false, ok: undefined})
    this.env = env
    this.dd = new DeinitDict()
  }

  onInit () {
    // console.info('initing User, syncing')
    this.sync({name: 'placeholder'})
  }

  onDeinit () {
    this.value = undefined
    this.dd.deinit()
  }

  sync (mockResult) {
    if (this.dd.xhr) return

    const xhr = new MockXhr({url: 'user', mockResult})
      .onDone(({result: {ok, body}}) => {
        this.dd.own({xhr: null})
        this.swap(patch, {
          syncing: false,
          synced: true,
          ok,
          value: ok ? body : derefIn(this, ['value']),
          error: ok ? null : body,
        })
      })
      .start()

    this.dd.own({xhr})
    this.swap(patch, {syncing: true, error: null})
  }

  stop () {
    this.dd.own({xhr: null})
  }
}

class MockXhr {
  constructor (params) {
    this.state = this.states.IDLE
    this.params = params
    this.callbacks = []
    this.timer = null
  }

  onDone (fun) {
    validate(isFunction, fun)
    if (this.state === this.states.DONE) fun(this)
    else this.callbacks.push(fun)
    return this
  }

  start () {
    if (this.state !== this.states.IDLE) return this
    this.state = this.states.PENDING
    this.timer = setTimeout(() => {
      this.timer = null
      this.state = this.states.DONE
      this.result = {ok: true, reason: 'load', body: this.params.mockResult}
      flushBy(this.callbacks, call, this)
    }, 1000)
    return this
  }

  deinit () {
    clearTimeout(this.timer)
    this.timer = null

    if (this.state === this.states.PENDING) {
      this.state = this.states.DONE
      this.result = {ok: false, reason: 'abort'}
      flushBy(this.callbacks, call, this)
    }
  }
}

MockXhr.prototype.states = {
  IDLE: 'IDLE',
  PENDING: 'PENDING',
  DONE: 'DONE',
}
