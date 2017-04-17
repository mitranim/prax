const React = require('react')
const {PraxComponent, putIn} = require('prax')
const {jsonEncode} = require('./utils')

export class Root extends PraxComponent {
  subrender ({derefIn}) {
    const {env} = this
    // console.info('rendering Root')
    const path = derefIn(env.atom, ['path']) || []
    const showUser = derefIn(env.atom, ['showUser'])

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
          <button onClick={() => env.atom.swap(putIn, ['showUser'], !showUser)}>
            {showUser ? `hide "user"` : `show "user"`}
          </button>
        </div>
        {showUser ?
        <UserState /> : null}
        <div>
          <span>Greeting: <Input path={['greeting']} /></span>
        </div>
      </div>
    )
  }
}

class State extends PraxComponent {
  subrender ({derefIn}) {
    const {env, props: {path}} = this
    // console.info('rendering State with path:', path)

    return (
      <pre>{JSON.stringify(derefIn(env.atom, path), null, 2)}</pre>
    )
  }
}

class UserState extends PraxComponent {
  subrender ({derefIn}) {
    const {env} = this
    const value = derefIn(env.user, ['value'])
    const syncing = derefIn(env.user, ['syncing'])

    return (
      <div>
        {value ?
        <pre>{JSON.stringify(value, null, 2)}</pre> : null}
        <button
          onClick={() => env.user.sync({name: 'Mira'})}
          disabled={derefIn(env.user, ['syncing'])}>
          {syncing ? `"syncing"...` : `"sync user"`}
        </button>
        {syncing ?
        <button
          onClick={() => env.user.stop()}>
          stop
        </button> : null}
      </div>
    )
  }
}

class Input extends PraxComponent {
  subrender ({derefIn}) {
    const {env, props: {path}} = this
    // console.info('rendering Input with path:', path)

    return (
      <input
        value={derefIn(env.atom, path) || ''}
        onChange={event => {
          env.atom.swap(putIn, path, event.target.value)
        }}
        />
    )
  }
}
