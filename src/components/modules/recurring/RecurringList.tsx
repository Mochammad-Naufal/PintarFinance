"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Repeat,
} from "lucide-react";
import {
  type Category,
  type RecurringInput,
  type RecurringTransaction,
  type Wallet,
} from "@/types/finance";
import { RecurringCard } from "./RecurringCard";
import { RecurringModal } from "./RecurringModal";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactionNow,
  toggleRecurringStatus,
  updateRecurringTransaction,
} from "@/actions/recurring";
import { formatCurrency } from "@/lib/utils";
import {
  addOfflineMutation,
  getOfflineData,
  saveOfflineData,
} from "@/lib/offline/db";

interface RecurringListProps {
  initialRecurring: RecurringTransaction[];
  wallets: Wallet[];
  categories: Category[];
}

export function RecurringList({
  initialRecurring,
  wallets,
  categories,
}: RecurringListProps) {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(initialRecurring);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Cache initial server data or fallback to offline cached data (SWR)
  useEffect(() => {
    if (initialRecurring && initialRecurring.length > 0) {
      void saveOfflineData("recurring", initialRecurring);
      setRecurringList(initialRecurring);
    } else {
      void getOfflineData<RecurringTransaction[]>("recurring").then((cached) => {
        if (cached && cached.length > 0) {
          setRecurringList(cached);
        }
      });
    }

    const handleDataUpdated = async () => {
      const cached = await getOfflineData<RecurringTransaction[]>("recurring");
      if (cached && cached.length > 0) {
        setRecurringList(cached);
      }
    };

    window.addEventListener("pf:data-updated", handleDataUpdated);
    return () => window.removeEventListener("pf:data-updated", handleDataUpdated);
  }, [initialRecurring]);

  // Compute monthly normalized amounts
  const { totalMonthlyExpense, totalMonthlyIncome, activeCount, dueCount } = useMemo(() => {
    let expense = 0;
    let income = 0;
    let active = 0;
    let due = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    for (const item of recurringList) {
      if (!item.is_active) continue;
      active++;

      if (item.next_run_date <= todayStr) {
        due++;
      }

      // Normalize to monthly approximation
      let monthlyMultiplier = 1;
      if (item.frequency === "daily") monthlyMultiplier = 30;
      else if (item.frequency === "weekly") monthlyMultiplier = 4.33;
      else if (item.frequency === "yearly") monthlyMultiplier = 1 / 12;

      const monthlyAmount = item.amount * monthlyMultiplier;

      if (item.type === "expense") {
        expense += monthlyAmount;
      } else {
        income += monthlyAmount;
      }
    }

    return {
      totalMonthlyExpense: Math.round(expense),
      totalMonthlyIncome: Math.round(income),
      activeCount: active,
      dueCount: due,
    };
  }, [recurringList]);

  // Filtered display list
  const filteredList = useMemo(() => {
    return recurringList.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      return true;
    });
  }, [recurringList, filterType]);

  const handleSave = async (data: RecurringInput, id?: string) => {
    const w = wallets.find((w) => w.id === data.wallet_id);
    const c = categories.find((cat) => cat.id === data.category_id);

    if (id) {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const updatedItem: RecurringTransaction = {
          ...(editingItem || recurringList.find((r) => r.id === id)!),
          ...data,
          wallet_name: w?.name,
          wallet_color: w?.color,
          wallet_icon: w?.icon,
          category_name: c?.name,
          category_icon: c?.icon,
          category_color: c?.color,
          updated_at: new Date().toISOString(),
        };

        await addOfflineMutation({
          entity: "recurring",
          action: "update",
          payload: { id, data },
        });

        setRecurringList((prev) => {
          const next = prev.map((item) => (item.id === id ? updatedItem : item));
          void saveOfflineData("recurring", next);
          return next;
        });

        return { success: true, data: updatedItem };
      }

      try {
        const res = await updateRecurringTransaction(id, data);
        if (res.success && res.data) {
          const enriched: RecurringTransaction = {
            ...res.data,
            wallet_name: w?.name,
            wallet_color: w?.color,
            wallet_icon: w?.icon,
            category_name: c?.name,
            category_icon: c?.icon,
            category_color: c?.color,
          };
          setRecurringList((prev) => {
            const next = prev.map((item) => (item.id === id ? enriched : item));
            void saveOfflineData("recurring", next);
            return next;
          });
        }
        return res;
      } catch {
        const updatedItem: RecurringTransaction = {
          ...(editingItem || recurringList.find((r) => r.id === id)!),
          ...data,
          wallet_name: w?.name,
          wallet_color: w?.color,
          wallet_icon: w?.icon,
          category_name: c?.name,
          category_icon: c?.icon,
          category_color: c?.color,
          updated_at: new Date().toISOString(),
        };

        await addOfflineMutation({
          entity: "recurring",
          action: "update",
          payload: { id, data },
        });

        setRecurringList((prev) => {
          const next = prev.map((item) => (item.id === id ? updatedItem : item));
          void saveOfflineData("recurring", next);
          return next;
        });

        return { success: true, data: updatedItem };
      }
    } else {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const newItem: RecurringTransaction = {
          id: `offline_rec_${Date.now()}`,
          user_id: "local_user",
          wallet_id: data.wallet_id,
          category_id: data.category_id ?? null,
          description: data.description,
          type: data.type,
          amount: data.amount,
          frequency: data.frequency,
          start_date: data.start_date,
          next_run_date: data.start_date,
          last_run_date: null,
          auto_create: data.auto_create ?? false,
          is_active: data.is_active ?? true,
          is_synced: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          wallet_name: w?.name,
          wallet_color: w?.color,
          wallet_icon: w?.icon,
          category_name: c?.name,
          category_icon: c?.icon,
          category_color: c?.color,
        };

        await addOfflineMutation({
          entity: "recurring",
          action: "create",
          payload: data,
        });

        setRecurringList((prev) => {
          const next = [newItem, ...prev];
          void saveOfflineData("recurring", next);
          return next;
        });

        return { success: true, data: newItem };
      }

      try {
        const res = await createRecurringTransaction(data);
        if (res.success && res.data) {
          const enriched: RecurringTransaction = {
            ...res.data,
            wallet_name: w?.name,
            wallet_color: w?.color,
            wallet_icon: w?.icon,
            category_name: c?.name,
            category_icon: c?.icon,
            category_color: c?.color,
          };
          setRecurringList((prev) => {
            const next = [enriched, ...prev];
            void saveOfflineData("recurring", next);
            return next;
          });
        }
        return res;
      } catch {
        const newItem: RecurringTransaction = {
          id: `offline_rec_${Date.now()}`,
          user_id: "local_user",
          wallet_id: data.wallet_id,
          category_id: data.category_id ?? null,
          description: data.description,
          type: data.type,
          amount: data.amount,
          frequency: data.frequency,
          start_date: data.start_date,
          next_run_date: data.start_date,
          last_run_date: null,
          auto_create: data.auto_create ?? false,
          is_active: data.is_active ?? true,
          is_synced: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          wallet_name: w?.name,
          wallet_color: w?.color,
          wallet_icon: w?.icon,
          category_name: c?.name,
          category_icon: c?.icon,
          category_color: c?.color,
        };

        await addOfflineMutation({
          entity: "recurring",
          action: "create",
          payload: data,
        });

        setRecurringList((prev) => {
          const next = [newItem, ...prev];
          void saveOfflineData("recurring", next);
          return next;
        });

        return { success: true, data: newItem };
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      await addOfflineMutation({
        entity: "recurring",
        action: "delete",
        payload: { id },
      });
      setRecurringList((prev) => {
        const next = prev.filter((item) => item.id !== id);
        void saveOfflineData("recurring", next);
        return next;
      });
      return;
    }

    try {
      const res = await deleteRecurringTransaction(id);
      if (res.success) {
        setRecurringList((prev) => {
          const next = prev.filter((item) => item.id !== id);
          void saveOfflineData("recurring", next);
          return next;
        });
      } else {
        alert(res.error ?? "Gagal menghapus jadwal");
      }
    } catch {
      await addOfflineMutation({
        entity: "recurring",
        action: "delete",
        payload: { id },
      });
      setRecurringList((prev) => {
        const next = prev.filter((item) => item.id !== id);
        void saveOfflineData("recurring", next);
        return next;
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    const res = await toggleRecurringStatus(id, isActive);
    if (res.success) {
      setRecurringList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_active: isActive } : item))
      );
    }
  };

  const handleProcessNow = async (id: string) => {
    const res = await processRecurringTransactionNow(id);
    if (res.success) {
      // Re-fetch or advance next_run_date locally
      const todayStr = new Date().toISOString().slice(0, 10);
      setRecurringList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              last_run_date: todayStr,
            };
          }
          return item;
        })
      );
      alert("Mutasi transaksi berulang berhasil dicatat ke buku besar!");
    } else {
      alert(res.error ?? "Gagal mencatat transaksi");
    }
  };

  return (
    <div className="space-y-5 max-w-full min-w-0">
      {/* Commitment Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Monthly Expense Commitment */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Estimasi Tagihan / Bulan</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg sm:text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatCurrency(totalMonthlyExpense)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Total komitmen pengeluaran rutin
          </p>
        </div>

        {/* Monthly Income Routine */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Pemasukan Rutin / Bulan</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalMonthlyIncome)}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Gaji & pemasukan berkala
          </p>
        </div>

        {/* Active Schedules & Due Alerts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium">Jadwal Aktif</span>
            <Repeat className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {activeCount} Jadwal
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {dueCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ {dueCount} tagihan perlu dicatat hari ini
              </span>
            ) : (
              "Semua jadwal dalam batas aman"
            )}
          </p>
        </div>
      </div>

      {/* Due Reminder Alert Banner */}
      {dueCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="leading-relaxed">
              Terdapat <strong>{dueCount} tagihan/langganan</strong> yang jatuh tempo hari ini atau telah terlewat. Silakan klik tombol <strong>&ldquo;Catat Sekarang&rdquo;</strong> pada kartu terkait untuk membukukan mutasi ke saldo dompet Anda.
            </span>
          </div>
        </div>
      )}

      {/* Action Bar: Filter Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs w-fit">
          {(
            [
              { id: "all", label: "Semua Jadwal" },
              { id: "expense", label: "Langganan & Tagihan" },
              { id: "income", label: "Pemasukan Rutin" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add New Schedule Button */}
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Tambah Tagihan / Langganan</span>
        </button>
      </div>

      {/* Grid of Recurring Cards */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500">
            <Repeat className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Belum Ada Jadwal Transaksi Berulang
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Jadwalkan langganan bulanan (Netflix, Spotify, WiFi) atau pemasukan rutin agar arus kas tercatat rapi dan tepat waktu.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
          >
            Tambah Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={(itemToEdit) => {
                setEditingItem(itemToEdit);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onProcessNow={handleProcessNow}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        wallets={wallets}
        categories={categories}
        editingItem={editingItem}
      />
    </div>
  );
}
