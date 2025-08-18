// src/app/api/segment/route.ts
import { NextRequest } from "next/server";
import { TEMP_DIR } from "@/lib/paths";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";

export const runtime = "nodejs";

function safeJobId(raw: string | null): string {
  if (!raw) throw new Error("Missing jobId");
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error("Invalid jobId");
  return raw;
}
function safeFile(raw: string | null): string {
  if (!raw) throw new Error("Missing file");
  // segment_000.mp4, segment_001.mp4, etc.
  if (!/^segment_\d{3}\.mp4$/.test(raw)) throw new Error("Invalid file name");
  return raw;
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = safeJobId(searchParams.get("jobId"));
    const file = safeFile(searchParams.get("file"));

    const outDir = path.join(TEMP_DIR, `output_${jobId}`);
    const filePath = path.join(outDir, file);
    const stat = await fsp.stat(filePath);

    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    });

    const body = Readable.toWeb(createReadStream(filePath)) as unknown as BodyInit;
    return new Response(body, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

