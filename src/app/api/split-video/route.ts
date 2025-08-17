import { NextRequest, NextResponse } from "next/server";
import { ffmpeg } from "@/lib/ffmpeg"; // si exportas default: import ffmpeg from "@/lib/ffmpeg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createJob, setProgress, completeJob, failJob, gc } from "@/lib/jobStore";
import { startCleaner, scheduleDeletion } from "@/lib/tempCleaner";

function setupFFmpegPath() {
  try {
    console.log("🔍 Setting up FFmpeg path...");
    if (process.env.SKIP_FFMPEG_CHECK) {
      console.log("⏭️  SKIP_FFMPEG_CHECK=1 → check diferido a runtime");
      return true;
    }
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
      // @ts-ignore
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
      console.log("✅ Using environment FFmpeg:", process.env.FFMPEG_PATH);
      return true;
    }
    const systemPaths = ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg"];
    for (const p of systemPaths) {
      if (fs.existsSync(p)) {
        // @ts-ignore
        ffmpeg.setFfmpegPath(p);
        console.log("✅ Found system FFmpeg:", p);
        return true;
      }
    }
    console.warn("⚠️ FFmpeg not found at import time; relying on PATH at runtime.");
    return true;
  } catch (e) {
    console.warn("⚠️ setupFFmpegPath error:", e);
    return true;
  }
}

const ffmpegReady = setupFFmpegPath();
startCleaner();  // ← arranca el autocleaner en background

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    gc();

    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const segmentStr = (formData.get("segmentLength") as string) || "10";
    const segmentSeconds = Math.max(1, Number(segmentStr) || 10);
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

    const buf = Buffer.from(await file.arrayBuffer());
    await fsp.writeFile(inputPath, buf);

    createJob(jobId);

    const command = ffmpeg(inputPath)
      .output(path.join(outDir, "segment_%03d.mp4"))
      .outputOptions([
        "-y", "-c", "copy", "-map", "0",
        "-f", "segment", "-segment_time", String(segmentSeconds),
        "-reset_timestamps", "1",
      ])
      .on("start", (cmd: string) => {
        console.log("🎬 FFmpeg started:", cmd);
        setProgress(jobId, 5);
      })
      .on("progress", (p: any) => {
        const next = p?.percent ? Math.min(95, Math.floor(p.percent)) : undefined;
        if (next) setProgress(jobId, next);
      })
      .on("end", async () => {
        try {
          console.log("✅ FFmpeg completed");
          const names = (await fsp.readdir(outDir)).filter(n => n.endsWith(".mp4")).sort();
          const files = names.map(name => ({
            name,
            url: `/api/download?job=${encodeURIComponent(jobId)}&file=${encodeURIComponent(name)}`,
          }));
          completeJob(jobId, files);

          // borra input y programa borrado de outputs por TTL
          try { await fsp.rm(inputPath, { force: true }); } catch {}
          scheduleDeletion(jobId, outDir);
        } catch (e: any) {
          console.error("❌ Post-processing error:", e);
          failJob(jobId, e?.message || "post-processing");
        }
      })
      .on("error", (err: any) => {
        console.error("❌ FFmpeg error:", err);
        failJob(jobId, String(err?.message || err));
        try { fs.existsSync(inputPath) && fs.rmSync(inputPath); } catch {}
        try { fs.existsSync(outDir) && fs.rmSync(outDir, { recursive: true }); } catch {}
      });

    command.run();
    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (error: any) {
    console.error("❌ API error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
