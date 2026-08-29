"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SplashLoader } from "./SplashLoader";
import { useOfflineSync } from "@/lib/offline/useOfflineSync";

/**
 * AppShell wraps the entire app and:
 * 1. Shows <SplashLoader> immediately on first paint.
 * 2. Checks the Supabase session asynchronously.
 * 3. Registers the PWA Service Worker for offline shell support.
 * 4. Tracks online/offline connectivity and offline mutation sync with a sleek notification banner.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { isOffline, isSyncing, pendingCount, lastSyncResult, triggerSync } = useOfflineSync();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

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
  }, []);

  useEffect(() => {
    if (lastSyncResult && lastSyncResult.syncedCount > 0) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastSyncResult]);

  return (
    <>
      <SplashLoader ready={ready} />

      {/* ── Offline Status Banner ── */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-9998 flex items-center justify-between gap-2 bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="truncate">
              {pendingCount > 0
                ? `Mode Offline: ${pendingCount} mutasi tersimpan lokal & siap disinkronkan.`
                : "Mode Offline: Anda tetap dapat mencatat mutasi baru secara lokal."}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900/10 font-bold shrink-0">
            Lokal Cache Aktif
          </span>
        </div>
      )}

      {/* ── Syncing in Progress Banner ── */}
      {!isOffline && isSyncing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-9998 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300"
        >
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          <span>Menyinkronkan mutasi offline ke cloud Pintar Finance...</span>
        </div>
      )}

      {/* ── Sync Success Banner ── */}
      {!isOffline && !isSyncing && showSyncSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-9998 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-md animate-in slide-in-from-top duration-300"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {lastSyncResult?.syncedCount} mutasi offline berhasil disinkronkan ke cloud!
          </span>
        </div>
      )}

      {children}
    </>
  );
}
