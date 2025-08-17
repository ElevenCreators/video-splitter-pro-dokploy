import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitize(input: string): string {
  // Evita traversal y caracteres raros
  return input.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const job = searchParams.get("job");
    const file = searchParams.get("file");

    if (!job || !file) {
      return NextResponse.json({ ok: false, error: "Missing job or file" }, { status: 400 });
    }

    const safeJob = sanitize(job);
    const safeFile = sanitize(file);

    const baseDir = "/app/temp";
    const outDir = path.join(baseDir, `output_${safeJob}`);
    const absRoot = path.resolve(baseDir);
    const absDir  = path.resolve(outDir);
    const absFile = path.resolve(path.join(absDir, safeFile));

    // Seguridad: el archivo debe estar dentro de /app/temp
    if (!absDir.startsWith(absRoot) || !absFile.startsWith(absDir)) {
      return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 400 });
    }

    await fsp.access(absFile, fs.constants.R_OK);
    const stat = await fsp.stat(absFile);
    const stream = fs.createReadStream(absFile);

    const headers = new Headers();
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", `attachment; filename="${safeFile}"`);
    headers.set("Content-Length", String(stat.size));
    headers.set("Cache-Control", "no-store");

    return new Response(stream as unknown as ReadableStream, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const notFound = /ENOENT|no such file/i.test(msg);
    return NextResponse.json(
      { ok: false, error: notFound ? "File not found" : msg },
      { status: notFound ? 404 : 500 }
    );
  }
}
