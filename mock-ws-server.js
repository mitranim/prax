'use strict'

const {createServer} = require('http')
const WebSocketServer = require('websocket').server
const {log} = require('gulp-util')
const {append, remove} = require('./')

const port = 7687

const server = createServer((request, response) => {
  log(`Received request for ${request.url}`)
  response.writeHead(404)
  response.end()
})

server.listen(port, () => {
  log(`Server listening on port ${port}`)
})

const wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
})

function originIsAllowed(_origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true
}

let connections = []

wsServer.on('request', request => {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject()
    log(`Connection from origin ${request.origin} rejected.`)
    return
  }

  const connection = request.accept('', request.origin)

  connections = append(connections, connection)

  log(`Accepted connection from origin: ${request.origin}.`)

  connection.on('message', msg => {
    if (msg.type === 'utf8') {
      log(`Received message: ${msg.utf8Data}`)
      broadcastText(connections, msg.utf8Data, connection)
    }
    else if (msg.type === 'binary') {
      log(`Received binary message of ${msg.binaryData.length} bytes.`)
      // connection.sendBinary(msg.binaryData)
    }
  })

  connection.on('close', (reasonCode, _description) => {
    connections = remove(connections, connection)
    log(`Peer ${connection.remoteAddress} disconnected.`)
  })
})

function broadcastText (connections, text, origin) {
  const clients = remove(connections, origin)
  log(`Broadcasting to ${clients.length} clients.`)
  clients.forEach(connection => {
    connection.sendUTF(text)
  })
}

// Broadcast from REPL
process.stdin.on('data', buf => {
  broadcastText(connections, String(buf).trim())
})
