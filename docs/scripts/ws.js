const {TaskQueAsync, match, assign, bindTo, seq, not, id: exists,
       isString, isFunction, validate} = require('prax')

/**
 * Ws
 */

exports.Ws = Ws
function Ws (url, protocol) {
  validate(isString, url)

  const ws = assign(TaskQueAsync(), {
    nativeWs: null,
    sendBuffer: [],
    url,
    protocol,
    reconnectTimer: null,
    reconnectAttempts: 0,
    maxReconnectInterval: 1000 * 60,
    onopen: null,
    onerror: null,
    onmessage: null,
  })

  return bindTo(ws, Ws)
}

Ws.act = function act (ws, msg) {
  ws.enque(wsActions, msg)
}

Ws.open = function open (ws) {
  ws.act({type: 'open'})
}

Ws.close = function close (ws) {
  ws.act({type: 'close'})
}

Ws.send = function send (ws, msg) {
  ws.act({type: 'send', msg})
}

Ws.flushSendBuffer = function flushSendBuffer (ws) {
  while (ws.nativeWs && ws.sendBuffer.length) {
    ws.nativeWs.send(ws.sendBuffer.shift())
  }
}

Ws.clearNativeWs = function clearNativeWs (ws) {
  if (ws.nativeWs) {
    ws.nativeWs.onclose = null
    ws.nativeWs.close()
    ws.nativeWs = null
  }
}

Ws.clearReconnect = function clearReconnect (ws) {
  clearTimeout(ws.reconnectTimer)
  ws.reconnectTimer = null
  ws.reconnectAttempts = 0
}

Ws.calcReconnectInterval = function calcReconnectInterval (ws) {
  return Math.min(1000 * Math.pow(2, ws.reconnectAttempts), ws.maxReconnectInterval)
}

const wsActions = seq(
  match({nativeWs: not(isWsActive)}, {type: 'open'}, ws => {
    ws.nativeWs = assign(new WebSocket(ws.url, ws.protocol), {
      ws, onopen, onclose, onerror, onmessage
    })
  }),

  match({}, {type: 'close'}, ws => {
    ws.clearNativeWs()
    ws.clearReconnect()
  }),

  match({nativeWs: isWsActive}, {type: 'send'}, (ws, {msg}) => {
    ws.sendBuffer.push(msg)
    ws.flushSendBuffer()
  }),

  match({nativeWs: not(isWsActive)}, {type: 'send'}, (ws, {msg}) => {
    ws.sendBuffer.push(msg)
  }),

  match({reconnectTimer: not(exists)}, {type: 'reconnect'}, ws => {
    ws.reconnectTimer = setTimeout(() => {
      ws.reconnectTimer = null
      ws.act({type: 'open'})
    }, ws.calcReconnectInterval())
    ws.reconnectAttempts += 1
  })
)

// WebSocket listeners

function onopen (event) {
  validatePair.call(this)
  this.ws.clearReconnect()
  if (isFunction(this.ws.onopen)) this.ws.onopen(event)
  this.ws.flushSendBuffer()
}

function onclose () {
  validatePair.call(this)
  this.ws.clearNativeWs()
  this.ws.act({type: 'reconnect'})
}

// This fires:
// when native WS closes (nativeWs.readyState === nativeWs.CLOSED)
// when native WS starts reconnecting (nativeWs.readyState === nativeWs.CONNECTING)
function onerror (event) {
  validatePair.call(this)
  if (isFunction(this.ws.onerror)) this.ws.onerror(event)
}

function onmessage (event) {
  validatePair.call(this)
  if (isFunction(this.ws.onmessage)) this.ws.onmessage(event)
}

/**
 * Utils
 */

function isWsActive (nativeWs) {
  return nativeWs && (
    nativeWs.readyState === nativeWs.OPEN ||
    nativeWs.readyState === nativeWs.CONNECTING
  )
}

function validatePair () {
  if (this.ws.nativeWs !== this) {
    throw Error('Unexpected unpairing of native and synthetic sockets')
  }
}
