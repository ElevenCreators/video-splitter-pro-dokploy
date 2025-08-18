import { NextRequest } from "next/server";
import path from "node:path";
import { promises as fsp } from "node:fs";
import { TEMP_DIR } from "@/lib/paths";

export const runtime = "nodejs";

function isSegmentFile(n: string) {
  return /^segment_\d{3}\.mp4$/.test(n);
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ ok: false, error: "Missing jobId" }, { status: 400 });
  }
  const outDir = path.join(TEMP_DIR, `output_${jobId}`);
  try {
    const names = await fsp.readdir(outDir);
    const files = names.filter(isSegmentFile).sort();
    return Response.json(
      { ok: true, count: files.length, files, tempDir: TEMP_DIR, outDir },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ ok: false, error: "Not found", files: [] }, { status: 404 });
  }
}
