"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  type Budget,
  type BudgetInput,
  type Category,
} from "@/types/finance";
import { BudgetCard } from "./BudgetCard";
import { BudgetSummary } from "./BudgetSummary";
import { BudgetModal } from "./BudgetModal";
import { deleteBudget, upsertBudget } from "@/actions/budgets";
import { formatDate } from "@/lib/utils";
import {
  addOfflineMutation,
  getOfflineData,
  saveOfflineData,
} from "@/lib/offline/db";

interface BudgetListProps {
  initialBudgets: Budget[];
  currentPeriod: string;
  categories: Category[];
}

function shiftPeriod(period: string, deltaMonths: number): string {
  const [yearStr, monthStr] = period.split("-");
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + deltaMonths, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatPeriodTitle(period: string): string {
  const [yearStr, monthStr] = period.split("-");
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return formatDate(d.toISOString(), "MMMM yyyy");
}

export function BudgetList({
  initialBudgets,
  currentPeriod,
  categories,
}: BudgetListProps) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Cache initial server data or fallback to offline cached data (SWR)
  useEffect(() => {
    if (initialBudgets && initialBudgets.length > 0) {
      void saveOfflineData("budgets", initialBudgets);
      setBudgets(initialBudgets);
    } else {
      void getOfflineData<Budget[]>("budgets").then((cached) => {
        if (cached && cached.length > 0) {
          setBudgets(cached);
        }
      });
    }

    const handleDataUpdated = async () => {
      const cached = await getOfflineData<Budget[]>("budgets");
      if (cached && cached.length > 0) {
        setBudgets(cached);
      }
    };

    window.addEventListener("pf:data-updated", handleDataUpdated);
    return () => window.removeEventListener("pf:data-updated", handleDataUpdated);
  }, [initialBudgets]);

  const nowPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = currentPeriod === nowPeriod;

  const handlePeriodChange = (newPeriod: string) => {
    router.push(`/transactions?tab=budget&period=${newPeriod}`);
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleSave = async (data: BudgetInput) => {
    const cat = categories.find((c) => c.id === data.category_id);

    if (typeof window !== "undefined" && !navigator.onLine) {
      const pct = editingBudget?.percentage || 0;
      const offlineBudget: Budget = {
        id: editingBudget?.id || `offline_budget_${Date.now()}`,
        user_id: "local_user",
        category_id: data.category_id,
        category_name: cat?.name || "Kategori",
        category_icon: cat?.icon || "graduation-cap",
        category_color: cat?.color || "#10b981",
        limit_amount: data.limit_amount,
        spent_amount: editingBudget?.spent_amount || 0,
        remaining_amount: data.limit_amount - (editingBudget?.spent_amount || 0),
        percentage: pct,
        status: pct >= 100 ? "danger" : pct >= 75 ? "warning" : "safe",
        is_synced: false,
        period: data.period,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await addOfflineMutation({
        entity: "budget",
        action: "upsert",
        payload: data,
      });

      setBudgets((prev) => {
        const exists = prev.some((b) => b.category_id === data.category_id);
        const next = exists
          ? prev.map((b) => (b.category_id === data.category_id ? offlineBudget : b))
          : [...prev, offlineBudget];
        void saveOfflineData("budgets", next);
        return next;
      });

      return { success: true, data: offlineBudget };
    }

    try {
      const res = await upsertBudget(data);
      if (res.success && res.data) {
        setBudgets((prev) => {
          const exists = prev.some((b) => b.id === res.data!.id);
          const next = exists
            ? prev.map((b) => (b.id === res.data!.id ? res.data! : b))
            : [...prev, res.data!];
          void saveOfflineData("budgets", next);
          return next;
        });
      }
      return res;
    } catch {
      const pct = editingBudget?.percentage || 0;
      const offlineBudget: Budget = {
        id: editingBudget?.id || `offline_budget_${Date.now()}`,
        user_id: "local_user",
        category_id: data.category_id,
        category_name: cat?.name || "Kategori",
        category_icon: cat?.icon || "graduation-cap",
        category_color: cat?.color || "#10b981",
        limit_amount: data.limit_amount,
        spent_amount: editingBudget?.spent_amount || 0,
        remaining_amount: data.limit_amount - (editingBudget?.spent_amount || 0),
        percentage: pct,
        status: pct >= 100 ? "danger" : pct >= 75 ? "warning" : "safe",
        is_synced: false,
        period: data.period,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await addOfflineMutation({
        entity: "budget",
        action: "upsert",
        payload: data,
      });

      setBudgets((prev) => {
        const exists = prev.some((b) => b.category_id === data.category_id);
        const next = exists
          ? prev.map((b) => (b.category_id === data.category_id ? offlineBudget : b))
          : [...prev, offlineBudget];
        void saveOfflineData("budgets", next);
        return next;
      });

      return { success: true, data: offlineBudget };
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      await addOfflineMutation({
        entity: "budget",
        action: "delete",
        payload: { id },
      });
      setBudgets((prev) => {
        const next = prev.filter((b) => b.id !== id);
        void saveOfflineData("budgets", next);
        return next;
      });
      return;
    }

    try {
      const res = await deleteBudget(id);
      if (res.success) {
        setBudgets((prev) => {
          const next = prev.filter((b) => b.id !== id);
          void saveOfflineData("budgets", next);
          return next;
        });
      } else {
        alert(res.error ?? "Gagal menghapus anggaran");
      }
    } catch {
      await addOfflineMutation({
        entity: "budget",
        action: "delete",
        payload: { id },
      });
      setBudgets((prev) => {
        const next = prev.filter((b) => b.id !== id);
        void saveOfflineData("budgets", next);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Month Selector Toolbar & Add Button ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePeriodChange(shiftPeriod(currentPeriod, -1))}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.95] transition-all"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center capitalize">
            {formatPeriodTitle(currentPeriod)}
          </p>

          <button
            onClick={() => handlePeriodChange(shiftPeriod(currentPeriod, 1))}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.95] transition-all"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={() => handlePeriodChange(nowPeriod)}
              className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <RotateCcw className="w-3 h-3" />
              Bulan Ini
            </button>
          )}
        </div>

        {/* Add Budget Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Atur Anggaran Kategori
        </button>
      </div>

      {/* ── Overall Summary ───────────────────────────────────────────── */}
      <BudgetSummary budgets={budgets} />

      {/* ── Budget Cards Grid ─────────────────────────────────────────── */}
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500">
            <GraduationCap className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Belum Ada Anggaran untuk Periode Ini
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Tentukan batas limit pengeluaran per kategori untuk menjaga cashflow tetap sehat dan terkendali.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
          >
            Pasang Anggaran Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        period={currentPeriod}
        initialData={editingBudget}
      />
    </div>
  );
}
