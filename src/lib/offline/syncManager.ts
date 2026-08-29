import {
  getPendingMutations,
  removeOfflineMutation,
  updateOfflineMutation,
  type OfflineMutation,
} from "./db";
import { createTransaction, deleteTransaction } from "@/actions/transactions";
import { createWallet, deleteWallet, updateWallet } from "@/actions/wallets";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoal,
} from "@/actions/savings";
import { deleteBudget, upsertBudget } from "@/actions/budgets";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  updateRecurringTransaction,
} from "@/actions/recurring";

let isSyncInProgress = false;

export async function syncOfflineMutations(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine || isSyncInProgress) {
    return { syncedCount: 0, failedCount: 0 };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) {
      isSyncInProgress = false;
      return { syncedCount: 0, failedCount: 0 };
    }

    // Broadcast sync started
    window.dispatchEvent(
      new CustomEvent("pf:sync-start", {
        detail: { total: mutations.length },
      })
    );

    for (const mutation of mutations) {
      await updateOfflineMutation(mutation.id, { status: "syncing" });

      try {
        let success = false;

        switch (mutation.entity) {
          case "transaction": {
            if (mutation.action === "create") {
              const res = await createTransaction(mutation.payload);
              success = res.success;
            } else if (mutation.action === "delete") {
              const res = await deleteTransaction(mutation.payload.id);
              success = res.success;
            }
            break;
          }

          case "wallet": {
            if (mutation.action === "create") {
              const res = await createWallet(mutation.payload);
              success = res.success;
            } else if (mutation.action === "update") {
              const res = await updateWallet(mutation.payload.id, mutation.payload.data);
              success = res.success;
            } else if (mutation.action === "delete") {
              const res = await deleteWallet(mutation.payload.id);
              success = res.success;
            }
            break;
          }

          case "savings_goal": {
            if (mutation.action === "create") {
              const res = await createSavingsGoal(mutation.payload);
              success = res.success;
            } else if (mutation.action === "update") {
              const res = await updateSavingsGoal(mutation.payload.id, mutation.payload.data);
              success = res.success;
            } else if (mutation.action === "delete") {
              const res = await deleteSavingsGoal(mutation.payload.id);
              success = res.success;
            }
            break;
          }

          case "budget": {
            if (mutation.action === "upsert") {
              const res = await upsertBudget(mutation.payload);
              success = res.success;
            } else if (mutation.action === "delete") {
              const res = await deleteBudget(mutation.payload.id);
              success = res.success;
            }
            break;
          }

          case "recurring": {
            if (mutation.action === "create") {
              const res = await createRecurringTransaction(mutation.payload);
              success = res.success;
            } else if (mutation.action === "update") {
              const res = await updateRecurringTransaction(mutation.payload.id, mutation.payload.data);
              success = res.success;
            } else if (mutation.action === "delete") {
              const res = await deleteRecurringTransaction(mutation.payload.id);
              success = res.success;
            }
            break;
          }

          default:
            success = true; // Unknown, discard
        }

        if (success) {
          await removeOfflineMutation(mutation.id);
          syncedCount++;
        } else {
          await updateOfflineMutation(mutation.id, {
            status: "failed",
            attempts: mutation.attempts + 1,
          });
          failedCount++;
        }
      } catch (mutationErr) {
        console.error(`[OfflineSync] Error processing mutation ${mutation.id}:`, mutationErr);
        await updateOfflineMutation(mutation.id, {
          status: "failed",
          attempts: mutation.attempts + 1,
        });
        failedCount++;
      }
    }

    // Broadcast sync finished
    window.dispatchEvent(
      new CustomEvent("pf:sync-complete", {
        detail: { syncedCount, failedCount },
      })
    );

    if (syncedCount > 0) {
      window.dispatchEvent(new CustomEvent("pf:data-updated"));
    }
  } catch (err) {
    console.error("[OfflineSync] Global sync failed:", err);
  } finally {
    isSyncInProgress = false;
  }

  return { syncedCount, failedCount };
}

// Global Online Listener setup
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    // Delay slightly to ensure reliable connectivity before firing server actions
    setTimeout(() => {
      void syncOfflineMutations();
    }, 1200);
  });
}
