import ffmpeg from "fluent-ffmpeg";

const ffmpegPath = process.env.FFMPEG_PATH || "/usr/local/bin/ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH || "/usr/local/bin/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export { ffmpeg };
export default ffmpeg; // permite: import ffmpeg from "@/lib/ffmpeg"
