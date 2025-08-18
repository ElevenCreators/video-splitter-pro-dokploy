"use client";
import { useState } from "react";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function DownloadById() {
  const [jobId, setJobId] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    if (!jobId) return;
    setLoading(true); setErr(""); setFiles([]);
    try {
      let r = await fetch(`${base}/api/list-segments?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
      if (!r.ok && r.status === 404) {
        r = await fetch(`${base}/api/debug-segments?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
      }
      const j = await r.json();
      setFiles(Array.isArray(j.files) ? j.files : []);
      if (!Array.isArray(j.files)) setErr(j.error || "No files");
    } catch (e) { setErr(String(e)); } finally { setLoading(false); }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Descargar por JobID</h1>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded border bg-transparent"
          value={jobId}
          onChange={(e)=>setJobId(e.target.value)}
          placeholder="Pega tu JobID aquí"
        />
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading?"Cargando...":"Buscar"}
        </button>
      </div>

      {jobId && (
        <div className="flex items-center gap-2">
          <a className="btn btn-primary" href={`${base}/api/download?jobId=${encodeURIComponent(jobId)}`}>
            Descargar ZIP
          </a>
          <button className="btn btn-muted" onClick={load} disabled={loading}>
            Actualizar lista
          </button>
        </div>
      )}

      {!!err && <p className="text-sm text-red-400">{err}</p>}

      <ul className="divide-y border rounded">
        {files.length === 0 ? (
          <li className="p-3 text-sm text-[var(--fg-muted)]">Sin segmentos.</li>
        ) : files.map((f)=>(
          <li key={f} className="p-3 flex items-center justify-between">
            <span className="truncate pr-3" title={f}>{f}</span>
            <a className="btn btn-muted text-sm"
               href={`${base}/api/segment?jobId=${encodeURIComponent(jobId)}&file=${encodeURIComponent(f)}`}>
              Descargar
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
