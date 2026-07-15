"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(callback: () => void) {
  const mq = window.matchMedia(STANDALONE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Menübe illeszthető "Alkalmazás letöltése" gomb a PWA telepítéséhez.
// Ha a böngésző támogatja a natív telepítést, azt használja; egyébként
// (pl. iOS Safari) rövid kézi útmutatót jelenít meg.
export function PwaInstallButton({ onDone }: { onDone?: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    () => false,
  );

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Már telepítve / önálló alkalmazásként fut → nincs teendő.
  if (installed || isStandalone) return null;

  async function handleClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      onDone?.();
      return;
    }
    // Nincs natív telepítési lehetőség → kézi útmutató.
    setShowHelp(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 transition w-full"
      >
        <span>⬇️</span>
        Alkalmazás letöltése
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setShowHelp(false);
            onDone?.();
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">Alkalmazás telepítése</h2>
            <p className="text-sm text-gray-600">
              Telepítsd a VállorCalc-ot a kezdőképernyőre a gyorsabb eléréshez:
            </p>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>
                <span className="font-medium">iPhone / iPad (Safari):</span> koppints a
                Megosztás ikonra <span aria-hidden>⬆️</span>, majd válaszd a
                „Főképernyőhöz adás” lehetőséget.
              </li>
              <li>
                <span className="font-medium">Android / Chrome:</span> nyisd meg a böngésző
                menüjét <span aria-hidden>⋮</span>, majd válaszd az „Alkalmazás telepítése”
                lehetőséget.
              </li>
            </ul>
            <button
              onClick={() => {
                setShowHelp(false);
                onDone?.();
              }}
              className="w-full bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition"
            >
              Értem
            </button>
          </div>
        </div>
      )}
    </>
  );
}
