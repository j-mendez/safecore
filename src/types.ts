import type {
  Channel as ChannelProps,
  Connection as ConnectionType
} from "mumble"

interface User {
  id: number
  value: number
  name: string
}

type AppProps = {
  error?: Error
  data?: User[]
}

interface Connection extends ConnectionType {
  channels: ChannelProps[]
  session: number | string
}

export { AppProps, ChannelProps, Connection, User }
