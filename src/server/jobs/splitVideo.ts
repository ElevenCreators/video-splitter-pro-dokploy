// src/server/jobs/splitVideo.ts
import path from "node:path";
import { promises as fsp } from "node:fs";
import { spawn } from "node:child_process";
import { TEMP_DIR } from "@/lib/paths";

type Mode = "copy" | "reencode";

function ffmpegBin(): string {
  // Usa FFMPEG_PATH si existe (Windows/Dokploy), sino confía en PATH
  return process.env.FFMPEG_PATH || "ffmpeg";
}

async function run(cmd: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function listSegments(outDir: string): Promise<string[]> {
  const items = await fsp.readdir(outDir);
  return items
    .filter((n) => /^segment_\d{3}\.mp4$/.test(n))
    .sort();
}

export async function splitVideo(jobId: string, inputPath: string, seconds: number, mode: Mode): Promise<void> {
  const outDir = path.join(TEMP_DIR, `output_${jobId}`);
  await fsp.mkdir(outDir, { recursive: true });

  const segTpl = path.join(outDir, "segment_%03d.mp4");
  const ff = ffmpegBin();

  if (mode === "copy") {
    // RÁPIDO: copia streams, puede no ser exacto si no caen en keyframes del original
    const args = [
      "-i", inputPath,
      "-y", "-loglevel", "error", "-nostdin", "-ignore_unknown",
      "-map", "0:v:0", "-map", "0:a:0?", "-dn", "-sn", "-map_metadata", "-1",
      "-f", "segment",
      "-segment_time", String(seconds),
      "-reset_timestamps", "1",
      "-movflags", "+faststart",
      "-c:v", "copy",
      "-c:a", "copy",
      segTpl,
    ];
    console.log(`🎬 FFmpeg started [copy] (${jobId}): ${inputPath} -> ${segTpl}`);
    await run(ff, args);
  } else {
    // PRECISO: reencoda video con CFR + keyframes forzados en cortes
    const FPS = 30; // fija a 30fps para segmentación regular; ajustable si quieres
    const GOP = Math.max(1, Math.round(seconds * FPS));

    const args = [
      "-i", inputPath,
      "-y", "-loglevel", "error", "-nostdin", "-ignore_unknown",
      "-map", "0:v:0", "-map", "0:a:0?", "-dn", "-sn", "-map_metadata", "-1",

      // --- Video encode controlado ---
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      // CFR & framerate fijo
      "-vsync", "cfr",
      "-r", String(FPS),
      // GOP estable y sin scene-cut
      "-g", String(GOP),
      "-keyint_min", "1",
      "-sc_threshold", "0",
      // keyframes exactamente en multiplos de 'seconds'
      "-force_key_frames", `expr:gte(t,n_forced*${seconds})`,

      // --- Audio ---
      "-c:a", "aac",
      "-b:a", "128k",

      // --- Segmentación ---
      "-f", "segment",
      "-segment_format", "mp4",
      "-segment_time", String(seconds),
      "-segment_time_delta", "0.1",
      "-reset_timestamps", "1",
      "-movflags", "+faststart",

      segTpl,
    ];

    console.log(`🎬 FFmpeg started [reencode] (${jobId}): ${inputPath} -> ${segTpl}  seconds=${seconds} fps=${FPS}`);
    await run(ff, args);
  }

  const files = await listSegments(outDir);
  console.log(`📦 segments(${jobId}): count=${files.length}`, files.slice(0, 5));
  console.log(`✅ Job done: ${jobId} [${mode}] outDir=${outDir}`);
}
