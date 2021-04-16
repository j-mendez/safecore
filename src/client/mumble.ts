import Mumble from "mumble"
import Channel from "mumble/lib/Channel"
import User from "mumble/lib/User"
import { mumbleOptions } from "../config"
import type { Connection, ChannelProps } from "../types"
import fs from "fs"
import path from "path"
import lame from "lame"
import wav from "wav"
import ffmpeg from "ffmpeg"
import type { Writable } from "stream"

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
  audioStream: Writable
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
        `${userPath}${this.connection?.session}.wav`,
        {
          sampleRate: 48000,
          channels: 1
        }
      )

      const soundBasePath = `${userPath}${this.connection.session}`
      const mp3Path = `${soundBasePath}.mp3`
      const output = fs.createWriteStream(mp3Path)

      const reader = new wav.Reader()

      reader.on("format", format => {
        console.info("WAV format: %j", format)
        const encoder = new lame.Encoder(format)
        reader.pipe(encoder).pipe(output)
      })

      this.audioStream = connection
        .outputStream()
        .pipe(outputFileStream)
        .pipe(reader)

      let tick = 0

      this.audioStream.on("data", format => {
        process.nextTick(() => {
          tick++
          if (tick === 200) {
            ffmpeg(path.resolve(mp3Path), (err, audio) => {
              if (!err) {
                console.log("The audio file is ready to be processed")
                audio
                  .setAudioChannels(2)
                  .save(`${soundBasePath}.m3u8`, function (error, file) {
                    if (!error) {
                      console.log("Audio file: " + file)
                    } else {
                      console.log("Error on hls: " + error)
                    }
                  })
              } else {
                console.log("Error: " + err)
              }
            })
            tick = 0
          }
        })
      })
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
      if (this.audioStream) {
        this.audioStream.end()
      }
      process.nextTick(() => {
        this.connection?.disconnect()
      })
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
      console.log("TALKING", user)
      user.talking = true
      return user
    })
    connection.on("voice-end", function (user) {
      console.log("TALKING END", user)
      user.talking = false
      return user
    })
  }
  createChannel = (channel: Channel): any => {
    if (this.rootChannel) {
      const channelName = String(channel?.name).replace(/\s+/g, "")

      if (!this.connection.channelByName(channelName)) {
        this.rootChannel.addSubChannel(channelName, {
          description: channel?.description
        })
      }
    }
  }
  joinChannel = (name: string) => {
    const channelName = String(name).replace(/\s+/g, "")

    const channel = this.connection.channelByName(channelName)
    if (channel) {
      channel.join()
    }
  }
  get getUsersInChannel() {
    return this?.currentChannel?.users.map(user => {
      const sessionId = user?.client?.user?.session
      const userMap = user?.client?.connection?.users[sessionId]

      return {
        name: user?.name,
        id: user?.id,
        prioritySpeaker: user?.prioritySpeaker,
        speaking: userMap?.talking
      }
    })
  }
  get flatChannels() {
    return Object.values(this.establishedConnection.channels)
  }
}

export { MumbleInstance }
