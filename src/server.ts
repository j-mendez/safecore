import express from "express"
import http from "http"
import WebSocket from "ws"
import { AddressInfo } from "net"

import { buildReactTemplateStream, callHandlerEveryN } from "@app/utils"
import { PORT, MESSAGES_PER_SECOND } from "@app/config"
import { MumbleInstance, MumbleData } from "@app/client/mumble"

const app = express()

app.get("*", function (req, res) {
  buildReactTemplateStream(res)
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const adminMumble = new MumbleInstance()

adminMumble.connect({})

wss.on("connection", function (ws) {
  console.log("Socket connected")
  const mumble = new MumbleInstance()
  let destroy

  ws.on("message", async function (_message) {
    const message =
      typeof _message === "string" ? JSON.parse(_message) : _message
    const name = message?.name

    // Connection to Channel
    if (name === "Connect") {
      const uname = message?.user?.name || String("Anonymous" + Math.random())
      await mumble.connect({
        name: uname,
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
        ws.send(
          JSON.stringify({ data: MumbleData.getChannels, type: "channels" })
        )
      }
    }

    // Get Channels
    if (name === "Channels") {
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            data: Object.values(MumbleData.channels),
            type: "channels"
          })
        )
      }
    }

    // TODO: Hard Audio Stream
    // if (name === "Stream") {
    //   destroy = callHandlerEveryN(function () {
    //     if (ws.readyState === 1) {
    //       ws.send(
    //         JSON.stringify({
    //           id: Math.floor(Math.random() * NUM_ITEMS),
    //           value: Math.floor(Math.random() * NUM_ITEMS),
    //           name: Math.floor(Math.random() * NUM_ITEMS) + ""
    //         })
    //       )
    //     }
    //   }, 1000 / MESSAGES_PER_SECOND)
    // }
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
