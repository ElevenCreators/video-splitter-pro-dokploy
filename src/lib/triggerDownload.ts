// src/lib/triggerDownload.ts
export function triggerDownload(url: string): void {
  const isIOS = /iP(hone|ad|od)/i.test(navigator.userAgent);
  if (isIOS) {
    window.location.href = url;
    return;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}