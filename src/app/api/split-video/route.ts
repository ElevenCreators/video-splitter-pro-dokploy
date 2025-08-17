import { NextRequest, NextResponse } from "next/server";
import { ffmpeg } from "@/lib/ffmpeg"; // si exportas default: import ffmpeg from "@/lib/ffmpeg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createJob, setProgress, completeJob, failJob, gc } from "@/lib/jobStore";
import { startCleaner, scheduleDeletion } from "@/lib/tempCleaner";

// Tipos auxiliares (evitan "any")
type FFmpegAPI = typeof ffmpeg & { setFfmpegPath: (p: string) => void };
interface FFmpegProgress {
  frames?: number;
  currentFps?: number;
  currentKbps?: number;
  targetSize?: number;
  timemark?: string;
  percent?: number;
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return String(e); }
}

/** Configura path de ffmpeg sin usar ts-ignore */
function setupFFmpegPath(): boolean {
  try {
    console.log("🔍 Setting up FFmpeg path...");
    if (process.env.SKIP_FFMPEG_CHECK) {
      console.log("⏭️  SKIP_FFMPEG_CHECK=1 → check diferido a runtime");
      return true;
    }
    const api = ffmpeg as FFmpegAPI;

    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
      api.setFfmpegPath(process.env.FFMPEG_PATH);
      console.log("✅ Using environment FFmpeg:", process.env.FFMPEG_PATH);
      return true;
    }
    const systemPaths = ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg"];
    for (const pth of systemPaths) {
      if (fs.existsSync(pth)) {
        api.setFfmpegPath(pth);
        console.log("✅ Found system FFmpeg:", pth);
        return true;
      }
    }
    console.warn("⚠️ FFmpeg not found at import time; relying on PATH at runtime.");
    return true;
  } catch (e) {
    console.warn("⚠️ setupFFmpegPath error:", getErrorMessage(e));
    return true;
  }
}

const ffmpegReady = setupFFmpegPath();
startCleaner(); // autocleaner en background

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    gc(); // limpia jobs viejos del store en memoria

    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const segmentSeconds = Math.max(1, Number((formData.get("segmentLength") as string) || "10") || 10);

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    console.log(`🎬 Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - ${segmentSeconds}s segments`);
    if (!ffmpegReady) {
      return NextResponse.json({ ok: false, error: "FFmpeg not ready" }, { status: 500 });
    }

    const baseDir = "/app/temp";
    await fsp.mkdir(baseDir, { recursive: true });

    const ts = Date.now();
    const jobId = `${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const inputPath = path.join(baseDir, `input_${jobId}_${file.name}`);
    const outDir = path.join(baseDir, `output_${jobId}`);
    await fsp.mkdir(outDir, { recursive: true });

    await fsp.writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    createJob(jobId);

    const command = ffmpeg(inputPath)
      .output(path.join(outDir, "segment_%03d.mp4"))
      .outputOptions([
        "-y", "-c", "copy", "-map", "0",
        "-f", "segment", "-segment_time", String(segmentSeconds),
        "-reset_timestamps", "1",
      ])
      .on("start", (cmdLine: string) => {
        console.log("🎬 FFmpeg started:", cmdLine);
        setProgress(jobId, 5);
      })
      .on("progress", (p: FFmpegProgress) => {
        if (typeof p.percent === "number") {
          setProgress(jobId, Math.min(95, Math.floor(p.percent)));
        }
      })
      .on("end", async () => {
        try {
          console.log("✅ FFmpeg completed");
          const names = (await fsp.readdir(outDir)).filter(n => n.endsWith(".mp4")).sort();
          const files = names.map(name => ({
            name,
            url: `/api/download?job=${encodeURIComponent(jobId)}&file=${encodeURIComponent(name)}`
          }));
          completeJob(jobId, files);
          // Borra input; schedule para outputs
          try {
            if (fs.existsSync(inputPath)) { await fsp.rm(inputPath, { force: true }); }
          } catch {}
          scheduleDeletion(jobId, outDir);
        } catch (e) {
          console.error("❌ Post-processing error:", getErrorMessage(e));
          failJob(jobId, getErrorMessage(e));
        }
      })
      .on("error", (err: unknown) => {
        console.error("❌ FFmpeg error:", getErrorMessage(err));
        failJob(jobId, getErrorMessage(err));
        // Limpieza sin "unused-expressions"
        try {
          if (fs.existsSync(inputPath)) { fs.rmSync(inputPath, { force: true }); }
        } catch {}
        try {
          if (fs.existsSync(outDir)) { fs.rmSync(outDir, { recursive: true, force: true }); }
        } catch {}
      });

    command.run();
    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (error: unknown) {
    console.error("❌ API error:", getErrorMessage(error));
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) || "Internal server error" },
      { status: 500 }
    );
  }
}
