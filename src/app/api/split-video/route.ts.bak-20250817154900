import { NextRequest, NextResponse } from "next/server";
import { ffmpeg } from "@/lib/ffmpeg";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  ReadableStream as WebReadableStream,
  ReadableStreamDefaultReader,
} from "node:stream/web";
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
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) { api.setFfmpegPath(process.env.FFMPEG_PATH); return true; }
    for (const p of ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/bin/ffmpeg"]) {
      if (fs.existsSync(p)) { api.setFfmpegPath(p); return true; }
    }
    console.warn("⚠️ FFmpeg path not resolved at init");
    return true;
  } catch { return true; }
}

const ffmpegReady = setupFFmpegPath();
startCleaner();

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Convierte un WebReadableStream<Uint8Array> a Node Readable sin usar `any`
function webToNodeReadable(web: WebReadableStream<Uint8Array>): Readable {
  const iterator = (async function* () {
    const reader: ReadableStreamDefaultReader<Uint8Array> = web.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) yield Buffer.from(value);
      }
    } finally {
      try { reader.releaseLock(); } catch {}
    }
  })();
  return Readable.from(iterator);
}

export async function POST(request: NextRequest) {
  try {
    gc();

    // 1) Leer form-data de forma compatible con móviles
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      const ua = request.headers.get("user-agent") || "unknown";
      const ct = request.headers.get("content-type") || "unknown";
      console.error("❌ formData() failed", { ua, ct, error: getErrorMessage(e) });
      return NextResponse.json({ ok: false, error: "Invalid multipart/form-data" }, { status: 400 });
    }

    const fileEntry = formData.get("video");
    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const filename = fileEntry.name || "upload.bin";
    const segmentSeconds = Math.max(1, Number((formData.get("segmentLength") as string) || "10") || 10);
    const allowReencode = ["1","true","yes","on"].includes(String(formData.get("allowReencode") ?? "0").toLowerCase());

    if (!ffmpegReady) return NextResponse.json({ ok: false, error: "FFmpeg not ready" }, { status: 500 });

    const baseDir = "/app/temp";
    await fsp.mkdir(baseDir, { recursive: true });

    const ts = Date.now();
    const jobId = `${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const inputPath = path.join(baseDir, `input_${jobId}_${filename}`);
    const outDir = path.join(baseDir, `output_${jobId}`);
    await fsp.mkdir(outDir, { recursive: true });

    createJob(jobId);
    setProgress(jobId, 1);

    // 2) Stream del archivo a disco sin buffers gigantes (compatible móvil)
    try {
      const webStream = fileEntry.stream() as unknown as WebReadableStream<Uint8Array>;
      let nodeStream: Readable;

      // Usa Readable.fromWeb si existe y está tipado
      const R = Readable as typeof Readable & {
        fromWeb?: (rs: WebReadableStream<Uint8Array>) => Readable;
      };
      if (typeof R.fromWeb === "function") {
        nodeStream = R.fromWeb(webStream);
      } else {
        nodeStream = webToNodeReadable(webStream);
      }

      await new Promise<void>((resolve, reject) => {
        const ws = fs.createWriteStream(inputPath);
        nodeStream.on("error", reject);
        ws.on("error", reject);
        ws.on("finish", resolve);
        nodeStream.pipe(ws);
      });
    } catch (e) {
      console.error("❌ failed to write upload to disk:", getErrorMessage(e));
      return NextResponse.json({ ok: false, error: "Failed to save upload" }, { status: 500 });
    }

    let finished = false;
    let triedReencode = false;

    const buildAndRun = (mode: "copy" | "reencode") => {
      const outputPattern = path.join(outDir, "segment_%03d.mp4");
      const cmd = ffmpeg(inputPath).output(outputPattern);

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
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k",
          "-f", "segment",
          "-segment_time", String(segmentSeconds),
          "-reset_timestamps", "1",
          "-movflags", "+faststart",
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
        .on("stderr", (line: string) => {
          if (line) console.log("ffmpeg stderr:", line);
        })
        .on("end", async () => {
          if (finished) return;
          const names = (await fsp.readdir(outDir)).filter(n => n.endsWith(".mp4")).sort();

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
    console.error("❌ Handler error:", msg);
    return NextResponse.json({ ok: false, error: msg || "Internal server error" }, { status: 500 });
  }
}
