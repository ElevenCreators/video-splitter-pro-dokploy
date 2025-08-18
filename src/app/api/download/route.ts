// src/app/api/download/route.ts
import { NextRequest } from "next/server";
import fs from "node:fs";
import { createReadStream, promises as fsp } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import archiver from "archiver";

export const runtime = "nodejs";

const TEMP_DIR = process.env.TEMP_DIR ?? "/app/temp";

function safeJobId(raw: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(raw)) throw new Error("jobId inválido");
  return raw;
}

async function listSegments(dir: string): Promise<string[]> {
  const items = await fsp.readdir(dir);
  return items.filter((f) => f.endsWith(".mp4")).sort();
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("jobId");
  if (!rawId) return new Response("Missing jobId", { status: 400 });

  const jobId = safeJobId(rawId);
  const outDir = path.join(TEMP_DIR, `output_${jobId}`);

  try {
    const files = await listSegments(outDir);
    console.log(`📦 segments(${jobId}): count=${files.length}`, files.slice(0, 5));

    if (files.length === 0) {
      return new Response("No segments found", { status: 404 });
    }

    if (files.length === 1) {
      const file = path.join(outDir, files[0]);
      const stat = await fsp.stat(file);
      const headers = new Headers({
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        "Content-Disposition": `attachment; filename="${jobId}.mp4"`,
        "Cache-Control": "no-store",
      });
      const body = Readable.toWeb(createReadStream(file)) as unknown as BodyInit;
      return new Response(body, { headers });
    }

    const zip = archiver("zip", { zlib: { level: 9 } });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        zip.on("data", (d: Buffer) => controller.enqueue(d));
        zip.on("end", () => controller.close());
        zip.on("error", (err: Error) => controller.error(err));

        for (const f of files) {
          const p = path.join(outDir, f);
          zip.append(fs.createReadStream(p), { name: f });
        }
        void zip.finalize();
      },
      cancel() {
        zip.abort();
      },
    });

    const headers = new Headers({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${jobId}.zip"`,
      "Cache-Control": "no-store",
    });

    return new Response(stream as unknown as BodyInit, { headers });
  } catch (err) {
    console.error("download error:", err);
    return new Response("Internal error", { status: 500 });
  }
}