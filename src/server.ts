import express from "express"
import http from "http"
import WebSocket from "ws"
import { AddressInfo } from "net"
import { callHandlerEveryN } from "@app/utils"
import { PORT, MESSAGES_PER_SECOND } from "@app/config"
import { MumbleInstance } from "@app/client/mumble"
import fs from "fs"
import { pipeline } from "stream"
// const ffmpeg = require("./lib/ffmpeg")

const app = express()

http.globalAgent.keepAlive = true
const server = http.createServer(app)

app.use(express.static("audio"))

app.get("/audio/:channel/:user/:sessionId", function (req, res) {
  const { channel, user, sessionId } = req.params
  const filePath = `./audio/${channel}/${user}/${sessionId}`
  const stat = fs.statSync(filePath)

  res.writeHead(200, {
    "Content-Type": "audio/mpeg",
    "Content-Length": stat.size
  })

  const readStream = fs.createReadStream(filePath)
  pipeline(readStream, res, () => {})
})

const wss = new WebSocket.Server({ server })
const adminMumble = new MumbleInstance()

adminMumble.connect({})

const mumbleConnect = async (mumble: any, message: any) => {
  await mumble.connect({
    name: message?.user?.name || String("Anonymous" + Math.random()),
    pass: message?.pass,
    channel: message?.channel
  })
}

wss.on("connection", function (ws: any) {
  console.log("Socket connected")
  const mumble = new MumbleInstance()
  let destroy: any

  ws.on("message", async function (_message: any) {
    const message =
      typeof _message === "string" ? JSON.parse(_message) : _message
    const name = message?.name

    // Connect to Channel and authenticate
    if (name === "Connect") {
      await mumbleConnect(mumble, message)

      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            data: {
              name: mumble.currentChannel.name,
              description: mumble.currentChannel.description,
              id: mumble.currentChannel.id,
              sessionId: mumble.connection.session,
              users: mumble?.getUsersInChannel || []
            },
            type: "active-channel"
          })
        )

        const detectUsers = () => {
          ws.send(
            JSON.stringify({
              data: {
                name: mumble.currentChannel.name,
                description: mumble.currentChannel.description,
                id: mumble.currentChannel.id,
                sessionId: mumble.connection.session as any,
                users: mumble?.getUsersInChannel || []
              },
              type: "channel-users"
            })
          )
        }

        destroy = callHandlerEveryN(detectUsers, MESSAGES_PER_SECOND)
      }
    }

    if (name === "Disconnect") {
      typeof destroy === "function" && destroy()
      destroy = null
      mumble.disconnect()

      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            data: [],
            type: "channel-users"
          })
        )
      }
    }

    // Create Channel
    if (name === "CreateChannel") {
      if (ws.readyState === 1) {
        // TODO: follow channel interface at name property
        const channelName = message?.channel
        adminMumble.createChannel(channelName)

        await mumbleConnect(mumble, {
          ...message,
          channel: { name: channelName }
        })

        ws.send(
          JSON.stringify({
            data: {
              name: mumble.currentChannel.name,
              description: mumble.currentChannel.description,
              id: mumble.currentChannel.id,
              sessionId: mumble.connection.session as any
            },
            type: "active-channel"
          })
        )

        const detectUsers = () => {
          ws.send(
            JSON.stringify({
              data: mumble?.getUsersInChannel || [],
              type: "channel-users"
            })
          )
        }

        destroy = callHandlerEveryN(detectUsers, MESSAGES_PER_SECOND)
      }
    }

    if (name === "Speak") {
      if (ws.readyState === 1) {
        if (message?.data) {
          // todo: chunk buffer into 40ms segments to smoothen audio
          const messageBuffer = Buffer.from(message.data, "base64")
          mumble.connection.sendVoice(messageBuffer)
        }
      }
    }

    // Get Channels
    if (name === "Channels") {
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            data: Object.values(adminMumble.flatChannels),
            type: "channels"
          })
        )
      }
    }
  })

  ws.on("close", function () {
    mumble.disconnect()
    if (destroy) {
      destroy()
      destroy = null
    }
  })
})

const application = server.listen(PORT, function () {
  console.log("Listening on %d", (application.address() as AddressInfo).port)
})

export default application
