import express from "express"
import http from "http"
import WebSocket from "ws"
import { AddressInfo } from "net"
import { callHandlerEveryN, mumbleConnect, parseMessage } from "@app/utils"
import { PORT, MESSAGES_PER_SECOND } from "@app/config"
import { MumbleInstance } from "@app/client/mumble"
import { getMp3 } from "./streams/get-mp3"

const app = express()

const server = http.createServer(app)

app.use(express.static("audio"))

app.get("/audio/:channel/:user/:sessionId", getMp3)

const wss = new WebSocket.Server({ server })
const adminMumble = new MumbleInstance()

adminMumble.connect({})

wss.on("connection", function (ws: any) {
  console.log("Socket connected")
  const mumble = new MumbleInstance()
  // destroy handle
  let destroy: any
  let destroyChannels: any

  ws.on("message", async function (_message: any) {
    const message = parseMessage(_message)
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
              sessionId: mumble.connection?.session,
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
                sessionId: mumble.connection?.session,
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
        const channelName = message?.channel.name
        adminMumble.createChannel(message?.channel)

        await mumbleConnect(mumble, {
          ...message,
          channel: {
            name: channelName,
            description: message?.channel.description
          }
        })

        ws.send(
          JSON.stringify({
            data: {
              name: mumble.currentChannel.name,
              description: mumble.currentChannel.description,
              id: mumble.currentChannel.id,
              sessionId: mumble.connection?.session
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
        const getAllChannels = () => {
          ws.send(
            JSON.stringify({
              data: Object.values(adminMumble.flatChannels),
              type: "channels"
            })
          )
        }
        getAllChannels()

        destroyChannels = callHandlerEveryN(
          getAllChannels,
          MESSAGES_PER_SECOND * 5
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
    if (destroyChannels) {
      destroyChannels()
      destroyChannels = null
    }
  })
})

const application = server.listen(PORT, function () {
  console.log("Listening on %d", (application.address() as AddressInfo).port)
})

export default application
