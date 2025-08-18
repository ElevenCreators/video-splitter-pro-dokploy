// src/app/process-test/page.tsx
"use client";
import { useState } from "react";
import DownloadButton from "@/components/DownloadButton";

type Resp = { ok: boolean; jobId?: string; error?: string };

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState<number>(5);
  const [mode, setMode] = useState<"copy" | "reencode">("reencode");
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setStatus("Procesando...");
      setJobId("");

      if (!file) { setStatus("Selecciona un archivo"); return; }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("seconds", String(seconds));
      fd.append("mode", mode);

      const res = await fetch("/api/split-video", { method: "POST", body: fd });
      const data = (await res.json()) as Resp;

      if (!res.ok || !data.ok || !data.jobId) {
        setStatus("Error: " + (data.error ?? "desconocido"));
        return;
      }
      setJobId(String(data.jobId));
      setStatus("Listo. Usa el botón para descargar o revisa debug-segments.");
    } catch (err: any) {
      setStatus("Error: " + (err?.message ?? String(err)));
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Process Test</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full"
          required
        />
        <label className="block">
          <span>Seconds per segment</span>
          <input
            type="number"
            min={1}
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full"
          />
        </label>
        <label className="block">
          <span>Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "copy" | "reencode")}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="reencode">reencode (cortes exactos)</option>
            <option value="copy">copy (rápido, cortes aproximados)</option>
          </select>
        </label>
        <button type="submit" className="px-3 py-2 rounded bg-black text-white">
          Procesar
        </button>
      </form>

      {status && <p className="text-sm">{status}</p>}

      {jobId && (
        <div className="space-y-2">
          <DownloadButton jobId={jobId} />
          <div className="text-sm">
            <a
              className="underline"
              href={`/api/debug-segments?jobId=${encodeURIComponent(jobId)}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver debug-segments
            </a>
          </div>
        </div>
      )}
    </main>
  );
}