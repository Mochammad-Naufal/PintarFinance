"use client";

import { useState } from "react";
import { Camera, MessageSquarePlus, Sparkles, Zap } from "lucide-react";
import { type Category, type SavingsGoal, type Wallet } from "@/types/finance";
import { QuickEntryModal } from "./QuickEntryModal";
import { ReceiptScanModal } from "./ReceiptScanModal";

interface AIHubClientProps {
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
}

export function AIHubClient({
  wallets,
  categories,
  savingsGoals,
}: AIHubClientProps) {
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isReceiptScanOpen, setIsReceiptScanOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Pintar AI Engine (Beta)
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Catat Keuangan Tanpa Ribet dengan Asisten AI
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl">
            Cukup ketik kalimat santai dalam bahasa Indonesia atau unggah foto struk belanja, Pintar AI akan mengekstrak nominal, dompet, dan kategori secara otomatis.
          </p>
        </div>
      </div>

      {/* Two Main AI Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Text Entry Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquarePlus className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Natural Language Quick Entry
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Ketik teks bebas seperti &ldquo;Beli bensin 50rb di Pertamina pake BCA&rdquo; atau &ldquo;Tabung 500rb ke Dana Nikah&rdquo;.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Fitur Unggulan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Mendeteksi tipe (Pengeluaran, Pemasukan, Transfer, Menabung)</li>
                <li>Mendukung singkatan angka: 50rb, 50k, 2.5jt, 100 ribu</li>
                <li>Review & konfirmasi interaktif sebelum disimpan</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            Buka Quick Entry AI
          </button>
        </div>

        {/* Vision Receipt OCR Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Camera className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                AI Vision Receipt Scanner
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Ambil atau unggah foto struk belanja cafe, minimarket, atau restoran untuk mengekstrak seluruh rincian belanja.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Fitur Unggulan:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Mendeteksi nama toko/merchant dan tanggal transaksi</li>
                <li>Ekstraksi tabel rincian menu/barang beserta kuantitas</li>
                <li>Rekomendasi kategori pengeluaran otomatis</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setIsReceiptScanOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            Pindai Struk Belanja
          </button>
        </div>
      </div>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
      />

      <ReceiptScanModal
        isOpen={isReceiptScanOpen}
        onClose={() => setIsReceiptScanOpen(false)}
        wallets={wallets}
        categories={categories}
      />
    </div>
  );
}
