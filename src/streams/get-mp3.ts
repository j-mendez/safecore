import fs from "fs"
import { pipeline } from "stream"

export const getMp3 = function (req, res) {
  const { channel, user, sessionId } = req.params
  const filePath = `./audio/${channel}/${user}/${sessionId}`
  const stat = fs.statSync(filePath)

  res.writeHead(200, {
    "Content-Type": "video/MP2T",
    "Content-Length": stat.size
  })

  const readStream = fs.createReadStream(filePath)
  pipeline(readStream, res, () => {})
}
