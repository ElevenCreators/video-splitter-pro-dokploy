// src/app/api/process/route.ts
import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { TEMP_DIR } from "@/lib/paths";
import { splitVideo } from "@/server/jobs/splitVideo";

export const runtime = "nodejs";

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function POST(req: NextRequest): Promise<Response> {
  const form = await req.formData();
  const file = form.get("file") as unknown as File | null;
  const seconds = Number(form.get("seconds") ?? 5);
  const mode = ((form.get("mode") as string) === "reencode" ? "reencode" : "copy") as
    | "copy"
    | "reencode";

  if (!file) {
    return new Response("Missing file", { status: 400 });
  }

  const jobId = genId();
  const inputName = `input_${jobId}_${safeName((file as File).name || "video.mp4")}`;
  const inputPath = path.join(TEMP_DIR, inputName);

  const buf = Buffer.from(await (file as File).arrayBuffer());
  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.writeFile(inputPath, buf);

  await splitVideo(jobId, inputPath, seconds, mode);

  return new Response(JSON.stringify({ ok: true, jobId }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}