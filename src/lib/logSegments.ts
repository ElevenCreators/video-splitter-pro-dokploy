// src/lib/logSegments.ts
import { promises as fsp } from "node:fs";
import { outputDirFor } from "./paths";

export async function logSegments(jobId: string): Promise<void> {
  const dir = outputDirFor(jobId);
  try {
    const files = (await fsp.readdir(dir)).filter(f => f.endsWith(".mp4")).sort();
    console.log(`📦 segments(${jobId}): count=${files.length}`, files.slice(0, 5));
  } catch (e) {
    console.error(`❌ no output dir for ${jobId}`, e);
  }
}