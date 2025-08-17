import { NextRequest } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nodeToWebStream(s: fs.ReadStream): ReadableStream {
  // Node >=18: Readable.toWeb existe
  // @ts-expect-error - types mismatch between Node/Web readable
  return Readable.toWeb(s);
}

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function sendFile(req: NextRequest, headOnly: boolean) {
  try {
    const url = new URL(req.url);
    const job = url.searchParams.get("job") || "";
    const fileParam = url.searchParams.get("file") || "";
    if (!job || !fileParam) return badRequest("Missing job/file");

    const safeFile = path.basename(fileParam); // evita traversal
    const baseDir = path.join("/app/temp", output_);
    const filePath = path.join(baseDir, safeFile);

    if (!fs.existsSync(filePath)) {
      return badRequest("File not found", 404);
    }

    const stat = await fsp.stat(filePath);
    const total = stat.size;
    const range = req.headers.get("range");

    const common = {
      "content-type": "video/mp4",
      "accept-ranges": "bytes",
      "content-disposition": ttachment; filename="",
      "cache-control": "no-store",
    } as Record<string, string>;

    if (range) {
      // e.g. Range: bytes=START-END
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = 0;
      let end = total - 1;
      if (m) {
        if (m[1]) start = Math.max(0, parseInt(m[1], 10));
        if (m[2]) end = Math.min(total - 1, parseInt(m[2], 10));
      }
      if (start > end || start >= total) {
        return new Response(null, {
          status: 416,
          headers: {
            ...common,
            "content-range": ytes */,
          },
        });
      }

      const chunkSize = end - start + 1;
      const headers = {
        ...common,
        "content-length": String(chunkSize),
        "content-range": ytes -/,
      };

      if (headOnly) {
        return new Response(null, { status: 206, headers });
      }

      const stream = fs.createReadStream(filePath, { start, end });
      return new Response(nodeToWebStream(stream), { status: 206, headers });
    }

    // Respuesta completa
    const headers = {
      ...common,
      "content-length": String(total),
    };

    if (headOnly) {
      return new Response(null, { status: 200, headers });
    }

    const stream = fs.createReadStream(filePath);
    return new Response(nodeToWebStream(stream), { status: 200, headers });
  } catch (err) {
    console.error("download error:", err);
    return badRequest("Internal error", 500);
  }
}

export async function GET(req: NextRequest) {
  return sendFile(req, false);
}
export async function HEAD(req: NextRequest) {
  return sendFile(req, true);
}
