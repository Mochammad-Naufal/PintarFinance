"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  PieChart,
  Repeat,
  ShieldCheck,
  Sparkles,
  Sun,
  User as UserIcon,
  UserPlus,
  Users,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { joinSavingsGoalWithCode } from "@/actions/savings";
import { useTheme } from "@/components/shared/ThemeProvider";
import { type SavingsGoal, type Wallet } from "@/types/finance";
import { formatCurrency } from "@/lib/utils";
import { InviteMemberModal } from "@/components/modules/savings/InviteMemberModal";
import { ExportModal } from "@/components/modules/transactions/ExportModal";

interface ProfileContentProps {
  user: {
    name: string;
    email: string;
    isDemo: boolean;
  };
  savingsGoals: SavingsGoal[];
  wallets: Wallet[];
}

export function ProfileContent({
  user,
  savingsGoals,
  wallets,
}: ProfileContentProps) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);

  // Shared Savings State
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Modals
  const [selectedGoalForInvite, setSelectedGoalForInvite] =
    useState<SavingsGoal | null>(null);
  const [isSelectGoalModalOpen, setIsSelectGoalModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const initial = user.name.charAt(0).toUpperCase() || "U";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  const handleJoinGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || isJoining) return;

    setJoinError(null);
    setJoinSuccess(null);
    setIsJoining(true);

    try {
      const res = await joinSavingsGoalWithCode(inviteCode.trim());
      if (res.success) {
        setJoinSuccess("Berhasil bergabung ke pos tabungan bersama! Mengalihkan...");
        setInviteCode("");
        setTimeout(() => {
          router.push("/savings");
        }, 1200);
      } else {
        setJoinError(res.error ?? "Kode undangan tidak valid atau sudah kadaluarsa.");
      }
    } catch {
      setJoinError("Terjadi kesalahan teknis saat mencoba bergabung.");
    } finally {
      setIsJoining(false);
    }
  };

  // Filter shared goals
  const sharedGoals = savingsGoals.filter(
    (g) => (g.members && g.members.length > 1) || g.user_role === "member"
  );

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-28 lg:pb-12 animate-in fade-in duration-200">
      {/* ─── Page Title Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Profil & Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Kelola profil pengguna, tabungan bersama, dan preferensi aplikasi Anda.
        </p>
      </div>

      {/* ─── 1. Profile User Card ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {initial}
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </h2>
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user.isDemo ? "Mode Demo" : "Akun Terverifikasi"}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {user.email}
          </p>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {savingsGoals.length}
              </span>{" "}
              Pos Impian
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {wallets.length}
              </span>{" "}
              Dompet Aktif
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Collaborative Savings & Invites Hub ───────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Pusat Tabungan Bersama
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Undang anggota atau bergabung ke pos impian dengan kode unik
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action 2.1: Join by Code Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Gabung Pos Tabungan via Kode Undangan</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Punya kode undangan dari teman atau pasangan? Masukkan kode di bawah untuk langsung bergabung ke pos tabungan bersama.
            </p>

            <form onSubmit={handleJoinGoal} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Contoh: SAV-ABC123"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isJoining}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isJoining || !inviteCode.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>Gabung Tabungan</span>
                  </>
                )}
              </button>
            </form>

            {/* Status alerts */}
            {joinError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
                ⚠️ {joinError}
              </p>
            )}
            {joinSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                ✓ {joinSuccess}
              </p>
            )}
          </div>

          {/* Action 2.2: Invite to My Savings Goals */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                Undang Anggota ke Pos Impian Saya
              </p>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70">
                Buat tautan undangan instan atau bagikan langsung ke WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSelectGoalModalOpen(true)}
              disabled={savingsGoals.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold active:scale-[0.98] transition-all shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Pilih Pos & Undang</span>
            </button>
          </div>

          {/* Action 2.3: Shared Goals Overview */}
          {sharedGoals.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Tabungan Bersama Aktif ({sharedGoals.length})
                </p>
                <Link
                  href="/savings"
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sharedGoals.slice(0, 4).map((g) => {
                  const pct = Math.min(
                    100,
                    Math.round((g.current_amount / (g.target_amount || 1)) * 100)
                  );
                  return (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {g.name}
                        </p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 capitalize">
                          {g.user_role === "owner" ? "Pemilik" : "Anggota"}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span>{formatCurrency(g.current_amount)}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. Financial & Document Preferences (PDF Export) ─────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Preferensi & Laporan Keuangan
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Export PDF Document */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Ekspor Dokumen PDF
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase whitespace-nowrap shrink-0">
                    PDF Report
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Unduh atau cetak laporan keuangan formal terformat rapi
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Quick link: Recurring Transactions */}
          <Link
            href="/transactions"
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Repeat className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Tagihan & Transaksi Berulang
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Kelola komitmen langganan rutin dan siklus pembayaran
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Quick link: Budget Limits */}
          <Link
            href="/budgets"
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Batas Anggaran Kategori
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Atur pagu belanja bulanan agar tidak overbudget
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>
      </div>

      {/* ─── 4. Application & AI Engine Preferences ───────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Sistem & Kecerdasan AI
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Tema Tampilan
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  {theme === "light" ? "Beralih ke mode gelap (Dark)" : "Beralih ke mode terang (Light)"}
                </p>
              </div>
            </div>
            <div suppressHydrationWarning className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl whitespace-nowrap shrink-0">
              {theme === "light" ? "Mode Terang" : "Mode Gelap"}
            </div>
          </button>

          {/* AI Engine Status */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Pintar AI Engine
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Online
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Google Gemini Flash Lite & Certified Financial Planner
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Account Management & Session ──────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Manajemen Akun & Sesi
          </h3>
        </div>

        <div className="p-3">
          {user.isDemo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Masuk Akun Pribadi</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-xs"
              >
                <UserIcon className="w-4 h-4" />
                <span>Daftar Akun Baru</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSigningOut ? "Sedang Keluar..." : "Keluar Akun (Sign Out)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Modal 1: Select Goal to Invite ───────────────────────────────── */}
      {isSelectGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSelectGoalModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Pilih Pos Tabungan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectGoalModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1 pb-1">
                Pilih pos impian yang ingin Anda buatkan tautan undangan:
              </p>
              {savingsGoals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoalForInvite(g);
                    setIsSelectGoalModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-zinc-200 dark:border-zinc-700/60 transition-all text-left group cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {g.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                      Target: {formatCurrency(g.target_amount)}
                    </p>
                  </div>
                  <UserPlus className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Invite Member Modal ─────────────────────────────────── */}
      <InviteMemberModal
        isOpen={Boolean(selectedGoalForInvite)}
        onClose={() => setSelectedGoalForInvite(null)}
        goal={selectedGoalForInvite}
      />

      {/* ─── Modal 3: Export PDF Modal ─────────────────────────────────────── */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        wallets={wallets}
      />
    </div>
  );
}
