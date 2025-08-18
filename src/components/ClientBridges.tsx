// src/components/ClientBridges.tsx
"use client";
import { useEffect } from "react";

export default function ClientBridges() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "");
    const targets = ["/api/split-video", "/api/process"];
    const isTarget = (u: string) => {
      try {
        const url = new URL(u, window.location.origin);
        return targets.some((p) => url.pathname === base + p);
      } catch {
        return typeof u === "string" && targets.some((p) => u.includes(p));
      }
    };

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input as any, init as any);
      try {
        const url = typeof input === "string" ? input : (input as Request)?.url ?? "";
        if (isTarget(url)) {
          const clone = res.clone();
          const ct = clone.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data: any = await clone.json().catch(() => null);
            if (res.ok && data?.ok && data?.jobId) {
              const id = String(data.jobId);
              sessionStorage.setItem("split:lastJobId", id);
              sessionStorage.setItem("split:lastJobAt", String(Date.now())); // <-- NUEVO
              window.dispatchEvent(new CustomEvent("split:job", { detail: { jobId: id } }));
            }
          }
        }
      } catch {}
      return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    let lastUrl = "";
    (XMLHttpRequest.prototype as any).open = function (method: string, url: string) {
      lastUrl = url;
      return origOpen.apply(this, arguments as any);
    };
    (XMLHttpRequest.prototype as any).send = function (body?: any) {
      const xhr = this as XMLHttpRequest;
      xhr.addEventListener("load", () => {
        try {
          const ok = xhr.status >= 200 && xhr.status < 300;
          if (ok && isTarget(lastUrl)) {
            const ct = xhr.getResponseHeader("content-type") || "";
            if (ct.includes("application/json")) {
              const data = JSON.parse(xhr.responseText);
              if (data?.ok && data?.jobId) {
              const id = String(data.jobId);
              sessionStorage.setItem("split:lastJobId", id);
              sessionStorage.setItem("split:lastJobAt", String(Date.now())); // <-- NUEVO
              window.dispatchEvent(new CustomEvent("split:job", { detail: { jobId: id } }));
              }
            }
          }
        } catch {}
      });
      return origSend.apply(this, arguments as any);
    };

    return () => {
      window.fetch = origFetch;
      (XMLHttpRequest.prototype as any).open = origOpen;
      (XMLHttpRequest.prototype as any).send = origSend;
    };
  }, []);
  return null;
}
