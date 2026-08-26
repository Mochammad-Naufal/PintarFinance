"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { type SavingsGoal, type SavingsGoalInput } from "@/types/finance";
import { SavingsGoalCard } from "./SavingsGoalCard";
import { SavingsGoalModal } from "./SavingsGoalModal";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoal,
} from "@/actions/savings";
import { formatCurrency } from "@/lib/utils";

interface SavingsGoalListProps {
  initialGoals: SavingsGoal[];
}

export function SavingsGoalList({ initialGoals }: SavingsGoalListProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const totalCurrent = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const overallPercentage =
    totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleSave = async (data: SavingsGoalInput) => {
    if (editingGoal) {
      const res = await updateSavingsGoal(editingGoal.id, data);
      if (res.success && res.data) {
        setGoals((prev) =>
          prev.map((g) => (g.id === editingGoal.id ? res.data! : g))
        );
      }
      return res;
    } else {
      const res = await createSavingsGoal(data);
      if (res.success && res.data) {
        setGoals((prev) => [...prev, res.data!]);
      }
      return res;
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteSavingsGoal(id);
    if (res.success) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } else {
      alert(res.error ?? "Gagal menghapus target impian");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Dana Terkumpul
          </p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mt-1">
            {formatCurrency(totalCurrent)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Dari {goals.length} target impian
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Target Finansial
          </p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums mt-1">
            {formatCurrency(totalTarget)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Akumulasi seluruh impian</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Rata-rata Capaian
              </p>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                {overallPercentage}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Tambah Impian Baru
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500">
            <Target className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Belum Ada Pos Impian
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Mulai buat pos tabungan untuk dana darurat, beli kendaraan, atau rencana masa depanmu.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xs"
          >
            Buat Impian Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingGoal}
      />
    </div>
  );
}
