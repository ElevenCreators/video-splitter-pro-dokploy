// src/app/api/segment/route.ts
import { NextRequest } from "next/server";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { TEMP_DIR } from "@/lib/paths";

export const runtime = "nodejs";

function isValidName(n: string) {
  return /^segment_\d{3}\.mp4$/.test(n);
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const file = searchParams.get("file");
  const inline = searchParams.get("inline") === "1";

  if (!jobId || !file || !isValidName(file)) {
    return new Response("Bad Request", { status: 400 });
  }

  const filePath = path.join(TEMP_DIR, `output_${jobId}`, file);

  try {
    await fsp.access(filePath);
    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${file}"`
    );
    headers.set("Cache-Control", "no-store");

    return new Response(webStream, { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
