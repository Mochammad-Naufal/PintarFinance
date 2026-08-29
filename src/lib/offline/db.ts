/**
 * Pintar Finance Offline-First Storage Engine
 * High-performance IndexedDB wrapper with structured localStorage fallback.
 */

export type MutationEntity =
  | "transaction"
  | "wallet"
  | "savings_goal"
  | "budget"
  | "recurring";

export type MutationAction =
  | "create"
  | "update"
  | "delete"
  | "contribute"
  | "upsert";

export interface OfflineMutation {
  id: string;
  entity: MutationEntity;
  action: MutationAction;
  payload: any;
  createdAt: number;
  attempts: number;
  status: "pending" | "syncing" | "failed";
}

const DB_NAME = "PintarFinanceOfflineDB";
const DB_VERSION = 1;
const STORE_CACHE = "data_cache";
const STORE_MUTATIONS = "offline_mutations";

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDB(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          db.createObjectStore(STORE_MUTATIONS, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

// ─── Key-Value Cache Operations (SWR Pattern) ─────────────────────────────────

export async function saveOfflineData<T>(key: string, data: T): Promise<void> {
  if (!data) return;

  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, "readwrite");
        const store = tx.objectStore(STORE_CACHE);
        const request = store.put({ key, value: data, updatedAt: Date.now() });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (err) {
    console.warn(`[OfflineDB] Failed to save key "${key}" to IndexedDB, falling back to localStorage:`, err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(`pf_cache_${key}`, JSON.stringify({ value: data, updatedAt: Date.now() }));
    }
  } catch (lsErr) {
    console.warn(`[OfflineDB] localStorage fallback failed for key "${key}":`, lsErr);
  }
}

export async function getOfflineData<T>(key: string): Promise<T | null> {
  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      return new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_CACHE, "readonly");
        const store = tx.objectStore(STORE_CACHE);
        const request = store.get(key);

        request.onsuccess = () => {
          if (request.result && request.result.value) {
            resolve(request.result.value as T);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    }
  } catch (err) {
    console.warn(`[OfflineDB] Failed to read key "${key}" from IndexedDB, trying localStorage:`, err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem(`pf_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return (parsed.value as T) ?? null;
      }
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

// ─── Offline Mutation Queue Operations ─────────────────────────────────────────

export async function addOfflineMutation(
  mutation: Omit<OfflineMutation, "id" | "createdAt" | "attempts" | "status">
): Promise<OfflineMutation> {
  const item: OfflineMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entity: mutation.entity,
    action: mutation.action,
    payload: mutation.payload,
    createdAt: Date.now(),
    attempts: 0,
    status: "pending",
  };

  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, "readwrite");
        const store = tx.objectStore(STORE_MUTATIONS);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      const current = await getPendingMutations();
      current.push(item);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("pf_mutations_queue", JSON.stringify(current));
      }
    }
  } catch (err) {
    console.error("[OfflineDB] Error queueing offline mutation:", err);
    // LocalStorage fallback
    try {
      const current = await getPendingMutations();
      current.push(item);
      localStorage.setItem("pf_mutations_queue", JSON.stringify(current));
    } catch {
      // Ignored
    }
  }

  // Notify listeners that a mutation was queued
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pf:mutation-queued", { detail: item }));
  }

  return item;
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      return new Promise<OfflineMutation[]>((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, "readonly");
        const store = tx.objectStore(STORE_MUTATIONS);
        const request = store.getAll();

        request.onsuccess = () => {
          const list = (request.result as OfflineMutation[]) || [];
          resolve(list.sort((a, b) => a.createdAt - b.createdAt));
        };

        request.onerror = () => {
          resolve([]);
        };
      });
    }
  } catch (err) {
    console.warn("[OfflineDB] Error fetching mutations from IndexedDB:", err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = localStorage.getItem("pf_mutations_queue");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.sort((a, b) => a.createdAt - b.createdAt);
        }
      }
    }
  } catch {
    // Ignored
  }

  return [];
}

export async function removeOfflineMutation(id: string): Promise<void> {
  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, "readwrite");
        const store = tx.objectStore(STORE_MUTATIONS);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (err) {
    console.warn("[OfflineDB] Error deleting mutation from IndexedDB:", err);
  }

  // Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const current = await getPendingMutations();
      const filtered = current.filter((m) => m.id !== id);
      localStorage.setItem("pf_mutations_queue", JSON.stringify(filtered));
    }
  } catch {
    // Ignored
  }

  // Notify listeners
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pf:mutation-removed", { detail: { id } }));
  }
}

export async function updateOfflineMutation(
  id: string,
  updates: Partial<OfflineMutation>
): Promise<void> {
  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, "readwrite");
        const store = tx.objectStore(STORE_MUTATIONS);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = { ...getReq.result, ...updates };
            const putReq = store.put(updated);
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
          } else {
            resolve();
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    }
  } catch (err) {
    console.warn("[OfflineDB] Error updating mutation:", err);
  }
}

export async function clearAllOfflineData(): Promise<void> {
  try {
    if (isIndexedDBSupported()) {
      const db = await openDB();
      const tx = db.transaction([STORE_CACHE, STORE_MUTATIONS], "readwrite");
      tx.objectStore(STORE_CACHE).clear();
      tx.objectStore(STORE_MUTATIONS).clear();
    }
    if (typeof window !== "undefined" && window.localStorage) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("pf_cache_") || k === "pf_mutations_queue")
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.error("[OfflineDB] Error clearing offline data:", err);
  }
}
