import ffmpegFluent from "fluent-ffmpeg";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Export principal para usar en routes: import { ffmpeg } from "@/lib/ffmpeg"
export const ffmpeg = ffmpegFluent;

const CANDIDATES = [
  process.env.FFMPEG_PATH || "",
  "/usr/local/bin/ffmpeg",
  "/usr/bin/ffmpeg",
  "/bin/ffmpeg",
].filter(Boolean);

let resolved = "";

for (const p of CANDIDATES) {
  try {
    if (p && fs.existsSync(p)) {
      ffmpegFluent.setFfmpegPath(p);
      resolved = p;
      break;
    }
  } catch {}
}

if (!resolved) {
  console.warn("⚠️ FFmpeg path not resolved at init");
} else {
  try {
    // Verificación segura: SOLO -version (sin process.argv)
    const out = spawnSync(resolved, ["-version"], { encoding: "utf8" });
    if (out.error) {
      console.warn("⚠️ FFmpeg check error:", out.error.message);
    } else {
      const first = (out.stdout || "").split("\n")[0]?.trim();
      console.log("✅ Using FFmpeg:", resolved, first ? `| ${first}` : "");
    }
  } catch (e) {
    console.warn("⚠️ FFmpeg version check failed:", e instanceof Error ? e.message : String(e));
  }
}
