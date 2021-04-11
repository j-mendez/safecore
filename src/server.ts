import express from "express"
import http from "http"
import WebSocket from "ws"
import { AddressInfo } from "net"
import { callHandlerEveryN } from "@app/utils"
import { PORT, MESSAGES_PER_SECOND } from "@app/config"
import { MumbleInstance } from "@app/client/mumble"

const app = express()

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const adminMumble = new MumbleInstance()

adminMumble.connect({})

wss.on("connection", function (ws: any) {
  console.log("Socket connected")
  const mumble = new MumbleInstance()
  let destroy: any

  ws.on("message", async function (_message: any) {
    const message =
      typeof _message === "string" ? JSON.parse(_message) : _message
    const name = message?.name

    // Connection to Channel
    if (name === "Connect") {
      await mumble.connect({
        name: message?.user?.name || String("Anonymous" + Math.random()),
        pass: message?.pass,
        channel: message?.channel
      })
      if (ws.readyState === 1) {
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
        const channelName = message?.channel
        adminMumble.createChannel(channelName)

        await mumble.connect({
          name: message?.user?.name || String("Anonymous" + Math.random()),
          pass: message?.pass,
          channel: {
            name: channelName
          }
        })

        ws.send(
          JSON.stringify({
            data: {
              name: mumble.currentChannel.name,
              description: mumble.currentChannel.description,
              id: mumble.currentChannel.id
            },
            type: "create-channel"
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
