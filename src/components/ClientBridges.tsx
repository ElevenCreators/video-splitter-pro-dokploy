// src/components/ClientBridges.tsx
"use client";
import { useEffect } from "react";

type JsonOk = { ok?: boolean; jobId?: string };

function isTargetUrl(
  input: RequestInfo | URL | string,
  targets: string[],
  base: string
): boolean {
  try {
    const s =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url;
    const url = new URL(s, window.location.origin);
    return targets.some((p) => url.pathname === base + p);
  } catch {
    const s = String((input as Request | URL | string) ?? "");
    return targets.some((p) => s.includes(p));
  }
}

export default function ClientBridges() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const targets = ["/api/split-video", "/api/process"];

    const origFetch: typeof window.fetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input, init);
      try {
        if (isTargetUrl(input, targets, base)) {
          const clone = res.clone();
          const ct = clone.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const data: JsonOk = await clone.json().catch(() => ({}));
            if (res.ok && data?.ok && data?.jobId) {
              const id = String(data.jobId);
              sessionStorage.setItem("split:lastJobId", id);
              sessionStorage.setItem("split:lastJobAt", String(Date.now()));
              window.dispatchEvent(
                new CustomEvent("split:job", { detail: { jobId: id } })
              );
            }
          }
        }
      } catch {
        // ignore
      }
      return res;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    let lastUrl = "";
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string,
      ...rest: [boolean?, string?, string?]
    ) {
      lastUrl = url;
      return origOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null
    ) {
      this.addEventListener("load", () => {
        try {
          if (
            isTargetUrl(lastUrl, targets, base) &&
            this.status >= 200 &&
            this.status < 300
          ) {
            const ct = this.getResponseHeader("content-type") ?? "";
            if (ct.includes("application/json")) {
              const data = JSON.parse(this.responseText) as JsonOk;
              if (data?.ok && data?.jobId) {
                const id = String(data.jobId);
                sessionStorage.setItem("split:lastJobId", id);
                sessionStorage.setItem("split:lastJobAt", String(Date.now()));
                window.dispatchEvent(
                  new CustomEvent("split:job", { detail: { jobId: id } })
                );
              }
            }
          }
        } catch {
          // ignore
        }
      });
      return origSend.call(this, body);
    };

    return () => {
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
      XMLHttpRequest.prototype.send = origSend;
    };
  }, []);

  return null;
}
