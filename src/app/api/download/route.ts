import { NextRequest } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(status: number, msg: string) {
  return new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const job = url.searchParams.get("job");
  const file = url.searchParams.get("file");

  if (!job || !file) return bad(400, "Missing params");

  // Sanitizar file y resolver ruta segura
  const safeFile = path.basename(file);
  const baseDir = path.join("/app/temp", `output_${job}`);
  const filePath = path.join(baseDir, safeFile);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(baseDir))) return bad(400, "Invalid path");

  try {
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) return bad(404, "Not found");

    const stream = fs.createReadStream(resolved);
    return new Response(stream as any, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        // Content-Disposition con filename seguro (sin comillas raras)
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeFile)}"`,
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes"
      }
    });
  } catch {
    return bad(404, "Not found");
  }
}
