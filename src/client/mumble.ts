"use strict"

import mumble from "mumble"
import fs from "fs"
import type { Connection } from "mumble"

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
} as any

let voice = { data: null }

const mumbleConnect = () => {
  return mumble.connect(
    process.env.MUMBLE_URL || "127.0.0.1:64738",
    options,
    function (error: any, connection: Connection) {
      console.log("Connecting")
      if (error) {
        throw new Error(error)
      }
      console.log("Connected")
      connection.authenticate("ExampleUser", null)
      connection.on("initialized", onInit)
      connection.on("voice", onVoice)
    }
  )
}

const onInit = function (connection) {
  console.log(["Connection initialized", connection.users])
}

const onVoice = function (event) {
  console.log("Mixed voice")
  var pcmData = voice.data
  console.log(pcmData)
  console.log(event)
}

mumbleConnect()

export { mumbleConnect }
