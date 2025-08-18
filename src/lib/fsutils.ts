// src/lib/fsutils.ts
import fs from "node:fs/promises";
import fss from "node:fs";

export async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}
export function existsSync(p: string): boolean {
  try { fss.accessSync(p); return true; } catch { return false; }
}