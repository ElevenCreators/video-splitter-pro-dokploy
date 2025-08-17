// src/lib/ffmpeg.ts
import ffmpeg from "fluent-ffmpeg";

const ffmpegPath = process.env.FFMPEG_PATH || "/usr/local/bin/ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH || "/usr/local/bin/ffprobe";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// (Opcional) pequeña verificación en arranque (una sola vez en server-side)
if (process.env.NODE_ENV !== "production") {
  ffmpeg.getAvailableFormats((err, fmts) => {
    if (err) console.warn("FFmpeg check (dev):", err.message);
  });
}

export { ffmpeg };

