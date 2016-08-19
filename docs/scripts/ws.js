const {assign, bindTo, isFunction} = require('prax')

/**
 * Thin wrapper around native `WebSocket` with automatic reconnect and offline
 * buffering
 */

export function Ws (url, protocol) {
  const ws = bindTo({
    // Non-standard properties
    nativeWs: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    sendBuffer: [],

    // Standard properties
    url,
    protocol,

    // Proxies for standard event handlers
    onclose: null,
    onerror: null,
    onmessage: null,
    onopen: null
  }, {
    // Proxies for standard methods
    close,
    send
  })

  open(ws)

  return ws
}

function open (ws) {
  if (ws.nativeWs) ws.close()
  ws.nativeWs = assign(new WebSocket(ws.url, ws.protocol), {
    ws, onclose, onerror, onmessage, onopen
  })
}

function close (ws) {
  const {onclose} = ws.nativeWs
  ws.nativeWs.onclose = ws.onclose && ws.onclose.bind(ws)
  try {ws.nativeWs.close()}
  finally {ws.nativeWs.onclose = onclose}
}

function send ({nativeWs, sendBuffer}, msg) {
  if (nativeWs.readyState === nativeWs.OPEN) nativeWs.send(msg)
  else sendBuffer.push(msg)
}

function scheduleRetry (ws) {
  clearTimeout(ws.reconnectTimer)

  ws.reconnectTimer = setTimeout(() => {
    ws.reconnectAttempts++
    try {open(ws)}
    catch (err) {
      scheduleRetry(ws)
      throw err
    }
  }, reconnectInterval(ws.reconnectAttempts))
}

function reconnectInterval (times) {
  return 1000 * (
    times < 10
    ? 1
    : times < 20
    ? 10
    : times < 30
    ? 60
    : times < 40
    ? 60 * 10
    : 60 * 60
  )
}

function clearRetry (ws) {
  clearTimeout(ws.reconnectTimer)
  ws.reconnectAttempts = 0
}

function onclose () {
  const {ws} = this
  scheduleRetry(ws)
  if (isFunction(ws.onclose)) ws.onclose(...arguments)
}

function onerror () {
  if (isFunction(this.ws.onerror)) this.ws.onerror(...arguments)
}

function onmessage () {
  if (isFunction(this.ws.onmessage)) this.ws.onmessage(...arguments)
}

function onopen () {
  const {ws} = this
  clearRetry(ws)
  if (isFunction(ws.onopen)) ws.onopen(...arguments)
  while (ws.sendBuffer.length) {
    ws.send(ws.sendBuffer.shift())
  }
}
