"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Shield,
  X,
} from "lucide-react";
import {
  type FeedbackCategory,
  type FeedbackInput,
} from "@/types/finance";
import { submitFeedback } from "@/actions/feedback";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Array<{
  id: FeedbackCategory;
  label: string;
  icon: typeof Bug;
  description: string;
}> = [
  {
    id: "bug",
    label: "Bug / Error",
    icon: Bug,
    description: "Laporkan masalah tampilan atau kegagalan fitur",
  },
  {
    id: "feature_request",
    label: "Saran Fitur",
    icon: Lightbulb,
    description: "Ide inovasi atau perbaikan alur yang Anda inginkan",
  },
  {
    id: "question",
    label: "Pertanyaan",
    icon: HelpCircle,
    description: "Tanyakan bantuan cara penggunaan aplikasi",
  },
  {
    id: "other",
    label: "Lain-lain",
    icon: MessageSquare,
    description: "Ulasan umum atau apresiasi untuk pengembang",
  },
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setError("Pesan masukan minimal 5 karakter.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: FeedbackInput = {
        category,
        message: message.trim(),
        is_anonymous: isAnonymous,
      };

      const res = await submitFeedback(payload);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setMessage("");
          setIsAnonymous(false);
          onClose();
        }, 1800);
      } else {
        setError(res.error ?? "Gagal mengirimkan masukan.");
      }
    } catch {
      setError("Terjadi kesalahan teknis saat mengirim masukan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Kirim Masukan &amp; Saran
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Bantu kami menyempurnakan Pintar Finance untuk Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Masukan Berhasil Dikirim!
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Terima kasih banyak atas kontribusi Anda. Tim pengembang akan meninjau saran dan laporan ini secara seksama.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Kategori Masukan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 shadow-xs"
                            : "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
                          <span>{cat.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-tight">
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Pesan Masukan / Ulasan
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {message.length}/2000
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  maxLength={2000}
                  placeholder={
                    category === "bug"
                      ? "Jelaskan langkah yang memicu error, perangkat yang digunakan, dan apa yang seharusnya terjadi..."
                      : category === "feature_request"
                      ? "Ceritakan fitur atau perbaikan apa yang ingin Anda tambahkan di Pintar Finance..."
                      : "Tuliskan pertanyaan atau ulasan Anda secara lengkap..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                      Kirim sebagai Anonim
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">
                      {isAnonymous
                        ? "Identitas dan email akun Anda akan disamarkan sebagai 'Pengguna Anonim'."
                        : "Nama dan email Anda akan dilampirkan agar pengembang dapat menindaklanjuti masukan Anda."}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xs shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || message.trim().length < 5}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Kirim Masukan</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
