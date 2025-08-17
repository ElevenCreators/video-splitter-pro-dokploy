import { NextRequest, NextResponse } from "next/server";
import { ffmpeg } from "@/lib/ffmpeg";
import type { FfmpegCommand } from "fluent-ffmpeg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import Busboy from "busboy";
import { createJob, setProgress, completeJob, failJob, gc } from "@/lib/jobStore";
import { startCleaner, scheduleDeletion } from "@/lib/tempCleaner";

type FFmpegAPI = typeof ffmpeg & { setFfmpegPath: (p: string) => void };
interface FFmpegProgress { percent?: number }

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function safeName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim();
}

function setupFFmpegPath(): boolean {
  try {
    const api = ffmpeg as FFmpegAPI;
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) { api.setFfmpegPath(process.env.FFMPEG_PATH); return true; }
    for (const p of ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg"]) {
      if (fs.existsSync(p)) { api.setFfmpegPath(p); return true; }
    }
    return true;
  } catch { return true; }
}

async function saveMultipartToDisk(req: NextRequest, targetDir: string, tmpBase: string, maxBytes: number) {
  await fsp.mkdir(targetDir, { recursive: true });

  const headersObj = Object.fromEntries(req.headers.entries());
  if (!("content-type" in headersObj)) throw new Error("Missing Content-Type");

  const bb = Busboy({
    headers: headersObj,
    limits: { files: 1, fileSize: maxBytes },
  });

  const webBody = req.body;
  if (!webBody) throw new Error("Empty body");
  const nodeStream = Readable.fromWeb(webBody as unknown as ReadableStream<Uint8Array>);

  const fields: Record<string, string> = {};
  let originalName = "upload.bin";
  const tmpPath = path.join(targetDir, `${tmpBase}.bin`);

  const fileDone = new Promise<void>((resolve, reject) => {
    bb.on("file", (_fieldname, file, info) => {
      originalName = info.filename ? safeName(info.filename) : originalName;
      const ws = fs.createWriteStream(tmpPath);
      file.on("limit", () => reject(new Error("File too large")));
      file.on("error", reject);
      ws.on("error", reject);
      ws.on("finish", resolve);
      file.pipe(ws);
    });
    bb.on("field", (name, val) => { fields[name] = String(val); });
    bb.on("error", reject);
    bb.on("finish", () => {
      // Si no hubo file, resolve igual (lo detectamos después)
      if (!fs.existsSync(tmpPath)) reject(new Error("No file field found"));
    });
  });

  nodeStream.pipe(bb);
  await fileDone;

  return { tmpPath, fields, originalName };
}

const ffmpegReady = setupFFmpegPath();
startCleaner();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    gc();

    if (!ffmpegReady) {
      return NextResponse.json({ ok: false, error: "FFmpeg not ready" }, { status: 500 });
    }

    const baseDir = "/app/temp";
    await fsp.mkdir(baseDir, { recursive: true });

    const ts = Date.now();
    const jobId = `${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const outDir = path.join(baseDir, `output_${jobId}`);
    await fsp.mkdir(outDir, { recursive: true });

    const maxFile = Number(process.env.MAX_FILE_SIZE ?? 4 * 1024 * 1024 * 1024); // 4GiB default

    // --- Streaming upload a disco (sin cargar en RAM) ---
    const { tmpPath, fields, originalName } = await saveMultipartToDisk(
      request,
      baseDir,
      `input_${jobId}`,
      maxFile
    );

    const finalName = safeName(originalName);
    const inputPath = path.join(baseDir, `input_${jobId}_${finalName}`);
    await fsp.rename(tmpPath, inputPath);

    const segmentSeconds = Math.max(1, Number(fields["segmentLength"] ?? "10") || 10);
    const allowReencode = ["1","true","yes","on"].includes(String(fields["allowReencode"] ?? "0").toLowerCase());

    createJob(jobId);

    let finished = false;
    let triedReencode = false;

    const buildAndRun = (mode: "copy" | "reencode") => {
      const outPattern = path.join(outDir, "segment_%03d.mp4");
      const cmd: FfmpegCommand = ffmpeg(inputPath).output(outPattern);

      if (mode === "copy") {
        cmd.outputOptions([
          "-y",
          "-loglevel", "error",
          "-nostdin",
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-dn",
          "-sn",
          "-map_metadata", "-1",
          "-c:v", "copy",
          "-c:a", "copy",
          "-f", "segment",
          "-segment_time", String(segmentSeconds),
          "-reset_timestamps", "1",
          "-movflags", "+faststart",
        ]);
      } else {
        cmd.outputOptions([
          "-y",
          "-loglevel", "error",
          "-nostdin",
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-dn",
          "-sn",
          "-map_metadata", "-1",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-f", "segment",
          "-segment_time", String(segmentSeconds),
          "-reset_timestamps", "1",
        ]);
      }

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

          try { if (fs.existsSync(inputPath)) await fsp.rm(inputPath, { force: true }); } catch {}
          scheduleDeletion(jobId, outDir);

          console.log(`✅ Job done: ${jobId} [${mode}]`);
        })
        .on("error", async (err: unknown) => {
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
            try { if (fs.existsSync(inputPath)) await fsp.rm(inputPath, { force: true }); } catch {}
            try { if (fs.existsSync(outDir)) await fsp.rm(outDir, { recursive: true, force: true }); } catch {}
          }
        })
        .run();
    };

    buildAndRun("copy");
    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error("split-video 500:", msg);
    return NextResponse.json({ ok: false, error: msg || "Internal server error" }, { status: 500 });
  }
}
