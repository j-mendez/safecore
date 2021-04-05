import Mumble from "mumble"
import { mumbleOptions } from "../config"
import type { Connection } from "mumble"

let MumbleData: any = { users: null }

class MumbleInstance {
  constructor() {
    console.log("Connecting")
    this.connection = null
  }
  connection: Connection
  onInit = connection => {
    console.log(["Connection initialized"])
    MumbleData = {
      users: connection.users,
      channels: connection.channels
    }
    connection.rootChannel.setName("Lobby")
  }
  onVoice = event => {
    console.log("Mixed voice")
    console.log(event)
  }
  connect = (user?: string) => {
    try {
      return Mumble.connect(
        process.env.MUMBLE_URL || "127.0.0.1:64738",
        mumbleOptions,
        this.establish
      )
    } catch (e) {
      console.error(e)
    }
  }
  establish = (error: any, connection: Connection) => {
    if (error) {
      throw new Error(error)
    }
    console.log("Connected")
    connection.authenticate("Quick", null)
    connection.on("initialized", this.onInit)
    connection.on("voice", this.onVoice)
    this.connection = connection
  }
}

export { MumbleInstance, MumbleData }
