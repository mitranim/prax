import {TaskQueAsync, bindTo, assign, not, ifonly, id as exists, seq, testArgsAnd,
        isFunction, isString, validate} from 'prax'

/**
 * Ws
 */

export function Ws (url, protocol) {
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
    onclose: null,
    onerror: null,
    onmessage: null,
    actions: Ws.actions,
  })

  return bindTo(ws, Ws)
}

Ws.act = function act (ws, msg) {
  ws.enque(seq(...ws.actions), msg)
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

Ws.sendJSON = function sendJSON (ws, msg) {
  ws.send(JSON.stringify(msg))
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

Ws.actions = [
  matchTwo({nativeWs: not(isWsActive)}, {type: 'open'}, ws => {
    if (ws.nativeWs) ws.clearNativeWs()
    ws.nativeWs = assign(new WebSocket(ws.url, ws.protocol), {
      ws, onopen, onclose, onerror, onmessage
    })
  }),

  matchTwo({}, {type: 'close'}, ws => {
    ws.clearNativeWs()
    ws.clearReconnect()
  }),

  matchTwo({nativeWs: isWsOpen}, {type: 'send'}, (ws, {msg}) => {
    ws.sendBuffer.push(msg)
    ws.flushSendBuffer()
  }),

  matchTwo({nativeWs: not(isWsOpen)}, {type: 'send'}, (ws, {msg}) => {
    ws.sendBuffer.push(msg)
  }),

  matchTwo({reconnectTimer: not(exists)}, {type: 'reconnect'}, ws => {
    ws.reconnectTimer = setTimeout(() => {
      ws.reconnectTimer = null
      ws.act({type: 'open'})
    }, ws.calcReconnectInterval())
    ws.reconnectAttempts += 1
  })
]

// WebSocket listeners

function onopen (event) {
  validatePair.call(this)
  this.ws.clearReconnect()
  try {
    if (isFunction(this.ws.onopen)) this.ws.onopen(event)
  } finally {
    this.ws.flushSendBuffer()
  }
}

function onclose (event) {
  validatePair.call(this)
  try {
    if (isFunction(this.ws.onclose)) this.ws.onclose(event)
  } finally {
    this.ws.act({type: 'reconnect'})
    this.ws.clearNativeWs()
  }
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

// WTB better name
function matchTwo (testA, testB, fun) {
  return ifonly(testArgsAnd(testA, testB), fun)
}

function isWsOpen (nativeWs) {
  return nativeWs && nativeWs.readyState === nativeWs.OPEN
}

function isWsActive (nativeWs) {
  return nativeWs && (
    isWsOpen(nativeWs) || nativeWs.readyState === nativeWs.CONNECTING
  )
}

function validatePair () {
  if (this.ws.nativeWs !== this) {
    throw Error('Unexpected unpairing of native and synthetic sockets')
  }
}
