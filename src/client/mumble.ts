import Mumble from "mumble"
import Channel from "mumble/lib/Channel"

import { mumbleOptions } from "../config"
import type { Connection } from "mumble"

let MumbleData: any = {
  users: null,
  channels: [],
  get flatChannels() {
    return Object.values(this.channels)
  }
}

const defaultChannels = ["The Radicals", "Creative Minds", "Personal Branding"]

class MumbleInstance {
  constructor() {
    console.log("Connecting")
    this.connection = null
  }
  client: any
  connection: Connection
  onInit = connection => {
    console.log(["Connection initialized"])
    MumbleData.users = connection.users
    MumbleData.channels = connection.channels
    connection.rootChannel.setName("Global")
    const channel = new Channel(connection.rootChannel, this.connection)

    defaultChannels.forEach((element: string) => {
      if (!this.connection.channelByName(element)) {
        channel.addSubChannel(element, {})
      }
    })
  }
  onVoice = event => {
    console.log(["Mixed voice", event])
  }
  connect = (user?: string) => {
    try {
      const client = Mumble.connect(
        process.env.MUMBLE_URL || "127.0.0.1:64738",
        mumbleOptions,
        this.establish
      )

      this.client = client

      return client
    } catch (e) {
      console.error(e)
    }
  }
  establish = (error: any, connection: Connection) => {
    if (error) {
      throw new Error(error)
    }
    console.log("Connected")
    this.connection = connection
    connection.authenticate("SuperUser", "admin")
    connection.on("initialized", this.onInit)
    connection.on("voice", this.onVoice)
  }
}

export { MumbleInstance, MumbleData }
