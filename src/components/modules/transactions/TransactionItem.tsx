"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { type Transaction } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionItem({
  transaction,
  onDelete,
}: TransactionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Yakin ingin menghapus transaksi ini? Saldo dompet akan otomatis dikembalikan.")) {
      setIsDeleting(true);
      try {
        await onDelete(transaction.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Determine icon & theme color
  let iconName = "receipt";
  let color = "#64748b";

  if (transaction.type === "expense") {
    iconName = transaction.category_icon || "arrow-up-right";
    color = transaction.category_color || "#f97316";
  } else if (transaction.type === "income") {
    iconName = transaction.category_icon || "arrow-down-left";
    color = transaction.category_color || "#10b981";
  } else if (transaction.type === "transfer") {
    iconName = "arrow-left-right";
    color = "#8b5cf6";
  } else if (transaction.type === "saving") {
    iconName = transaction.savings_goal_icon || "target";
    color = transaction.savings_goal_color || "#3b82f6";
  }

  // Determine title & sub-label
  const title =
    transaction.description ||
    transaction.category_name ||
    (transaction.type === "transfer"
      ? `Transfer ke ${transaction.destination_wallet_name ?? "Dompet Lain"}`
      : transaction.type === "saving"
      ? `Alokasi Tabungan: ${transaction.savings_goal_name ?? "Pos Impian"}`
      : "Transaksi");

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150 group">
      {/* Left: Icon & Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          <DynamicIcon name={iconName} className="w-5 h-5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </p>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            {transaction.type === "transfer" ? (
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {transaction.wallet_name} → {transaction.destination_wallet_name}
              </span>
            ) : transaction.type === "saving" ? (
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {transaction.wallet_name} → {transaction.savings_goal_name}
              </span>
            ) : (
              <span>{transaction.wallet_name ?? "Dompet"}</span>
            )}

            {transaction.category_name && transaction.type !== "transfer" && transaction.type !== "saving" && (
              <>
                <span>•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 w-fit rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {transaction.category_name}
                </span>
              </>
            )}

            <span>•</span>
            <span>{formatDate(transaction.transaction_date, "dd MMM yyyy, HH:mm")}</span>

            {transaction.is_synced === false && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <span>Offline</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Nominal & Delete Action */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <p
            className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
              transaction.type === "income"
                ? "text-emerald-600 dark:text-emerald-400"
                : transaction.type === "saving"
                ? "text-blue-600 dark:text-blue-400"
                : transaction.type === "transfer"
                ? "text-zinc-700 dark:text-zinc-300"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {transaction.type === "income"
              ? `+ ${formatCurrency(transaction.amount)}`
              : transaction.type === "saving"
              ? `🎯 ${formatCurrency(transaction.amount)}`
              : transaction.type === "transfer"
              ? `⇄ ${formatCurrency(transaction.amount)}`
              : `- ${formatCurrency(transaction.amount)}`}
          </p>

          {transaction.admin_fee > 0 && (
            <p className="text-xs text-zinc-400 font-mono">
              + Admin {formatCurrency(transaction.admin_fee)}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.95] transition-all disabled:opacity-50"
          title="Hapus Transaksi"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" strokeWidth={1.75} />
          ) : (
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}
