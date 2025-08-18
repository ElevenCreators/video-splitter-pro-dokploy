// src/app/api/split-video/route.ts
import { NextRequest } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { TEMP_DIR } from "@/lib/paths";
import { splitVideo } from "@/server/jobs/splitVideo";
import { startTempCleaner } from "@/server/tempCleaner";
startTempCleaner(); // inicia una vez por proceso

export const runtime = "nodejs";

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
function truthyFlag(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return Response.json({ ok: false, error: "Expected multipart/form-data" }, { status: 415 });
    }

    const form = await req.formData();

    // archivo: soporta diferentes nombres ("video", "file", "upload")
    const fileField =
      (form.get("video") as unknown as File | null) ??
      (form.get("file") as unknown as File | null) ??
      (form.get("upload") as unknown as File | null);

    if (!fileField) {
      return Response.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    // seconds: soporta "seconds" o "segmentLength"
    const rawSeconds = form.get("seconds") ?? form.get("segmentLength");
    let seconds = parseInt(String(rawSeconds ?? "").trim(), 10);
    if (!Number.isFinite(seconds) || seconds < 1) seconds = 5;         // default seguro
    if (seconds > 600) seconds = 600;                                  // límite razonable

    // modo: usa "mode" (copy|reencode), o deduce a partir de allowReencode
    const rawMode = (form.get("mode") as string | null) ?? null;
    const allowReencode = truthyFlag(form.get("allowReencode"));
    const mode = (rawMode === "reencode" || rawMode === "copy")
      ? (rawMode as "copy" | "reencode")
      : (allowReencode ? "reencode" : "copy");

    // exactSegments: útil para forzar keyframes si tu splitVideo lo usa internamente
    const exactSegments = truthyFlag(form.get("exactSegments"));

    const jobId = genId();
    const inputName = `input_${jobId}_${safeName((fileField as File).name || "video.mp4")}`;
    const inputPath = path.join(TEMP_DIR, inputName);

    // Crear temp y guardar archivo
    await fs.mkdir(TEMP_DIR, { recursive: true });
    const buf = Buffer.from(await (fileField as File).arrayBuffer());
    await fs.writeFile(inputPath, buf);

    // LOG de verificación
    console.log(
      `🆔 Created job: ${jobId} ` +
      `name="${(fileField as File).name}" ` +
      `seconds=${seconds} mode=${mode} exact=${exactSegments} ` +
      `input="${inputPath}"`
    );

    // Ejecutar job
    await splitVideo(jobId, inputPath, seconds, mode);
    // Si tu splitVideo acepta opciones, podrías pasar exactSegments también:
    // await splitVideo(jobId, inputPath, seconds, mode, { exactSegments });

    return Response.json(
      { ok: true, jobId },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("split-video error", err);
    return Response.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
