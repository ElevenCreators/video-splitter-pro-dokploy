import { NextRequest } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(status: number, msg: string) {
  return new Response(msg, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const job = url.searchParams.get("job");
  const file = url.searchParams.get("file");

  if (!job || !file) return bad(400, "Missing params");

  // Sanitiza nombre de archivo y construye ruta segura
  const safeFile = path.basename(file);
  const baseDir = path.join("/app/temp", `output_${job}`);
  const filePath = path.join(baseDir, safeFile);
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
    return bad(400, "Invalid path");
  }

  try {
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) return bad(404, "Not found");

    const nodeStream = fs.createReadStream(resolved);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

    // Usa RFC 5987 para nombres con UTF-8
    const disp = `attachment; filename="${encodeURIComponent(safeFile)}"; filename*=UTF-8''${encodeURIComponent(safeFile)}`;

    return new Response(webStream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        "Content-Disposition": disp,
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes"
      }
    });
  } catch {
    return bad(404, "Not found");
  }
}
