import Mumble from "mumble"
import Channel from "mumble/lib/Channel"
import User from "mumble/lib/User"
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

type Channel = {
  channel_id: number
  name: string
}

type User = {
  name?: string
  pass?: string
  channel?: Channel
}

class MumbleInstance {
  constructor() {
    console.log("Connecting")
    this.connection = null
  }
  user: User
  client: any
  connection: Connection
  onInit = connection => {
    console.log(["Connection initialized"])

    // admin create default channells
    if (!this.user) {
      const channel = new Channel(connection.rootChannel, this.connection)

      MumbleData.users = connection.users
      MumbleData.channels = connection.channels
      connection.rootChannel.setName("Global")

      defaultChannels.forEach((element: string) => {
        if (!this.connection.channelByName(element)) {
          channel.addSubChannel(element, {})
        }
      })
      return
    }

    const channelSource = this.connection.channelById(
      this.user?.channel?.channel_id
    )
    if (channelSource) {
      this.connection.user.moveToChannel(channelSource)
    }
  }
  onVoice = event => {
    console.log(["Mixed voice", event])
  }
  connect = (props: User = {}) => {
    try {
      const { name, pass, channel } = props
      if (name) {
        this.user = { name, pass, channel }
      }
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
    connection.authenticate(
      this?.user?.name ?? "SuperUser",
      this?.user?.pass ?? process.env.SUPER_USER_PASSWORD ?? "admin"
    )
    connection.on("initialized", this.onInit)
    connection.on("voice", this.onVoice)
  }
}

export { MumbleInstance, MumbleData }
