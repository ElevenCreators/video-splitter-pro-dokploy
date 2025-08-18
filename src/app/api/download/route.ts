// src/app/api/download/route.ts
import { NextRequest } from "next/server";
import fs from "node:fs";
import { createReadStream, promises as fsp } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";
import archiver from "archiver";
import { TEMP_DIR } from "@/lib/paths";

export const runtime = "nodejs";

function safeJobId(raw: string | null): string {
  if (!raw) throw new Error("Missing jobId");
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Invalid jobId");
  return raw;
}

async function listSegments(dir: string): Promise<string[]> {
  const items = await fsp.readdir(dir);
  return items.filter((f) => f.endsWith(".mp4")).sort();
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const jobId = safeJobId(searchParams.get("jobId"));

  // Logs seguros en ASCII
  console.log("Download request jobId=%s", jobId);

  const outDir = path.join(TEMP_DIR, `output_${jobId}`);
  console.log("Download path TEMP_DIR=%s outDir=%s", TEMP_DIR, outDir);

  try {
    const files = await listSegments(outDir);
    console.log("segments(%s): count=%d first=%s", jobId, files.length, files[0] || "");

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

    // ZIP streaming
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
      cancel() { zip.abort(); },
    });

    const headers = new Headers({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${jobId}.zip"`,
      "Cache-Control": "no-store",
    });

    return new Response(stream as unknown as BodyInit, { headers });
  } catch (err) {
    console.error("download error jobId=%s", jobId, err);
    return new Response("Internal error", { status: 500 });
  }
}