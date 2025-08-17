import { NextRequest, NextResponse } from "next/server";
import { ffmpeg } from "@/lib/ffmpeg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createJob, setProgress, completeJob, failJob, gc } from "@/lib/jobStore";
import { startCleaner, scheduleDeletion } from "@/lib/tempCleaner";

type FFmpegAPI = typeof ffmpeg & { setFfmpegPath: (p: string) => void };
interface FFmpegProgress { percent?: number }

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function setupFFmpegPath(): boolean {
  try {
    const api = ffmpeg as FFmpegAPI;
    const envPath = process.env.FFMPEG_PATH;
    if (envPath && fs.existsSync(envPath)) { api.setFfmpegPath(envPath); return true; }
    for (const p of ["/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg", "/bin/ffmpeg"]) {
      if (fs.existsSync(p)) { api.setFfmpegPath(p); return true; }
    }
    // devolvemos true para permitir modo simulación arriba si hiciera falta
    return true;
  } catch { return true; }
}

const ffmpegReady = setupFFmpegPath();
startCleaner();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    gc();

    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const segmentSeconds =
      Math.max(1, Number((formData.get("segmentLength") as string) || "10") || 10);

    const allowReencode = ["1","true","yes","on"]
      .includes(String(formData.get("allowReencode") ?? "0").toLowerCase());

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    if (!ffmpegReady) {
      return NextResponse.json({ ok: false, error: "FFmpeg not ready" }, { status: 500 });
    }

    const baseDir = "/app/temp";
    await fsp.mkdir(baseDir, { recursive: true });

    const ts = Date.now();
    const jobId = `${ts}_${Math.random().toString(36).slice(2, 8)}`;

    // rutas
    const inputPath = path.join(baseDir, `input_${jobId}_${file.name}`);
    const outDir = path.join(baseDir, `output_${jobId}`);
    await fsp.mkdir(outDir, { recursive: true });

    // guardar archivo
    await fsp.writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    createJob(jobId);

    let finished = false;
    let triedReencode = false;

    const buildAndRun = (mode: "copy" | "reencode") => {
      const outputPattern = path.join(outDir, "segment_%03d.mp4");
      const cmd = ffmpeg(inputPath)
        .output(outputPattern);

      if (mode === "copy") {
        // Segmentación con *stream copy* (rápida, sin pérdida)
        cmd.outputOptions([
          "-y",
          "-loglevel", "error",
          "-nostdin",
          "-c", "copy",
          "-map", "0",
          "-f", "segment",
          "-segment_time", String(segmentSeconds),
          "-reset_timestamps", "1"
        ]);
      } else {
        // Re-encode REAL para entradas problemáticas
        cmd.outputOptions([
          "-y",
          "-loglevel", "error",
          "-nostdin",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "18",                // calidad visual alta (ajústalo si hace falta)
          "-movflags", "+faststart",
          "-c:a", "copy",              // conserva el audio si es posible
          "-map", "0",
          "-f", "segment",
          "-segment_time", String(segmentSeconds),
          "-reset_timestamps", "1"
        ]);
      }

      // logs de diagnóstico (muy útiles para saber por qué falla ffmpeg)
      cmd.on("stderr", (line: string) => {
        console.log("ffmpeg stderr:", line);
      });

      cmd
        .on("start", (line: string) => {
          console.log(`🎬 FFmpeg started [${mode}]:`, line);
          setProgress(jobId, mode === "copy" ? 5 : 10);
        })
        .on("progress", (p: FFmpegProgress) => {
          if (typeof p.percent === "number") {
            const base = mode === "copy" ? 5 : 10;
            const scaled = Math.min(95, base + Math.floor(p.percent * 0.9));
            setProgress(jobId, scaled);
          }
        })
        .on("end", async () => {
          if (finished) return;
          const names = (await fsp.readdir(outDir)).filter(n => n.endsWith(".mp4")).sort();
          console.log(`📦 Post-processing [${mode}]: ${names.length} segment(s)`);

          // Si con copy no generó nada y está permitido re-encode → intentamos una vez
          if (names.length === 0 && mode === "copy" && allowReencode && !triedReencode) {
            triedReencode = true;
            console.warn("⚠️ 0 segments with copy; retrying with re-encode...");
            buildAndRun("reencode");
            return;
          }

          finished = true;
          const files = names.map(name => ({
            name,
            url: `/api/download?job=${encodeURIComponent(jobId)}&file=${encodeURIComponent(name)}`
          }));
          completeJob(jobId, files);

          // Limpieza
          try { if (fs.existsSync(inputPath)) await fsp.rm(inputPath, { force: true }); } catch {}
          scheduleDeletion(jobId, outDir);

          console.log(`✅ Job done: ${jobId} [${mode}]`);
        })
        .on("error", (err: unknown) => {
          const msg = getErrorMessage(err);
          console.error(`❌ FFmpeg error [${mode}]:`, msg);

          if (!finished && mode === "copy" && allowReencode && !triedReencode) {
            triedReencode = true;
            console.warn("⚠️ Copy failed; retrying with re-encode...");
            buildAndRun("reencode");
            return;
          }

          if (!finished) {
            finished = true;
            failJob(jobId, msg);
            try { if (fs.existsSync(inputPath)) fs.rmSync(inputPath, { force: true }); } catch {}
            try { if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true }); } catch {}
          }
        })
        .run();
    };

    buildAndRun("copy");
    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    return NextResponse.json({ ok: false, error: msg || "Internal server error" }, { status: 500 });
  }
}
