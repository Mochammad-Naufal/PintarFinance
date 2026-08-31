"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Receipt,
  Scale,
  Wallet as WalletIcon,
} from "lucide-react";
import { type DebtPayment } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DebtPaymentHistoryListProps {
  payments: DebtPayment[];
  isLoading?: boolean;
}

export function DebtPaymentHistoryList({
  payments,
  isLoading = false,
}: DebtPaymentHistoryListProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto" />
        <p className="text-xs text-zinc-400">Memuat log riwayat pembayaran cicilan...</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Belum Ada Riwayat Pembayaran
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Setiap transaksi pembayaran cicilan hutang atau penerimaan pelunasan piutang yang Anda catat akan otomatis terekam di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
      <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Log Riwayat Pembayaran &amp; Pelunasan
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {payments.length} Transaksi
        </span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {payments.map((p) => {
          const isDebt = p.debt_type === "debt";
          const isSettled = p.remaining_after <= 0;

          return (
            <div
              key={p.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
            >
              {/* Left: Info & Badges */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDebt
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isDebt ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {p.debt_title}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        isDebt
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDebt ? "Bayar Cicilan Hutang" : "Terima Pembayaran Piutang"}
                    </span>
                    {isSettled && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Lunas
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Pihak: <span className="font-medium text-zinc-700 dark:text-zinc-300">{p.counterparty_name}</span>
                    {p.notes ? ` • ${p.notes}` : ""}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-zinc-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(p.payment_date)}</span>
                    </div>
                    {p.wallet_name && (
                      <div className="flex items-center gap-1">
                        <WalletIcon className="w-3 h-3 text-emerald-500" />
                        <span>{p.wallet_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Payment Amount & Remaining */}
              <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800/60 shrink-0">
                <p
                  className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                    isDebt
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isDebt ? "-" : "+"}
                  {formatCurrency(p.amount)}
                </p>

                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                  Sisa: {formatCurrency(p.remaining_after)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
