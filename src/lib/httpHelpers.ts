// src/lib/httpHelpers.ts
export async function postJsonSafe(url: string, opts: RequestInit) {
  const res = await fetch(url, { ...opts, cache: "no-store", credentials: "same-origin" });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* texto/HTML */ }
  if (!res.ok) throw new Error(json?.error || text || `HTTP ${res.status}`);
  return json;
}

export async function startSplitAndPoll(formData: FormData, onProgress: (n: number) => void) {
  const { jobId } = await postJsonSafe("/api/split-video", { method: "POST", body: formData });
  for (;;) {
    await new Promise(r => setTimeout(r, 1000));
    const data = await postJsonSafe(`/api/progress?job=${encodeURIComponent(jobId)}`, { method: "GET" });
    if (typeof data.progress === "number") onProgress(data.progress);
    if (Array.isArray(data.files) && data.files.length > 0) return { jobId, files: data.files as { name: string; url: string }[] };
  }
}
