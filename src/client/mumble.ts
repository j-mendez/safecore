import mumble from "mumble"
import fs from "fs"
import type { Connection } from "mumble"

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
} as any

let MumbleData: any = { users: null }

const mumbleConnect = (user?: string) => {
  try {
    return mumble.connect(
      process.env.MUMBLE_URL || "127.0.0.1:64738",
      options,
      function (error: any, connection: Connection) {
        console.log("Connecting")
        if (error) {
          throw new Error(error)
        }
        console.log("Connected")
        connection.authenticate(user || "ExampleUser", null)
        connection.on("initialized", onInit)
        connection.on("voice", onVoice)
      }
    )
  } catch (e) {
    console.error(e)
  }
}

const onInit = function (connection) {
  console.log(["Connection initialized"])
  MumbleData = {
    users: connection.users,
    channels: connection.channels
  }
}

const onVoice = function (event) {
  console.log("Mixed voice")
  console.log(event)
}

export { mumbleConnect, MumbleData }
