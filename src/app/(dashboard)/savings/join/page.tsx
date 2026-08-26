"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Users,
} from "lucide-react";
import {
  getSavingsInviteDetails,
  joinSavingsGoalWithCode,
} from "@/actions/savings";
import { type SavingsGoalInvite } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";

function JoinSavingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [invite, setInvite] = useState<SavingsGoalInvite | null>(null);
  const [manualCode, setManualCode] = useState(code);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (code) {
      const timer = setTimeout(() => {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        getSavingsInviteDetails(code)
          .then((res) => {
            if (isMounted) {
              if (res.success && res.data) {
                setInvite(res.data);
              } else {
                setError(res.error ?? "Kode undangan tidak valid atau kadaluarsa.");
              }
            }
          })
          .catch((err) => {
            console.error(err);
            if (isMounted) setError("Gagal memuat detail undangan.");
          })
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }, 0);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [code]);

  const handleFetchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await getSavingsInviteDetails(manualCode.trim());
      if (res.success && res.data) {
        setInvite(res.data);
      } else {
        setError(res.error ?? "Kode undangan tidak ditemukan.");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memverifikasi kode undangan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    const targetCode = invite?.invite_code || manualCode.trim();
    if (!targetCode) return;

    setIsJoining(true);
    setError(null);

    try {
      const res = await joinSavingsGoalWithCode(targetCode);
      if (res.success) {
        setJoinedSuccess(true);
        setTimeout(() => {
          router.push("/savings");
          router.refresh();
        }, 1500);
      } else {
        setError(res.error ?? "Gagal bergabung ke pos tabungan.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis saat bergabung.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10 space-y-6">
      {/* Back Link */}
      <Link
        href="/savings"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Kembali ke Pos Impian</span>
      </Link>

      {/* Main Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Gabung Tabungan Bersama
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            Wujudkan target impian finansial bersama rekan, pasangan, atau keluargamu.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {joinedSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Berhasil Bergabung!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Anda kini telah terdaftar sebagai anggota pada pos tabungan ini. Mengalihkan ke halaman pos impian...
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 text-zinc-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Memverifikasi detail undangan...</p>
          </div>
        ) : invite ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Goal Preview Box */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Target Impian
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Diundang oleh <strong>{invite.inviter_name || "Pemilik"}</strong>
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {invite.goal_name}
                </h3>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-medium text-zinc-400 block">
                      Terkumpul
                    </span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
                      {formatCurrency(invite.current_amount || 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-medium text-zinc-400 block">
                      Target Dana
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(invite.target_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            <button
              type="button"
              disabled={isJoining}
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Gabung Menabung Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Manual Code Form */
          <form onSubmit={handleFetchManual} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Masukkan Kode Undangan
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SAV-ABC123XYZ"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-mono uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !manualCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Periksa Undangan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function JoinSavingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <JoinSavingsContent />
    </Suspense>
  );
}
