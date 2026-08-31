"use client";

import { useState } from "react";
import { Mic, MicOff, Radio, Sparkles, Volume2, X } from "lucide-react";
import {
  type Category,
  type SavingsGoal,
  type Wallet,
} from "@/types/finance";
import {
  type ParsedVoiceTransaction,
  parseSpeechToTransaction,
} from "@/lib/speechParser";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

interface VoiceTransactionButtonProps {
  wallets: Wallet[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  onParsed: (result: ParsedVoiceTransaction) => void;
  onLiveTranscript?: (text: string) => void;
  className?: string;
  compact?: boolean;
}

export function VoiceTransactionButton({
  wallets,
  categories,
  savingsGoals,
  onParsed,
  onLiveTranscript,
  className = "",
  compact = false,
}: VoiceTransactionButtonProps) {
  const [activeTranscript, setActiveTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: "id-ID",
    onResult: (spokenText, isFinal) => {
      setActiveTranscript(spokenText);
      onLiveTranscript?.(spokenText);

      if (isFinal && spokenText.trim()) {
        setIsProcessing(true);
        setTimeout(() => {
          const parsed = parseSpeechToTransaction(spokenText, {
            wallets,
            categories,
            savingsGoals,
          });
          onParsed(parsed);
          setIsProcessing(false);
        }, 200);
      }
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isListening) {
      stopListening();
    } else {
      setActiveTranscript("");
      startListening();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleToggle}
        title={
          isListening
            ? "Sedang merekam suara... Klik untuk berhenti"
            : "Klik untuk rekam transaksi via suara (Bahasa Indonesia)"
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border select-none ${
          isListening
            ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-md animate-pulse"
            : isProcessing
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40"
        } ${className}`}
      >
        {isListening ? (
          <>
            <Radio className="w-3.5 h-3.5 animate-spin" />
            {!compact && <span>Mendengarkan...</span>}
          </>
        ) : isProcessing ? (
          <>
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
            {!compact && <span>Menganalisis...</span>}
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            {!compact && <span>Input Suara</span>}
          </>
        )}
      </button>

      {/* Floating Active Voice Listening Banner (Higher z-index than modals) */}
      {isListening && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-2xl bg-zinc-900/95 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[90vw] sm:max-w-md"
        >
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Bicarakan Transaksi Anda:
            </p>
            <p className="text-xs font-medium truncate mt-0.5">
              {interimTranscript || activeTranscript || "Contoh: 'Makan siang 25 ribu pakai BCA'..."}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              stopListening();
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white dark:hover:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Error Message */}
      {errorMessage && !isListening && (
        <div className="absolute top-full left-0 mt-1.5 z-[110] p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-600 dark:text-rose-400 whitespace-nowrap shadow-md">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
