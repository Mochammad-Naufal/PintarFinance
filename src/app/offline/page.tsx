"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  WifiOff,
  RefreshCw,
  Home,
  ShieldCheck,
  Calculator,
  ArrowRight,
} from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleReload = () => {
    setIsChecking(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150 relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 text-center">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/logo.png"
            alt="Pintar Finance"
            width={40}
            height={40}
            unoptimized
            priority
            className="w-10 h-10 rounded-xl object-contain shadow-md shadow-emerald-500/20"
          />
          <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
            Pintar Finance
          </span>
        </div>

        {/* Offline Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <WifiOff className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {isOnline ? "Koneksi Tersambung Kembali!" : "Anda Sedang Offline"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {isOnline
                ? "Jaringan internet Anda sudah aktif kembali. Silakan muat ulang halaman untuk menyinkronkan data terbaru."
                : "Koneksi internet Anda terputus. Jangan khawatir, UI shell dan data ter-cache tetap tersimpan aman di perangkat Anda."}
            </p>
          </div>

          {/* Offline Information Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Status Offline Mode:</span>
            </div>
            <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 pl-6 list-disc">
              <li>UI shell &amp; tema aplikasi tetap dapat diakses</li>
              <li>Simulasi kalkulator investasi tetap berfungsi penuh</li>
              <li>Data mutasi baru akan disinkronkan saat online</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleReload}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              />
              <span>{isChecking ? "Memeriksa Jaringan..." : "Muat Ulang Halaman"}</span>
            </button>

            <Link
              href="/calculator"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
            >
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Buka Kalkulator (Bisa Offline)</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
          PWA Offline Engine • Pintar Finance
        </p>
      </div>
    </div>
  );
}
