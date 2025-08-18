export type JsonPrimitive = string | number | boolean | null;
export type Json = JsonPrimitive | Json[] | { [key: string]: Json };

export interface SplitResp { ok: true; jobId: string }
export interface ProgressFile { name: string; url: string }
export interface ProgressResp {
  ok: boolean;
  progress?: number;
  files?: ProgressFile[];
  error?: string;
}

/** Extrae "error" seguro de un JSON desconocido */
export function getErrorFromJson(x: unknown): string | null {
  if (typeof x === "object" && x !== null && "error" in (x as Record<string, unknown>)) {
    const v = (x as Record<string, unknown>).error;
    if (typeof v === "string") return v;
  }
  return null;
}

/** Hace fetch y devuelve JSON tipado, lanzando error con mensaje útil si no es OK */
export async function postJsonSafe<T = Json>(
  url: string,
  opts: RequestInit
): Promise<T> {
  const res = await fetch(url, { ...opts, cache: "no-store", credentials: "same-origin" });
  const text = await res.text();

  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* no-op */
  }

  if (!res.ok) {
    const msg =
      getErrorFromJson(parsed) ??
      (text || `HTTP ${res.status}`);
    throw new Error(String(msg));
  }

  return parsed as T;
}

/** Lanza el split y hace polling cada 1s hasta que existan archivos */
export async function startSplitAndPoll(
  formData: FormData,
  onProgress: (n: number) => void
): Promise<{ jobId: string; files: ProgressFile[] }> {
  const split = await postJsonSafe<SplitResp>("/api/split-video", { method: "POST", body: formData });
  const jobId = split.jobId;

  for (;;) {
    await new Promise((r) => setTimeout(r, 1000));
    const data = await postJsonSafe<ProgressResp>(`/api/progress?job=${encodeURIComponent(jobId)}`, { method: "GET" });

    if (typeof data.progress === "number") onProgress(data.progress);
    if (Array.isArray(data.files) && data.files.length > 0) {
      return { jobId, files: data.files };
    }
  }
}