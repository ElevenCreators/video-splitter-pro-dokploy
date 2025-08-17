export type JobStatus = "queued" | "running" | "done" | "error";
export type JobInfo = {
  status: JobStatus;
  progress: number;            // 0..100
  files?: { name: string; url: string }[];
  error?: string;
  startedAt: number;
  updatedAt: number;
};

const jobs = new Map<string, JobInfo>();

export function createJob(id: string) {
  jobs.set(id, { status: "queued", progress: 0, startedAt: Date.now(), updatedAt: Date.now() });
}

export function setProgress(id: string, progress: number) {
  const j = jobs.get(id);
  if (!j) return;
  j.progress = Math.max(0, Math.min(100, progress));
  if (j.status === "queued") j.status = "running";
  j.updatedAt = Date.now();
}

export function completeJob(id: string, files: { name: string; url: string }[]) {
  const j = jobs.get(id);
  if (!j) return;
  j.status = "done";
  j.progress = 100;
  j.files = files;
  j.updatedAt = Date.now();
}

export function failJob(id: string, error: string) {
  const now = Date.now();
  const j = jobs.get(id) || { status: "error", progress: 0, startedAt: now, updatedAt: now };
  j.status = "error";
  j.error = error;
  j.updatedAt = Date.now();
  jobs.set(id, j);
}

export function getJob(id: string) {
  return jobs.get(id);
}

// Limpieza opcional
export function gc(seconds = 3600) {
  const now = Date.now();
  for (const [id, j] of jobs) {
    if (now - j.updatedAt > seconds * 1000) jobs.delete(id);
  }
}
