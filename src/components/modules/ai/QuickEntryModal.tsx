"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  type Category,
  type SavingsGoal,
  type TransactionInput,
  type TransactionType,
  type Wallet,
} from "@/types/finance";
import { type ParsedTransactionResult } from "@/lib/ai/types";
import { parseQuickEntryText } from "@/actions/ai";
import { createTransaction } from "@/actions/transactions";
import { formatCurrency } from "@/lib/utils";

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  onSuccess?: () => void;
}

const SAMPLE_PROMPTS = [
  "Beli bensin di Pertamina 50rb pake BCA",
  "Gaji freelance desain masuk ke BCA 3.5jt",
  "Transfer 200rb dari BCA ke GoPay",
  "Tabung 500rb dari BCA ke Dana Darurat",
  "Makan siang di Warteg 25k pake Kas Tunai",
];

export function QuickEntryModal({
  isOpen,
  onClose,
  wallets,
  categories,
  savingsGoals,
  onSuccess,
}: QuickEntryModalProps) {
  const [promptText, setPromptText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parsed review state
  const [parsedData, setParsedData] = useState<ParsedTransactionResult | null>(
    null
  );

  // Editable review fields
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [destinationWalletId, setDestinationWalletId] = useState(
    wallets[1]?.id ?? wallets[0]?.id ?? ""
  );
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.type === "expense")?.id ?? ""
  );
  const [savingsGoalId, setSavingsGoalId] = useState(savingsGoals[0]?.id ?? "");
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  if (!isOpen) return null;

  const handleParse = async (textToParse?: string) => {
    const targetText = textToParse ?? promptText;
    if (!targetText.trim()) return;

    setError(null);
    setIsParsing(true);
    setSuccessMessage(null);

    try {
      const res = await parseQuickEntryText(targetText);
      if (res.success && res.data) {
        const d = res.data;
        setParsedData(d);
        setType(d.type);
        setAmount(String(d.amount));
        setDescription(d.description);

        if (d.wallet_id) setWalletId(d.wallet_id);
        if (d.destination_wallet_id) setDestinationWalletId(d.destination_wallet_id);
        if (d.category_id) setCategoryId(d.category_id);
        if (d.savings_goal_id) setSavingsGoalId(d.savings_goal_id);
        if (d.transaction_date) {
          setTransactionDate(d.transaction_date.slice(0, 16));
        }
      } else {
        setError(res.error ?? "Gagal menganalisis teks");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis saat menghubungi Pintar AI");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveConfirmed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload: TransactionInput = {
        type,
        wallet_id: walletId,
        destination_wallet_id: type === "transfer" ? destinationWalletId : null,
        category_id: type === "expense" || type === "income" ? categoryId : null,
        savings_goal_id: type === "saving" ? savingsGoalId : null,
        amount: Number(amount) || 0,
        admin_fee: 0,
        transaction_date: new Date(transactionDate).toISOString(),
        description: description.trim() || null,
        receipt_url: null,
      };

      const res = await createTransaction(payload);
      if (res.success) {
        setSuccessMessage("Transaksi berhasil dicatat ke buku kas!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset
          setParsedData(null);
          setPromptText("");
          setSuccessMessage(null);
        }, 1200);
      } else {
        setError(res.error ?? "Gagal menyimpan transaksi");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan transaksi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                Pintar AI Quick Entry
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Ketik kalimat bebas dalam bahasa Indonesia santai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Step 1: Input Natural Language Prompt */}
        {!parsedData && (
          <div className="space-y-4">
            <div>
              <textarea
                rows={3}
                placeholder="Contoh: Beli bensin di Shell 75rb pake BCA, atau Dapet transferan freelance 2.5jt masuk GoPay..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick Prompts Pills */}
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                💡 Coba contoh cepat:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPromptText(sample);
                      handleParse(sample);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-left"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isParsing || !promptText.trim()}
              onClick={() => handleParse()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menganalisis dengan AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analisis Transaksi
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Interactive Review & Confirmation */}
        {parsedData && (
          <form onSubmit={handleSaveConfirmed} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                ✨ Berhasil diekstrak ({parsedData.type.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Ubah Prompt
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nominal
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  min="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                />
              </div>
              {Number(amount) > 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  = {formatCurrency(Number(amount))}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan / Deskripsi
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Wallets / Accounts Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  {type === "income" ? "Dompet Penerima" : "Dompet Asal"}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {type === "transfer" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Dompet Tujuan
                  </label>
                  <select
                    value={destinationWalletId}
                    onChange={(e) => setDestinationWalletId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {wallets
                      .filter((w) => w.id !== walletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(type === "expense" || type === "income") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {categories
                      .filter((c) => c.type === type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {type === "saving" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Pos Impian
                  </label>
                  <select
                    value={savingsGoalId}
                    onChange={(e) => setSavingsGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    {savingsGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tanggal & Waktu
              </label>
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
              >
                Ulangi
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                Konfirmasi & Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
