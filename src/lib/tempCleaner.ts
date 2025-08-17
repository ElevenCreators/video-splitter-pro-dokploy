import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const BASE = "/app/temp";

// Config desde env (con defaults sensatos)
const TTL_MIN   = parseInt(process.env.CLEAN_TTL_MIN   ?? "60", 10); // 1h
const MAX_GB    = parseInt(process.env.CLEAN_MAX_GB    ?? "50", 10); // 50GB
const EVERY_MIN = parseInt(process.env.CLEAN_INTERVAL_MIN ?? "10", 10); // cada 10m

type DirInfo = { name: string; full: string; createdAt: number; size: number };

function parseCreated(name: string, full: string): number {
  // output_<timestamp>_xxxx
  const m = /^output_(\d+)/.exec(name);
  if (m) return Number(m[1]);
  try { return fs.statSync(full).mtimeMs; } catch { return Date.now(); }
}

async function dirSize(full: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fsp.readdir(full, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(full, e.name);
      if (e.isDirectory()) total += await dirSize(p);
      else {
        try { total += (await fsp.stat(p)).size; } catch {}
      }
    }
  } catch {}
  return total;
}

async function listJobs(): Promise<DirInfo[]> {
  const out: DirInfo[] = [];
  try {
    const entries = await fsp.readdir(BASE, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (!e.name.startsWith("output_")) continue;
      const full = path.join(BASE, e.name);
      const size = await dirSize(full);
      const createdAt = parseCreated(e.name, full);
      out.push({ name: e.name, full, createdAt, size });
    }
  } catch {}
  return out;
}

export async function cleanOnce(): Promise<{ deleted: string[]; freed: number; totalAfter: number; kept: number }> {
  const now = Date.now();
  const TTL_MS = TTL_MIN * 60_000;
  const MAX_BYTES = MAX_GB * 1024 ** 3;

  const jobs = await listJobs();
  let total = jobs.reduce((s, j) => s + j.size, 0);
  const deleted: string[] = [];
  let freed = 0;

  // 1) Borra por TTL
  for (const j of jobs) {
    if (now - j.createdAt > TTL_MS) {
      try { await fsp.rm(j.full, { recursive: true, force: true }); } catch {}
      deleted.push(j.name);
      freed += j.size;
      total -= j.size;
    }
  }

  // 2) Si aún excede el límite, borra los más viejos
  if (total > MAX_BYTES) {
    const remaining = (await listJobs()).sort((a, b) => a.createdAt - b.createdAt);
    for (const j of remaining) {
      if (total <= MAX_BYTES) break;
      try { await fsp.rm(j.full, { recursive: true, force: true }); } catch {}
      deleted.push(j.name);
      freed += j.size;
      total -= j.size;
    }
  }

  return { deleted, freed, totalAfter: total, kept: Math.max(0, (await listJobs()).length) };
}

// Singleton del interval
let started = false;
export function startCleaner() {
  if (started) return;
  started = true;
  const run = async () => {
    try {
      const res = await cleanOnce();
      console.log(`🧹 temp-cleaner: deleted=${res.deleted.length}, freed=${(res.freed/1024/1024).toFixed(1)}MB, totalAfter=${(res.totalAfter/1024/1024/1024).toFixed(2)}GB`);
    } catch (e) {
      console.warn("🧹 temp-cleaner error:", e);
    }
  };
  // primera pasada e intervalos
  run();
  setInterval(run, Math.max(1, EVERY_MIN) * 60_000);
}

export function scheduleDeletion(jobId: string, outDir: string) {
  const TTL_MS = TTL_MIN * 60_000;
  setTimeout(async () => {
    try {
      await fsp.rm(outDir, { recursive: true, force: true });
      console.log(`🧹 scheduled-delete: ${outDir}`);
    } catch {}
  }, TTL_MS);
}
