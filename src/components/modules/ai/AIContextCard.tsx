"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  type AIAnalysisResponse,
  type AIModuleType,
  getModuleAIAnalysis,
} from "@/actions/ai-advisor";

interface AIContextCardProps {
  moduleType: AIModuleType;
  moduleName: string;
  className?: string;
}

export function AIContextCard({
  moduleType,
  moduleName,
  className = "",
}: AIContextCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchAnalysis = async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await getModuleAIAnalysis(moduleType);
      if (res.success && res.data) {
        setAnalysis(res.data);
        setStatus("success");
      } else {
        setErrorMessage(res.error ?? "Gagal mendapatkan analisis AI");
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan saat menghubungi server AI.");
      setStatus("error");
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        status === "success"
          ? "bg-white dark:bg-zinc-900/80 border-emerald-500/30 dark:border-emerald-500/20"
          : "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80"
      } ${className}`}
    >
      {/* ─── State 1: Idle Banner ─────────────────────────────────────────── */}
      {status === "idle" && (
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Pintar AI Advisor: {moduleName}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Gemini 1.5
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Dapatkan evaluasi kesehatan finansial otomatis dan rekomendasi aksi nyata berdasarkan data mutasi Anda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFetchAnalysis}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all shrink-0 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>Minta Analisis AI</span>
          </button>
        </div>
      )}

      {/* ─── State 2: Loading Shimmer ─────────────────────────────────────── */}
      {status === "loading" && (
        <div className="p-5 sm:p-6 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Pintar AI sedang menganalisis data {moduleName}...
              </p>
              <p className="text-[10px] text-zinc-400">
                Mengevaluasi rasio likuiditas, pola pengeluaran, dan target finansial
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-4/5 animate-pulse" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full animate-pulse" />
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* ─── State 3: Error ──────────────────────────────────────────────── */}
      {status === "error" && (
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage || "Gagal memuat analisis AI"}</span>
          </div>
          <button
            type="button"
            onClick={handleFetchAnalysis}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-200"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ─── State 4: Success Result Card ─────────────────────────────────── */}
      {status === "success" && analysis && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          {/* Header Row: Badge & Refresh */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {analysis.status === "healthy" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Kondisi Sehat
                </span>
              )}
              {analysis.status === "warning" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Perlu Perhatian
                </span>
              )}
              {analysis.status === "critical" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Evaluasi Kritis
                </span>
              )}
              <span className="text-[10px] text-zinc-400">
                Analisis AI • {moduleName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFetchAnalysis}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1 rounded-lg transition-colors"
              title="Analisis Ulang Data Terbaru"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Perbarui</span>
            </button>
          </div>

          {/* Headline & Summary */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
              {analysis.headline}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* 2-Column: Key Insights & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
            {/* Insights */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Temuan Kunci</span>
              </h4>
              <ul className="space-y-1 text-zinc-700 dark:text-zinc-300">
                {analysis.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span>Rekomendasi Tindakan</span>
              </h4>
              <ul className="space-y-1 text-zinc-700 dark:text-zinc-300">
                {analysis.actionableRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <ArrowRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
