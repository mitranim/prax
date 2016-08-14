const React = require('react')
const {putIn} = require('prax')

export function Root (props, {read, env}) {
  console.log('-- rendering Root')

  return (
    <div>
      <pre>{JSON.stringify(read(), null, 2)}</pre>
      <button onClick={() => env.send(['inc'])}>
        increment
      </button>
      <button onClick={() => env.send(['dec'])}>
        decrement
      </button>
      <button onClick={() => env.send(['net/user/sync'])}>
        load user
      </button>
      <Input path={['text']} />
    </div>
  )
}

function Input ({path}, {read, env}) {
  console.log('-- rendering Input')

  return (
    <input value={read(...path) || ''}
           onChange={event => env.swap(putIn, path, event.target.value)}
           />
  )
}
