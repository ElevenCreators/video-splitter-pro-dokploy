// src/components/SegmentsInline.tsx
"use client";
import { useCallback, useEffect, useState } from "react";

type Props = {
  initialJobId?: string;
  autoload?: boolean;
  autoloadWindowMinutes?: number;
};

function readFiles(obj: unknown): string[] {
  if (typeof obj === "object" && obj !== null) {
    const rec = obj as Record<string, unknown>;
    const f = rec["files"];
    if (Array.isArray(f) && f.every((s) => typeof s === "string")) {
      return f as string[];
    }
  }
  return [];
}

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
    async (idArg?: string) => {
      const id = idArg ?? jobId;
      if (!id) return;
      setLoading(true);
      try {
        // 1) endpoint de producción
        let fetched: string[] = [];
        try {
          const r1 = await fetch(
            `${base}/api/list-segments?jobId=${encodeURIComponent(id)}`,
            { cache: "no-store" }
          );
          if (r1.ok) {
            const d1 = await r1.json();
            fetched = readFiles(d1);
          } else if (r1.status !== 404) {
            throw new Error("list-segments failed");
          }
        } catch {
          // seguimos a fallback
        }

        // 2) fallback a debug (si existe)
        if (fetched.length === 0) {
          try {
            const r2 = await fetch(
              `${base}/api/debug-segments?jobId=${encodeURIComponent(id)}`,
              { cache: "no-store" }
            );
            if (r2.ok) {
              const d2 = await r2.json();
              fetched = readFiles(d2);
            }
          } catch {
            // ignore
          }
        }

        setFiles(fetched);
      } finally {
        setLoading(false);
      }
    },
    [jobId, base]
  );

  useEffect(() => {
    // prioridad: initialJobId
    if (initialJobId) {
      setJobId(initialJobId);
      void refresh(initialJobId);
      return;
    }

    // autoload desde sessionStorage si está fresco
    if (autoload) {
      const last =
        typeof window !== "undefined"
          ? sessionStorage.getItem("split:lastJobId")
          : null;
      const at =
        typeof window !== "undefined"
          ? Number(sessionStorage.getItem("split:lastJobAt") ?? "0")
          : 0;
      const windowMs = autoloadWindowMinutes * 60_000;
      const isFresh = at > 0 && Date.now() - at < windowMs;
      if (last && isFresh) {
        setJobId(last);
        void refresh(last);
      }
    }

    // escucha del evento global emitido por ClientBridges/handleSplit
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
          Download Clips{" "}
          <span className="text-[var(--fg-muted)]">({files.length})</span>
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
          <div className="py-4 px-4 text-sm text-[var(--fg-muted)]">
            No hay segmentos aún.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {files.map((f) => (
              <li
                key={f}
                className="flex items-center justify-between py-2.5 px-4"
              >
                <span className="truncate pr-3" title={f}>
                  {f}
                </span>
                <a
                  className="btn btn-muted text-sm"
                  href={`${base}/api/segment?jobId=${encodeURIComponent(
                    jobId
                  )}&file=${encodeURIComponent(f)}`}
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
