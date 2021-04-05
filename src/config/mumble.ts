import fs from "fs"

const mumbleOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem")
} as any

export { mumbleOptions }
