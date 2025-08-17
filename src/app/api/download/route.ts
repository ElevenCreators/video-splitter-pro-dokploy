import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/** RFC5987 filename* encoder */
function encodeRFC5987(value: string): string {
  return encodeURIComponent(value)
    .replace(/['()]/g, escape)
    .replace(/\*/g, "%2A");
}

/** Sanitiza nombre de archivo para evitar traversal */
function safeFileName(name: string): string {
  // elimina separadores y normaliza
  const base = path.basename(name).replace(/[\r\n]/g, "").trim();
  return base || "segment.mp4";
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("job");
    const file  = url.searchParams.get("file");

    if (!jobId || !file) {
      return NextResponse.json({ ok: false, error: "Missing job or file" }, { status: 400, headers: { "cache-control": "no-store" } });
    }

    const baseDir = "/app/temp";
    const dir = path.join(baseDir, `output_${jobId}`);
    const name = safeFileName(file);
    const fullPath = path.join(dir, name);

    try {
      const stat = await fsp.stat(fullPath);
      if (!stat.isFile()) throw new Error("Not a file");
    } catch {
      return NextResponse.json({ ok: false, error: "File not found" }, { status: 404, headers: { "cache-control": "no-store" } });
    }

    const stream = fs.createReadStream(fullPath);
    const headers = new Headers({
      "content-type": "video/mp4",
      "accept-ranges": "bytes",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "pragma": "no-cache",
      "expires": "0",
      "x-accel-buffering": "no",
    });

    const dispName = name;
    headers.set(
      "content-disposition",
      `attachment; filename="${dispName}"; filename*=UTF-8''${encodeRFC5987(dispName)}`
    );

    return new NextResponse(stream as any, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg || "Internal error" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
