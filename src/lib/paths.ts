// src/lib/paths.ts
import path from "node:path";

export const TEMP_DIR =
  process.env.TEMP_DIR ??
  (process.platform === "win32"
    ? path.join(process.cwd(), "temp")
    : "/app/temp");

export function outputDirFor(jobId: string): string {
  return path.join(TEMP_DIR, `output_${jobId}`);
}

export function segmentPath(outDir: string): string {
  return path.join(outDir, "segment_%03d.mp4");
}