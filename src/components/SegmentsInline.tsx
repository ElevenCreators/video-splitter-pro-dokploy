// src/components/SegmentsInline.tsx
"use client";
import { useCallback, useEffect, useState } from "react";

type DebugResp =
  | { tempDir: string; outDir: string; count: number; files: string[] }
  | { error: string };

type Props = {
  initialJobId?: string;
  autoload?: boolean;
  autoloadWindowMinutes?: number;
};

export default function SegmentsInline({
  initialJobId,
  autoload = false,
  autoloadWindowMinutes = 10,
}: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const [jobId, setJobId] = useState<string>(initialJobId ?? "");
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (id = jobId) => {
      if (!id) return;
      setLoading(true);
      try {
        const r = await fetch(
          `${base}/api/debug-segments?jobId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const d = (await r.json()) as DebugResp;
        setFiles("files" in d && Array.isArray(d.files) ? d.files : []);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    },
    [jobId, base]
  );

  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      void refresh(initialJobId);
      return;
    }

    if (autoload) {
      const last = sessionStorage.getItem("split:lastJobId");
      const at = Number(sessionStorage.getItem("split:lastJobAt") ?? "0");
      const windowMs = (autoloadWindowMinutes || 0) * 60_000;
      const isFresh = at > 0 && Date.now() - at < windowMs;
      if (last && isFresh) {
        setJobId(last);
        void refresh(last);
      } else {
        sessionStorage.removeItem("split:lastJobId");
        sessionStorage.removeItem("split:lastJobAt");
      }
    }

    const onEvt = (e: Event) => {
      const detail = (e as CustomEvent).detail as { jobId?: string } | undefined;
      if (detail?.jobId) {
        const id = String(detail.jobId);
        setJobId(id);
        void refresh(id);
      }
    };
    window.addEventListener("split:job", onEvt as EventListener);
    return () => window.removeEventListener("split:job", onEvt as EventListener);
  }, [initialJobId, autoload, autoloadWindowMinutes, refresh]);

  if (!jobId) return null;

  return (
    <section className="mt-6 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">
          Download Clips <span className="text-[var(--fg-muted)]">({files.length})</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="btn btn-muted text-sm"
            aria-label="Actualizar lista de segmentos"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <a
            className="btn btn-primary text-sm"
            href={`${base}/api/download?jobId=${encodeURIComponent(jobId)}`}
            aria-label="Descargar todos en ZIP"
          >
            Descargar ZIP
          </a>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--border-subtle)] overflow-hidden">
        {files.length === 0 ? (
          <div className="py-4 px-4 text-sm text-[var(--fg-muted)]">No hay segmentos aún.</div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {files.map((f) => (
              <li key={f} className="flex items-center justify-between py-2.5 px-4">
                <span className="truncate pr-3" title={f}>
                  {f}
                </span>
                <a
                  className="btn btn-muted text-sm"
                  href={`${base}/api/segment?jobId=${encodeURIComponent(jobId)}&file=${encodeURIComponent(f)}`}
                  aria-label={`Descargar ${f}`}
                >
                  Descargar
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
