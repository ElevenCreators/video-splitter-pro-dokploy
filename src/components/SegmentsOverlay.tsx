// src/components/SegmentsOverlay.tsx
"use client";
import { useEffect, useState } from "react";

type DebugResp =
  | { tempDir: string; outDir: string; count: number; files: string[] }
  | { error: string };

export default function SegmentsOverlay() {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  const [jobId, setJobId] = useState<string>("");
  const [files, setFiles] = useState<string[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  async function loadList(id: string) {
    try {
      setLoading(true);
      const res = await fetch(
        `${base}/api/debug-segments?jobId=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as DebugResp;
      if ("files" in data && Array.isArray(data.files)) {
        setFiles(data.files);
        setOpen(true);
      } else {
        setFiles([]);
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const last = sessionStorage.getItem("split:lastJobId");
    if (last) {
      setJobId(last);
      void loadList(last);
    }
    const onEvt = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (detail.jobId) {
        const id = String(detail.jobId);
        setJobId(id);
        void loadList(id);
      }
    };
    window.addEventListener("split:job", onEvt as EventListener);
    return () => window.removeEventListener("split:job", onEvt as EventListener);
  }, []);

  if (!open || !jobId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[95vw] rounded-xl border shadow-lg bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="font-semibold text-sm">Segmentos listos</div>
        <button
          className="text-xs px-2 py-1 border rounded"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
        >
          Cerrar
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-xs text-gray-600 break-all">jobId: {jobId}</div>

        <div className="flex gap-2">
          <a
            className="px-3 py-2 text-sm rounded bg-black text-white"
            href={`${base}/api/download?jobId=${encodeURIComponent(jobId)}`}
          >
            Descargar ZIP
          </a>
          <button
            className="px-3 py-2 text-sm rounded border"
            onClick={() => loadList(jobId)}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div className="max-h-60 overflow-auto border rounded">
          {files.length === 0 ? (
            <div className="text-sm p-3">No se encontraron segmentos.</div>
          ) : (
            <ul className="text-sm divide-y">
              {files.map((f) => (
                <li
                  key={f}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="truncate pr-2">{f}</span>
                  <a
                    className="text-blue-600 underline"
                    href={`${base}/api/segment?jobId=${encodeURIComponent(
                      jobId
                    )}&file=${encodeURIComponent(f)}`}
                  >
                    Descargar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
