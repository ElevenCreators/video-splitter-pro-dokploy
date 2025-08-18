// src/lib/ffmpeg.ts
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import fluent from "fluent-ffmpeg";

const candidates = [
  process.env.FFMPEG_PATH,
  // Windows comunes
  "C:\\\\ffmpeg\\\\bin\\\\ffmpeg.exe",
  "C:\\\\ProgramData\\\\chocolatey\\\\bin\\\\ffmpeg.exe",
  // Linux/Mac
  "/usr/local/bin/ffmpeg",
  "/usr/bin/ffmpeg",
].filter(Boolean) as string[];

let chosen = "";
for (const p of candidates) {
  try {
    if (p && fs.existsSync(p)) { chosen = p; break; }
  } catch {}
}

if (!chosen) {
  const cmd = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(cmd, ["ffmpeg"], { encoding: "utf8" });
  const line = r.stdout?.split(/\r?\n/).find(Boolean)?.trim();
  if (line && fs.existsSync(line)) chosen = line;
}

if (chosen) {
  fluent.setFfmpegPath(chosen);
  const guessProbe =
    process.env.FFPROBE_PATH ||
    (chosen.endsWith("ffmpeg.exe")
      ? chosen.replace(/ffmpeg\.exe$/i, "ffprobe.exe")
      : chosen.replace(/ffmpeg$/i, "ffprobe"));
  if (guessProbe && fs.existsSync(guessProbe)) {
    fluent.setFfprobePath(guessProbe);
  }
  console.log(`✅ Using FFmpeg: ${chosen}`);
} else {
  console.warn("⚠️ FFmpeg path not resolved at init");
}

export { fluent as ffmpeg };
export default fluent;