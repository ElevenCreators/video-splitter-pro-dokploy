// src/components/VideoSplitForm.tsx
"use client";
import { useState } from "react";
import DownloadButton from "@/components/DownloadButton";

export default function VideoSplitForm() {
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState<number>(5);
  const [mode, setMode] = useState<"copy" | "reencode">("reencode");
  const [jobId, setJobId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setJobId("");
    if (!file) { setStatus("Selecciona un archivo"); return; }

    try {
      const fd = new FormData();
      // Campo se llama "file" (coincide con el endpoint)
      fd.append("file", file);
      fd.append("seconds", String(seconds));
      fd.append("mode", mode);

      // No establezcas Content-Type manualmente
      const res = await fetch("/api/split-video", { method: "POST", body: fd });
      const data = await res.json() as { ok: boolean; jobId?: string; error?: string };

      if (!res.ok || !data.ok || !data.jobId) {
        setStatus("Error: " + (data.error ?? "desconocido"));
        return;
      }
      setJobId(data.jobId);
      setStatus("Listo. Puedes descargar.");
    } catch (err: any) {
      setStatus("Error: " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
        <div>
          <label className="block text-sm">Seconds</label>
          <input type="number" min={1} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as "copy" | "reencode")} className="border rounded px-3 py-2 w-full">
            <option value="reencode">reencode (exacto)</option>
            <option value="copy">copy (rápido)</option>
          </select>
        </div>
        <button type="submit" className="px-3 py-2 rounded bg-black text-white">Procesar</button>
      </form>

      {status && <p className="text-sm">{status}</p>}
      {jobId && <DownloadButton jobId={jobId} />}
    </div>
  );
}