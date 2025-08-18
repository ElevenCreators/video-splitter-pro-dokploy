// src/lib/logging.ts
export type Mode = "copy" | "reencode";

export function logJobCreated(jobId: string, inputPath: string, seconds: number): void {
  console.log(`🆔 Created job: ${jobId} input="${inputPath}" seconds=${seconds}`);
}
export function logFfmpegStart(jobId: string, mode: Mode, inputPath: string, outputPattern: string): void {
  console.log(`🎬 FFmpeg started [${mode}] (${jobId}): ${inputPath} -> ${outputPattern}`);
}
export function logJobDone(jobId: string, mode: Mode, outDir: string): void {
  console.log(`✅ Job done: ${jobId} [${mode}] outDir=${outDir}`);
}
export function logJobFailed(jobId: string, err: unknown): void {
  console.error(`❌ Job failed: ${jobId}`, err);
}