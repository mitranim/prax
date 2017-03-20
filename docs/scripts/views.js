const React = require('react')
const {putIn} = require('prax')
const {jsonEncode} = require('./utils')

export function Root (props, {root: {send}, read}) {
  // console.info('rendering Root')

  const path = read('path') || []

  return (
    <div className='children-margin-1-v'>
      <div>
        <span>State at path: <code>{jsonEncode(path)}</code></span>
      </div>
      <State path={path} />
      <div>
        <button onClick={() => send(['inc'])}>
          increment
        </button>
        <button onClick={() => send(['dec'])}>
          decrement
        </button>
        <button onClick={() => send(['net/user/sync'])}>
          "load user"
        </button>
      </div>
      <div>
        <span>Greeting: <Input path={['greeting']} /></span>
      </div>
    </div>
  )
}

function State ({path}, {read}) {
  // console.info('rendering State with path:', path)

  return (
    <pre>{JSON.stringify(read(...path), null, 2)}</pre>
  )
}

function Input ({path}, {root: {store}, read}) {
  // console.info('rendering Input with path:', path)

  return (
    <input value={read(...path) || ''}
           onChange={event => store.swap(putIn, path, event.target.value)}
           />
  )
}
