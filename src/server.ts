import express from "express"
import http from "http"
import WebSocket from "ws"
import { join } from "path"
import { AddressInfo } from "net"

import {
  getRandomItemFromList,
  buildReactTemplateStream,
  callHandlerEveryN
} from "@app/utils"
import { PORT, MESSAGES_PER_SECOND, NUM_ITEMS } from "@app/config"
import { Mumble, MumbleData } from "@app/client/mumble"

const app = express()
const mumble = new Mumble()

app.use("/static", express.static(join(__dirname, "public")))
app.get("*", function (req, res) {
  buildReactTemplateStream(res)
})

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const connections = mumble.connect()

wss.on("connection", function (ws) {
  let destroy

  ws.on("message", function (_message) {
    const message =
      typeof _message === "string" ? JSON.parse(_message) : _message
    const name = message?.name

    console.log(message)
    if (name === "Ping") {
      if (ws.readyState === 1) {
        ws.send(true)
      }
      console.log(connections)
    }
    if (name === "Channels") {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ data: MumbleData.channels, type: "channels" }))
      }
    }
    if (name === "Feed") {
      destroy = callHandlerEveryN(function () {
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              id: Math.floor(Math.random() * NUM_ITEMS),
              value: Math.floor(Math.random() * NUM_ITEMS),
              name: getRandomItemFromList()
            })
          )
        }
      }, 1000 / MESSAGES_PER_SECOND)
    }
  })

  ws.on("close", function () {
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
