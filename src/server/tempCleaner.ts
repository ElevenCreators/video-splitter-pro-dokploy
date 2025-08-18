// src/server/tempCleaner.ts
import path from "node:path";
import { promises as fsp } from "node:fs";
import { TEMP_DIR } from "@/lib/paths";

const g = globalThis as any;

export function startTempCleaner() {
  if (g.__tempCleanerStarted) return;
  g.__tempCleanerStarted = true;

  const ttlMin = Number(process.env.TEMP_TTL_MINUTES ?? "60");
  const everyMin = Number(process.env.TEMP_CLEAN_INTERVAL_MINUTES ?? "10");

  const ttlMs = Math.max(1, ttlMin) * 60_000;
  const intervalMs = Math.max(1, everyMin) * 60_000;

  async function sweep() {
    const now = Date.now();
    let deleted = 0;
    try {
      await fsp.mkdir(TEMP_DIR, { recursive: true });
      const entries = await fsp.readdir(TEMP_DIR, { withFileTypes: true });
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const name = ent.name;
        if (!/^output_|^input_/.test(name)) continue;
        const dir = path.join(TEMP_DIR, name);
        try {
          const st = await fsp.stat(dir);
          const age = now - st.mtimeMs;
          if (age > ttlMs) {
            await fsp.rm(dir, { recursive: true, force: true });
            deleted++;
          }
        } catch {}
      }
      console.log(`🧹 temp-cleaner: ttl=${ttlMin}m interval=${everyMin}m, deleted=${deleted}`);
    } catch (e) {
      console.warn("⚠️ temp-cleaner error:", e);
    }
  }

  sweep().catch(()=>{});
  setInterval(sweep, intervalMs);
}
