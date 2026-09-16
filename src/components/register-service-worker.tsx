"use client";

import { useEffect } from "react";

// Registers the PWA service worker so the browser treats the app as
// installable. Renders nothing -- fire-and-forget, same shape as
// ScrollToTop. Safe to no-op in unsupported browsers/environments.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed", err);
    });
  }, []);

  return null;
}
