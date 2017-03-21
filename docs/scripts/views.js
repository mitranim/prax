const React = require('react')
const {putIn, PraxComponent} = require('prax')
const {jsonEncode} = require('./utils')
const {env} = require('./env')

export class Root extends PraxComponent {
  subrender ({read}) {
    // console.info('rendering Root')
    const path = read(env.store, ['path']) || []

    return (
      <div className='children-margin-1-v'>
        <div>
          <span>State at path: <code>{jsonEncode(path)}</code></span>
        </div>
        <State path={path} />
        <div>
          <button onClick={() => env.send(['inc'])}>
            increment
          </button>
          <button onClick={() => env.send(['dec'])}>
            decrement
          </button>
          <button onClick={() => env.send(['net/user/sync'])}>
            "load user"
          </button>
        </div>
        <div>
          <span>Greeting: <Input path={['greeting']} /></span>
        </div>
        <Mock />
      </div>
    )
  }
}

class State extends PraxComponent {
  subrender ({read}) {
    const {props: {path}} = this
    // console.info('rendering State with path:', path)

    return (
      <pre>{JSON.stringify(read(env.store, path), null, 2)}</pre>
    )
  }
}

class Input extends PraxComponent {
  subrender ({read}) {
    const {props: {path}} = this
    // console.info('rendering Input with path:', path)

    return (
      <input value={read(env.store, path) || ''}
             onChange={event => {
               env.store.swap(putIn, path, event.target.value)
             }}
             />
    )
  }
}

class Mock extends PraxComponent {
  subrender ({read}) {
    return (
      <pre className='children-margin-1-v'>
        <div>read(env.store, ['one']): {read(env.store, ['one'])}</div>
        <div>read(env.store, ['ten']): {read(env.store, ['ten'])}</div>
      </pre>
    )
  }
}
