// src/components/FetchSplitBridge.tsx
"use client";
import { useEffect } from "react";
import { triggerDownload } from "@/lib/triggerDownload";

export default function FetchSplitBridge() {
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "");
    const isSplitUrl = (u: string) => {
      try { const url = new URL(u, window.location.origin); return url.pathname === base + "/api/split-video"; }
      catch { return u.includes("/api/split-video"); }
    };

    // patch fetch
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input as any, init as any);
      try {
        const url = typeof input === "string" ? input : (input as Request)?.url ?? "";
        if (isSplitUrl(url)) {
          const clone = res.clone();
          const ct = clone.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const data = await clone.json().catch(() => null) as any;
            if (res.ok && data?.ok && data?.jobId) {
              triggerDownload(`${base}/api/download?jobId=${encodeURIComponent(String(data.jobId))}`);
            }
          }
        }
      } catch {}
      return res;
    };

    // patch XHR (axios, etc)
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    let lastUrl = "";
    (XMLHttpRequest.prototype as any).open = function(method: string, url: string) {
      lastUrl = url;
      return origOpen.apply(this, arguments as any);
    };
    (XMLHttpRequest.prototype as any).send = function(body?: any) {
      const xhr = this as XMLHttpRequest;
      xhr.addEventListener("load", () => {
        try {
          if (isSplitUrl(lastUrl) && xhr.status >= 200 && xhr.status < 300) {
            const ct = xhr.getResponseHeader("content-type") || "";
            if (ct.includes("application/json")) {
              const data = JSON.parse(xhr.responseText);
              if (data?.ok && data?.jobId) {
                triggerDownload(`${base}/api/download?jobId=${encodeURIComponent(String(data.jobId))}`);
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