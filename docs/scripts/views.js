const React = require('react')

/**
 * Reactive views as pure functions.
 */

export function State (props, read) {
  return (
    <pre className='pad hljs'>{JSON.stringify(read(), null, 2)}</pre>
  )
}

export function Profile (props, read) {
  return (
    <div>
      <p>profiles: {JSON.stringify(read('profiles'))}</p>
    </div>
  )
}

/**
 * Reactive view written in class style.
 */

export const KeyCode = {
  render (props, read) {
    return (
      <div>
        <p>last pressed key's code: {read('keyCode')}</p>
      </div>
    )
  }
}
