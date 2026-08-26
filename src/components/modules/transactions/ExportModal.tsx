"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Loader2, Printer, X } from "lucide-react";
import { type TransactionType, type Wallet } from "@/types/finance";
import { getExportReportData } from "@/actions/export";
import { generateAndPrintPDFReport } from "@/lib/export/pdf-generator";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
}

export function ExportModal({ isOpen, onClose, wallets }: ExportModalProps) {
  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

  const [rangeMode, setRangeMode] = useState<"current" | "all" | "custom">("current");
  const [customMonth, setCustomMonth] = useState(currentMonthPeriod);
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedWallet, setSelectedWallet] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    period: string;
    totalRows: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    setError(null);
    setSuccessInfo(null);
    setIsExporting(true);

    try {
      let period: string | undefined = undefined;
      if (rangeMode === "current") {
        period = currentMonthPeriod;
      } else if (rangeMode === "custom") {
        period = customMonth;
      } else {
        period = "all";
      }

      const res = await getExportReportData({
        period,
        type: selectedType,
        walletId: selectedWallet,
      });

      if (res.success && res.data) {
        // Trigger browser printable window / PDF engine
        generateAndPrintPDFReport(res.data);
        setSuccessInfo({
          period: res.data.periodLabel,
          totalRows: res.data.totalTransactions,
        });
      } else {
        setError(res.error ?? "Gagal mengekspor laporan PDF");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memproses ekspor PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden">
        {/* Mobile grab handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Header (Pinned) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                Ekspor Dokumen (PDF)
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Unduh atau cetak laporan keuangan formal siap pakai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Dokumen PDF Siap Dicetak!</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {successInfo.totalRows} catatan transaksi untuk periode{" "}
                <span className="font-semibold underline">
                  {successInfo.period}
                </span>{" "}
                telah dibuka di jendela cetak browser.
              </p>
            </div>
          )}

          {/* Range Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Periode Laporan PDF
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              {(
                [
                  { id: "current", label: "Bulan Ini" },
                  { id: "custom", label: "Pilih Bulan" },
                  { id: "all", label: "Semua" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRangeMode(tab.id)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all duration-100 ${
                    rangeMode === tab.id
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {rangeMode === "custom" && (
              <div className="mt-2.5">
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Pilih Bulan Transaksi
                </label>
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => setCustomMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Mutation Type Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Filter Tipe Mutasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "all", label: "Semua Tipe" },
                  { id: "expense", label: "Pengeluaran" },
                  { id: "income", label: "Pemasukan" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                    selectedType === t.id
                      ? "bg-zinc-100 dark:bg-zinc-800 border-emerald-500 text-zinc-900 dark:text-zinc-100 font-semibold"
                      : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Filter Dompet
            </label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Dompet & Rekening</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Preview Highlights */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              📄 Kelengkapan Dokumen PDF:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-zinc-500 dark:text-zinc-400">
              <li>Header formal Pintar Finance & metadata pengguna</li>
              <li>Ringkasan Arus Kas Masuk, Keluar, dan Saldo Bersih</li>
              <li>Tabel transaksi terperinci dengan tipografi monospaced</li>
              <li>Siap dicetak langsung atau disimpan sebagai file PDF (*Save as PDF*)</li>
            </ul>
          </div>
        </div>

        {/* Pinned Sticky Footer */}
        <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Printer className="w-3.5 h-3.5" />
            )}
            Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
