import Mumble from "mumble"
import Channel from "mumble/lib/Channel"
import User from "mumble/lib/User"
import { mumbleOptions } from "../config"
import type { Connection, ChannelProps } from "../types"
import fs from "fs"

var input = fs.createReadStream("sin.pcm")

const defaultChannels = ["The Radicals", "Creative Minds", "Personal Branding"]

// input.pipe(this.connection.inputStream())

type User = {
  name?: string
  pass?: string
  channel?: Partial<ChannelProps> & { channel_id?: number }
}

class MumbleInstance {
  constructor() {
    console.log("Connecting")
    this.connection = null
  }
  currentChannel: Channel
  rootChannel: Channel
  user: User
  connection: Connection
  establishedConnection: Connection
  channels: ChannelProps[]
  resolve: (value: unknown) => void
  onInit = connection => {
    console.log(["Connection initialized"])
    this.establishedConnection = connection

    if (!this.user) {
      this.rootChannel = new Channel(connection.rootChannel, this.connection)
      defaultChannels.forEach((element: string) => {
        if (!this.connection.channelByName(element)) {
          this.rootChannel.addSubChannel(element, {})
        }
      })
      return
    }

    if (this.user?.channel?.channel_id) {
      this.currentChannel = this.connection.channelById(
        this.user.channel.channel_id
      )
    } else if (this.user?.channel?.name) {
      this.currentChannel = this.connection.channelByName(
        this.user.channel.name
      )
    }

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
  disconnect = () => {
    try {
      this.connection?.disconnect()
      console.log("Disconnected")
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
    connection.on("voice-start", function (user) {
      console.log("User " + user.name + " started voice transmission")
    })
  }
  createChannel = (channel: string): any => {
    if (this.rootChannel) {
      if (!this.connection.channelByName(channel)) {
        this.rootChannel.addSubChannel(channel, {})
      }
    }
  }
  joinChannel = (name: string) => {
    const channel = this.connection.channelByName(name)
    if (channel) {
      channel.join()
    }
  }
  get getUsersInChannel() {
    return this?.currentChannel?.users.map(user => {
      return {
        name: user?.name
      }
    })
  }
  get flatChannels() {
    return Object.values(this.establishedConnection.channels)
  }
}

export { MumbleInstance }
