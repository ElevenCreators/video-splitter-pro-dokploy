// src/app/process-test/page.tsx
"use client";
import { useState } from "react";

type JobResponse = { ok: boolean; jobId?: string; error?: string };

export default function ProcessTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [seconds, setSeconds] = useState<number>(8);
  const [mode, setMode] = useState<"copy" | "reencode">("copy");
  const [busy, setBusy] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string>("");

  async function submit() {
    if (!file) return;
    setBusy(true);
    setJobId("");
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("seconds", String(seconds));
      fd.append("mode", mode);
      if (mode === "reencode") fd.append("exactSegments", "1");

      const r = await fetch("/api/split-video", { method: "POST", body: fd });
      const d = (await r.json()) as JobResponse;
      if (!r.ok || !d.ok || !d.jobId) throw new Error(d?.error ?? "Processing failed");

      const id = String(d.jobId);
      setJobId(id);
      sessionStorage.setItem("split:lastJobId", id);
      sessionStorage.setItem("split:lastJobAt", String(Date.now()));
      window.dispatchEvent(new CustomEvent("split:job", { detail: { jobId: id } }));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">process-test</h1>

      <input type="file" accept="video/*" onChange={onFileChange} />
      <div className="flex gap-3 items-center">
        <label className="text-sm">Seconds</label>
        <input
          type="number"
          min={1}
          max={600}
          value={seconds}
          onChange={(e) => setSeconds(Number(e.target.value))}
          className="px-3 py-2 rounded border bg-transparent w-28"
        />
      </div>

      <div className="flex gap-3">
        <label className="text-sm inline-flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "copy"}
            onChange={() => setMode("copy")}
          />
          copy
        </label>
        <label className="text-sm inline-flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "reencode"}
            onChange={() => setMode("reencode")}
          />
          reencode
        </label>
      </div>

      <button className="btn btn-primary" disabled={!file || busy} onClick={submit}>
        {busy ? "Processing..." : "Start"}
      </button>

      {jobId && (
        <div className="space-y-2">
          <div className="text-sm">Job: <code>{jobId}</code></div>
          <div className="flex gap-2">
            <a className="btn btn-muted text-sm" href={`/api/debug-segments?jobId=${encodeURIComponent(jobId)}`} target="_blank">
              Ver lista (debug)
            </a>
            <a className="btn btn-primary text-sm" href={`/api/download?jobId=${encodeURIComponent(jobId)}`}>
              Descargar ZIP
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
