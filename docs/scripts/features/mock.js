const {getIn, putIn, putInBy, inc, dec, val, ifelse, id, isFinite, on} = require('prax')

export function preinit (_root, _onDeinit) {
  return {
    state: {
      count: 1,
      greeting: 'Hello world!',
      path: [],
    },

    effects: [
      on(['inc'], root => {
        root.store.swap(putInBy, ['count'], ifelse(isFinite, inc, val(1)))
      }),

      on(['dec'], root => {
        root.store.swap(putInBy, ['count'], ifelse(isFinite, dec, val(1)))
      }),

      on(['alert', id], (root, [, key, msg]) => (
        root.store.swap(putIn, ['alerts', key], msg)
      )),

      on(['alert/clear'], root => {
        root.store.swap(denotify)
      }),

      on(['net/user/sync'], root => {
        root.store.swap(loadUser, root)
      }),

      on(['net/user/done'], (root, [, data]) => {
        console.info('loaded user:', data)
        root.store.swap(putIn, ['user'], data)
        root.send(['net/user/drop'])
      }),

      on(['net/user/drop'], root => {
        root.store.swap(clearUserXhr)
      }),
    ]
  }
}

function loadUser (state, root) {
  if (getIn(state, ['http', 'user'])) {
    console.info('skipping loading user')
    return state
  }

  console.info('decided to load user')
  return putIn(state, ['http', 'user'], mockLoadUser(root))
}

function mockLoadUser (root) {
  const timer = setTimeout(() => {
    root.send(['net/user/done', {id: 'one', name: 'Miranda'}])
  }, 500)

  return Object.create(new XMLHttpRequest(), {
    abort: {value () {clearTimeout(timer)}},
  })
}

function clearUserXhr (state) {
  if (!getIn(state, ['http', 'user'])) {
    console.info('no user request to abort')
    return state
  }

  console.info('clearing user request')
  return putInBy(state, ['http', 'user'], abort)
}

function abort (xhr) {
  if (xhr && xhr.abort) xhr.abort()
  return null
}

export function denotify (state) {
  return putIn(state, ['alerts'], null)
}

export function notify (state, key, msg) {
  return putIn(state, ['alerts', key], msg)
}
