"use client";

import { useEffect } from "react";

// Registers the service worker so the app is installable from the browser.
export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    }
  }, []);
  return null;
}
