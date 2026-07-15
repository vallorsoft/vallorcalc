"use client";
import { useEffect } from "react";

// A service worker regisztrálása teszi telepíthetővé a PWA-t (a manifest és
// az ikonok mellett). Csak élesben (production) fut, hogy a fejlesztői HMR-t
// ne zavarja a cache.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
