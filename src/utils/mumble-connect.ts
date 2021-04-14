import { MumbleInstance } from "@app/client/mumble"

export const mumbleConnect = async (mumble: MumbleInstance, message: any) => {
  await mumble.connect({
    name: message?.user?.name || String("Anonymous" + Math.random()),
    pass: message?.pass,
    channel: message?.channel
  })
}
