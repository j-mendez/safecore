import Mumble from "mumble"
import Channel from "mumble/lib/Channel"
import User from "mumble/lib/User"
import { mumbleOptions } from "../config"
import type { Connection, ChannelProps } from "../types"
import fs from "fs"
import path from "path"
import lame from "lame"
import wav from "wav"
// import Speaker from "speaker"

type User = {
  name?: string
  pass?: string
  channel?: Partial<ChannelProps> & { channel_id?: number }
}

class MumbleInstance {
  currentChannel: Channel
  rootChannel: Channel
  user: User
  connection: Connection = null
  establishedConnection: Connection
  channels: ChannelProps[]
  resolve: (value: unknown) => void
  onInit = connection => {
    console.log(["Connection initialized"])
    this.establishedConnection = connection

    if (!this.user) {
      this.rootChannel = new Channel(connection.rootChannel, this.connection)
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

    if (this.user) {
      const channelPath = `./audio/${this.currentChannel.name}/`
      const userPath = `${channelPath}${this.connection.user.name}/`

      if (!fs.existsSync(channelPath)) {
        fs.mkdirSync(channelPath)
      }

      if (!fs.existsSync(userPath)) {
        fs.mkdirSync(userPath)
      }

      const outputFileStream = new wav.FileWriter(
        `${userPath}${this.connection.session}.wav`,
        {
          sampleRate: 48000,
          channels: 1
        }
      )

      const reader = new wav.Reader()

      connection.outputStream().pipe(outputFileStream).pipe(reader)

      const output = fs.createWriteStream(
        `${userPath}${this.connection.session}.mp3`
      )

      reader.on("format", onFormat)

      function onFormat(format) {
        console.error("WAV format: %j", format)
        const encoder = new lame.Encoder(format)
        reader.pipe(encoder).pipe(output)
      }

      // uncomment to get audio to your speaker
      // const speaker = new Speaker({
      //   channels: 1, // 2 channels
      //   bitDepth: 16, // 16-bit samples
      //   sampleRate: 44100 //44100     // 44,100 Hz sample rate
      // })
      // this.connection.outputStream().pipe(speaker)
    }

    if (this.resolve) {
      this.resolve(this.connection)
    }
  }
  onVoice = event => {
    // console.log(["Speaking", event])
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
