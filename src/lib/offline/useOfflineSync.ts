"use client";

import { useEffect, useState } from "react";
import { getPendingMutations } from "./db";
import { syncOfflineMutations } from "./syncManager";

export function useOfflineSync() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{
    syncedCount: number;
    failedCount: number;
    timestamp: number;
  } | null>(null);

  const refreshPendingCount = async () => {
    try {
      const list = await getPendingMutations();
      setPendingCount(list.length);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);
    void refreshPendingCount();

    const handleOnline = () => {
      setIsOffline(false);
      void refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = (e: Event) => {
      setIsSyncing(false);
      const detail = (e as CustomEvent).detail || { syncedCount: 0, failedCount: 0 };
      setLastSyncResult({
        syncedCount: detail.syncedCount,
        failedCount: detail.failedCount,
        timestamp: Date.now(),
      });
      void refreshPendingCount();
    };

    const handleMutationChanged = () => {
      void refreshPendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pf:sync-start", handleSyncStart);
    window.addEventListener("pf:sync-complete", handleSyncComplete);
    window.addEventListener("pf:mutation-queued", handleMutationChanged);
    window.addEventListener("pf:mutation-removed", handleMutationChanged);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pf:sync-start", handleSyncStart);
      window.removeEventListener("pf:sync-complete", handleSyncComplete);
      window.removeEventListener("pf:mutation-queued", handleMutationChanged);
      window.removeEventListener("pf:mutation-removed", handleMutationChanged);
    };
  }, []);

  const triggerSync = async () => {
    if (navigator.onLine) {
      return await syncOfflineMutations();
    }
    return { syncedCount: 0, failedCount: 0 };
  };

  return {
    isOffline,
    isSyncing,
    pendingCount,
    lastSyncResult,
    triggerSync,
  };
}
