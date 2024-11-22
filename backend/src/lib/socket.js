import { Server } from "socket.io"
import http from "http"
import express from "express"

const app = express()

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
})

export const getReceiverSocketId = (userId) => {
  return connectedUsers.get(userId)
}

const connectedUsers = new Map()

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`)

  const userId = socket.handshake.query.userId

  if (userId) {
    connectedUsers.set(userId, socket.id)
  }

  io.emit("connectedUsers", Array.from(connectedUsers.keys()))

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`)
    connectedUsers.delete(userId)
    io.emit("connectedUsers", Array.from(connectedUsers.keys()))
  })
})

export { io, server, app }
