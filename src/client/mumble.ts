import Mumble from "mumble"
import Channel from "mumble/lib/Channel"
import User from "mumble/lib/User"
import { mumbleOptions } from "../config"
import type { Channel as ChannelProps, Connection } from "mumble"

let MumbleData: any = {
  users: null,
  channels: [],
  get flatChannels() {
    return Object.values(this.channels)
  }
}

const defaultChannels = ["The Radicals", "Creative Minds", "Personal Branding"]

type User = {
  name?: string
  pass?: string
  channel?: { channel_id: number } & ChannelProps
}

class MumbleInstance {
  constructor() {
    console.log("Connecting")
    this.connection = null
  }
  currentChannel: Channel
  user: User
  connection: Connection
  resolve: (value: unknown) => void
  onInit = connection => {
    console.log(["Connection initialized"])

    // admin create default channells
    MumbleData.users = {
      ...MumbleData.users,
      ...connection.users
    }
    MumbleData.channels = {
      ...MumbleData.channels,
      ...connection.channels
    }

    if (!this.user) {
      const channel = new Channel(connection.rootChannel, this.connection)

      connection.rootChannel.setName("Global")

      defaultChannels.forEach((element: string) => {
        if (!this.connection.channelByName(element)) {
          channel.addSubChannel(element, {})
        }
      })
      return
    }

    this.currentChannel = this.connection.channelById(
      this.user?.channel?.channel_id
    )

    if (this.currentChannel) {
      this.connection.user.moveToChannel(this.currentChannel)
    }

    if (this.resolve) {
      this.resolve(this.connection)
    }
  }
  onVoice = event => {
    console.log(["Mixed voice", event])
  }
  connect = async (props: User = {}): Promise<void> => {
    return await new Promise((resolve, reject) => {
      try {
        this.resolve = resolve

        const { name, pass, channel } = props

        if (name) {
          this.user = { name, pass, channel }
        }

        Mumble.connect(
          process.env.MUMBLE_URL || "127.0.0.1:64738",
          mumbleOptions,
          this.establish
        )
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
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
