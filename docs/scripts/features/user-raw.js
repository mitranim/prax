const {Observable, DeinitDict, call, isFunction, validate, flushBy} = require('prax')

// Don't follow this ugly example!
// This demonstrates the lowest, most primitive way of implementing an observable.
// There are better ways, such as using an Atom.
export class MockUserResource extends Observable {
  constructor (env) {
    super()
    this.env = env
    this.dd = new DeinitDict()

    this.value = undefined
    this.error = null
    this.synced = false
    this.ok = undefined
  }

  get syncing () {
    return Boolean(this.dd.xhr)
  }

  deref () {
    return this
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
        this.synced = true
        this.ok = ok
        if (ok) this.value = body
        this.error = ok ? null : body
        this.trigger()
      })
      .start()

    this.dd.own({xhr})
    this.error = null
    this.trigger()
  }

  stop () {
    this.dd.own({xhr: null})
  }

  deinit () {
    this.dd.deinit()
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
