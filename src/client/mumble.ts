import mumble from "mumble"
import { mumbleOptions } from "../config"
import type { Connection } from "mumble"

let MumbleData: any = { users: null }

class Mumble {
  constructor() {
    this.connection = null
  }
  connection: Connection
  connect = (user?: string) => {
    let _this = this

    const onInit = function (connection) {
      console.log(["Connection initialized"])
      MumbleData = {
        users: connection.users,
        channels: connection.channels
      }
      _this.connection = connection
    }

    const onVoice = function (event) {
      console.log("Mixed voice")
      console.log(event)
    }

    try {
      return mumble.connect(
        process.env.MUMBLE_URL || "127.0.0.1:64738",
        mumbleOptions,
        function (error: any, connection: Connection) {
          console.log("Connecting")
          if (error) {
            throw new Error(error)
          }
          console.log("Connected")
          connection.authenticate(user || "Quick", null)
          connection.on("initialized", onInit)
          connection.on("voice", onVoice)
        }
      )
    } catch (e) {
      console.error(e)
    }
  }
}

export { Mumble, MumbleData }
