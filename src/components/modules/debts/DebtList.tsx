"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  HandCoins,
  History,
  Plus,
  Receipt,
  Scale,
  Search,
} from "lucide-react";
import {
  type ActionResult,
  type Debt,
  type DebtInput,
  type DebtPayment,
  type DebtType,
  type PayDebtInput,
  type Wallet,
} from "@/types/finance";
import {
  createDebt,
  deleteDebt,
  getDebtPayments,
  getDebts,
  payDebt,
  updateDebt,
} from "@/actions/debts";
import { DebtSummary } from "./DebtSummary";
import { DebtCard } from "./DebtCard";
import { DebtModal } from "./DebtModal";
import { PayDebtModal } from "./PayDebtModal";
import { DebtPaymentHistoryList } from "./DebtPaymentHistoryList";
import {
  addOfflineMutation,
  getOfflineData,
  saveOfflineData,
} from "@/lib/offline/db";

interface DebtListProps {
  initialDebts: Debt[];
  wallets: Wallet[];
}

type TabFilter = "all" | "debt" | "receivable" | "history";

export function DebtList({ initialDebts, wallets }: DebtListProps) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load debts from offline cache on mount
  useEffect(() => {
    async function loadCache() {
      const cached = await getOfflineData<Debt[]>("pf_debts");
      if (cached && cached.length > 0) {
        setDebts(cached);
      } else if (initialDebts.length > 0) {
        void saveOfflineData("pf_debts", initialDebts);
      }
    }
    void loadCache();
  }, [initialDebts]);

  // Load payment logs on mount & tab activation
  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const logs = await getDebtPayments();
      setPayments(logs);
    } catch (err) {
      console.warn("Could not fetch debt payment logs:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    void fetchPayments();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      void fetchPayments();
    }
  }, [activeTab]);

  // Filter debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Tab filter
      let matchTab = true;
      if (activeTab === "debt") matchTab = d.type === "debt" && d.status !== "paid";
      else if (activeTab === "receivable") matchTab = d.type === "receivable" && d.status !== "paid";

      // Search filter
      const matchSearch =
        !searchQuery.trim() ||
        d.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        d.counterparty_name.toLowerCase().includes(searchQuery.trim().toLowerCase());

      return matchTab && matchSearch;
    });
  }, [debts, activeTab, searchQuery]);

  // Filter payment history logs by search query
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.trim().toLowerCase();
    return payments.filter(
      (p) =>
        p.debt_title.toLowerCase().includes(q) ||
        p.counterparty_name.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.wallet_name && p.wallet_name.toLowerCase().includes(q))
    );
  }, [payments, searchQuery]);

  const debtCount = debts.filter((d) => d.type === "debt" && d.status !== "paid").length;
  const receivableCount = debts.filter((d) => d.type === "receivable" && d.status !== "paid").length;

  const handleSaveDebt = async (data: DebtInput): Promise<ActionResult<Debt>> => {
    if (editingDebt) {
      // Optimistic update
      const updatedList = debts.map((d) =>
        d.id === editingDebt.id ? { ...d, ...data, is_synced: false } : d
      );
      setDebts(updatedList);
      void saveOfflineData("pf_debts", updatedList);

      try {
        const res = await updateDebt(editingDebt.id, data);
        if (res.success && res.data) {
          const synced = debts.map((d) =>
            d.id === editingDebt.id ? res.data! : d
          );
          setDebts(synced);
          void saveOfflineData("pf_debts", synced);
          return res;
        }
        return res;
      } catch {
        await addOfflineMutation({
          entity: "debt" as any,
          action: "update",
          payload: { id: editingDebt.id, data },
        });
        return {
          success: true,
          data: {
            ...editingDebt,
            ...data,
            is_synced: false,
          },
        };
      }
    } else {
      // Create new
      try {
        const res = await createDebt(data);
        if (res.success && res.data) {
          const updated = [res.data, ...debts];
          setDebts(updated);
          void saveOfflineData("pf_debts", updated);
          return res;
        }
        return res;
      } catch {
        const tempDebt: Debt = {
          id: `offline_debt_${Date.now()}`,
          user_id: "local_user",
          type: data.type,
          counterparty_name: data.counterparty_name,
          title: data.title,
          total_amount: data.total_amount,
          remaining_amount: data.remaining_amount ?? data.total_amount,
          monthly_installment: data.monthly_installment ?? 0,
          due_day: data.due_day ?? 1,
          due_date: data.due_date ?? null,
          target_payoff_date: data.target_payoff_date ?? null,
          status: "unpaid",
          wallet_id: data.wallet_id ?? null,
          notes: data.notes ?? null,
          is_synced: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        const updated = [tempDebt, ...debts];
        setDebts(updated);
        void saveOfflineData("pf_debts", updated);
        await addOfflineMutation({
          entity: "debt" as any,
          action: "create",
          payload: data,
        });
        return { success: true, data: tempDebt };
      }
    }
  };

  const handlePayDebt = async (data: PayDebtInput): Promise<ActionResult<Debt>> => {
    try {
      const res = await payDebt(data);
      if (res.success && res.data) {
        const updated = debts.map((d) => (d.id === data.debt_id ? res.data! : d));
        setDebts(updated);
        void saveOfflineData("pf_debts", updated);
        void fetchPayments();
        return res;
      }
      return res;
    } catch {
      // Optimistic offline pay
      const target = debts.find((d) => d.id === data.debt_id);
      if (target) {
        const newRem = Math.max(0, target.remaining_amount - data.amount);
        const updatedDebt: Debt = {
          ...target,
          remaining_amount: newRem,
          status: newRem === 0 ? "paid" : "partial",
          is_synced: false,
        };
        const updated = debts.map((d) => (d.id === data.debt_id ? updatedDebt : d));
        setDebts(updated);
        void saveOfflineData("pf_debts", updated);
        await addOfflineMutation({
          entity: "debt" as any,
          action: "contribute",
          payload: data,
        });
        return { success: true, data: updatedDebt };
      }
      return { success: false, error: "Gagal memproses pembayaran offline." };
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDebt) return;
    setIsDeleting(true);

    try {
      await deleteDebt(deletingDebt.id);
      const updated = debts.filter((d) => d.id !== deletingDebt.id);
      setDebts(updated);
      void saveOfflineData("pf_debts", updated);
    } catch {
      const updated = debts.filter((d) => d.id !== deletingDebt.id);
      setDebts(updated);
      void saveOfflineData("pf_debts", updated);
      await addOfflineMutation({
        entity: "debt" as any,
        action: "delete",
        payload: { id: deletingDebt.id },
      });
    } finally {
      setIsDeleting(false);
      setDeletingDebt(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Summary Overview ────────────────────────────────────────────── */}
      <DebtSummary debts={debts} />

      {/* ─── Control Bar: Tabs + Search + Add Button ──────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            Semua ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("debt")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "debt"
                ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <span>Hutang Saya</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-[10px]">
              {debtCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("receivable")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "receivable"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <span>Piutang</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-[10px]">
              {receivableCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "history"
                ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Riwayat Pembayaran ({payments.length})</span>
          </button>
        </div>

        {/* Search & Add CTA */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeTab === "history"
                  ? "Cari log riwayat pembayaran..."
                  : "Cari pihak / judul hutang..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingDebt(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Liabilitas</span>
            <span className="sm:hidden">Catat</span>
          </button>
        </div>
      </div>

      {/* ─── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === "history" ? (
        <DebtPaymentHistoryList
          payments={filteredPayments}
          isLoading={isLoadingPayments}
        />
      ) : filteredDebts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Tidak ada data hutang atau piutang
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada data yang cocok dengan "${searchQuery}".`
              : "Catat hutang atau piutang pertama Anda untuk memantau liabilitas dan jatuh tempo secara teratur."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDebts.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              onPay={(debt) => setPayingDebt(debt)}
              onEdit={(debt) => {
                setEditingDebt(debt);
                setIsCreateModalOpen(true);
              }}
              onDelete={(debt) => setDeletingDebt(debt)}
            />
          ))}
        </div>
      )}

      {/* ─── Modal 1: Create / Edit Debt ─────────────────────────────────── */}
      <DebtModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
        initialData={editingDebt}
        defaultType={activeTab === "receivable" ? "receivable" : "debt"}
        wallets={wallets}
      />

      {/* ─── Modal 2: Pay / Settle Debt ──────────────────────────────────── */}
      <PayDebtModal
        isOpen={Boolean(payingDebt)}
        onClose={() => setPayingDebt(null)}
        debt={payingDebt}
        wallets={wallets}
        onPay={handlePayDebt}
      />

      {/* ─── Modal 3: Delete Confirmation ────────────────────────────────── */}
      {deletingDebt && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingDebt(null);
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Hapus Data {deletingDebt.type === "debt" ? "Hutang" : "Piutang"}?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tindakan ini akan mengarsipkan pos &ldquo;{deletingDebt.title}&rdquo;.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingDebt(null)}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
