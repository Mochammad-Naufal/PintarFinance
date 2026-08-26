"use client";

import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Loader2,
  Receipt,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type Category,
  type TransactionInput,
  type Wallet,
} from "@/types/finance";
import { type ParsedReceiptResult } from "@/lib/ai/types";
import { parseReceiptImage } from "@/actions/ai";
import { createTransaction } from "@/actions/transactions";
import { formatCurrency } from "@/lib/utils";

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSuccess?: () => void;
}

export function ReceiptScanModal({
  isOpen,
  onClose,
  wallets,
  categories,
  onSuccess,
}: ReceiptScanModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extracted OCR Data
  const [parsedData, setParsedData] = useState<ParsedReceiptResult | null>(null);

  // Editable Form fields
  const [merchantName, setMerchantName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.type === "expense")?.id ?? ""
  );
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setError(null);
    setIsScanning(true);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await parseReceiptImage(formData);
      if (res.success && res.data) {
        const d = res.data;
        setParsedData(d);
        setMerchantName(d.merchant_name);
        setTotalAmount(String(d.total_amount));
        if (d.suggested_category_id) setCategoryId(d.suggested_category_id);
        if (d.suggested_wallet_id) setWalletId(d.suggested_wallet_id);
        if (d.transaction_date) {
          setTransactionDate(d.transaction_date.slice(0, 16));
        }
      } else {
        setError(res.error ?? "Gagal memproses struk");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis saat menghubungi Vision OCR");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const payload: TransactionInput = {
        type: "expense",
        wallet_id: walletId,
        destination_wallet_id: null,
        category_id: categoryId,
        savings_goal_id: null,
        amount: Number(totalAmount) || 0,
        admin_fee: 0,
        transaction_date: new Date(transactionDate).toISOString(),
        description: merchantName.trim() || "Struk Belanja",
        receipt_url: imagePreview,
      };

      const res = await createTransaction(payload);
      if (res.success) {
        setSuccessMessage("Transaksi struk berhasil disimpan ke buku kas!");
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset
          setSelectedFile(null);
          setImagePreview(null);
          setParsedData(null);
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
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                AI Vision Receipt Scanner
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Pindai foto struk belanja untuk ekstraksi data instan
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

        {/* Step 1: Upload Image Area */}
        {!parsedData && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer flex flex-col items-center justify-center relative bg-zinc-50/50 dark:bg-zinc-950/50"
              onClick={() => document.getElementById("receipt-file-input")?.click()}
            >
              <input
                id="receipt-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />

              {imagePreview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview Struk"
                    className="max-h-48 max-w-full rounded-xl object-contain mx-auto border border-zinc-200 dark:border-zinc-800 shadow-xs"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Klik untuk mengganti gambar ({selectedFile?.name})
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Upload atau seret foto struk belanja
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Mendukung format JPG, PNG, atau foto langsung dari kamera HP
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedFile || isScanning}
              onClick={handleScan}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengekstrak Item & Total Struk...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Ekstrak Data Struk Sekarang
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Parsed Receipt Review Form */}
        {parsedData && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Struk Berhasil Dianalisis ({parsedData.items.length} item)
              </span>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ganti Foto
              </button>
            </div>

            {/* Merchant Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Merchant / Toko
              </label>
              <input
                type="text"
                required
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Total Tagihan Struk (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 font-mono">
                  Rp
                </span>
                <input
                  type="number"
                  min="100"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-blue-500"
                />
              </div>
              {Number(totalAmount) > 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  = {formatCurrency(Number(totalAmount))}
                </p>
              )}
            </div>

            {/* Wallet & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Dibayar Dari
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Itemized Table (if available) */}
            {parsedData.items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Daftar Rincian Barang
                </p>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs">
                  {parsedData.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                      <span className="truncate max-w-[220px] text-zinc-800 dark:text-zinc-200">
                        {item.quantity ? `${item.quantity}x ` : ""}
                        {item.name}
                      </span>
                      <span className="font-mono font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Footer */}
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Simpan Transaksi Struk
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
