import fluent from "fluent-ffmpeg";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

let configured = false;

function exists(p?: string) {
  if (!p) return false;
  try { return fs.existsSync(p); } catch { return false; }
}

function which(cmd: string) {
  try {
    const out = spawnSync("which", [cmd], { encoding: "utf8" }).stdout?.trim();
    return out || "";
  } catch { return ""; }
}

export function getFfmpeg() {
  if (configured || process.env.SKIP_FFMPEG_CHECK) return fluent;

  const candidates = [
    process.env.FFMPEG_PATH,                // si la seteas en Dokploy
    "/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg",
    which("ffmpeg"),
  ].filter(Boolean) as string[];

  const found = candidates.find(exists);
  if (found) {
    fluent.setFfmpegPath(found);
    const probe = process.env.FFPROBE_PATH || found.replace(/ffmpeg$/, "ffprobe");
    if (exists(probe)) fluent.setFfprobePath(probe);
    console.log("✅ Using FFmpeg:", found);
  } else {
    console.warn("⚠️ FFmpeg not found at build/import time; will rely on runtime PATH.");
  }

  configured = true;
  return fluent;
}

// Usa así en tu código:
// import { getFfmpeg } from "@/lib/ffmpeg";
// const ffmpeg = getFfmpeg();
export default getFfmpeg();
