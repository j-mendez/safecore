const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg")
const ffmpeg = require("fluent-ffmpeg")

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export default ffmpeg
