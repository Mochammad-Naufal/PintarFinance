"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SplashLoader } from "./SplashLoader";

/**
 * AppShell wraps the entire app and:
 * 1. Shows <SplashLoader> immediately on first paint.
 * 2. Checks the Supabase session asynchronously.
 * 3. Registers the PWA Service Worker for offline shell support.
 * 4. Tracks online/offline connectivity status with a sleek notification banner.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Supabase Session Check
    const supabase = createClient();
    supabase.auth.getSession().finally(() => {
      setReady(true);
    });

    // 2. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });
      });
    }

    // 3. Online/Offline Listeners
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => {
        setIsOffline(false);
        setShowReconnected(true);
        const timer = setTimeout(() => setShowReconnected(false), 3000);
        return () => clearTimeout(timer);
      };

      const handleOffline = () => {
        setIsOffline(true);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <>
      <SplashLoader ready={ready} />

      {/* Offline Status Banner */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-9998 flex items-center justify-center gap-2 bg-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Mode Offline: Beberapa fitur mungkin memerlukan koneksi internet.</span>
        </div>
      )}

      {/* Reconnected Banner */}
      {showReconnected && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-9998 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300"
        >
          <Wifi className="w-3.5 h-3.5 shrink-0" />
          <span>Koneksi Kembali Aktif!</span>
        </div>
      )}

      {children}
    </>
  );
}
