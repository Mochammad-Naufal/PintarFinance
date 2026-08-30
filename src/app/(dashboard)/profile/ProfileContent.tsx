"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Cake,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FileText,
  ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  PieChart,
  Repeat,
  Scale,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { joinSavingsGoalWithCode } from "@/actions/savings";
import { updateUserProfile } from "@/actions/profile";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  type SavingsGoal,
  type UserProfile,
  type UserProfileInput,
  type Wallet,
} from "@/types/finance";
import { calculateAge, formatCurrency, formatDate } from "@/lib/utils";
import { compressImageToWebP } from "@/lib/imageCompressor";
import { InviteMemberModal } from "@/components/modules/savings/InviteMemberModal";
import { ExportModal } from "@/components/modules/transactions/ExportModal";

interface ProfileContentProps {
  user: UserProfile;
  savingsGoals: SavingsGoal[];
  wallets: Wallet[];
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
];

export function ProfileContent({
  user: initialUser,
  savingsGoals,
  wallets,
}: ProfileContentProps) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Profile Edit State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [editOccupation, setEditOccupation] = useState(user.occupation || "");
  const [editBirthDate, setEditBirthDate] = useState(user.birth_date || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user.avatar_url || "");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setProfileError(null);

    try {
      // Compress client-side to WebP (max 400px, quality 0.82)
      const compressedWebP = await compressImageToWebP(file, {
        maxDimension: 400,
        quality: 0.82,
      });
      setEditAvatarUrl(compressedWebP);
      setProfileSuccess("Foto berhasil dikompresi ke WebP!");
    } catch (err: any) {
      setProfileError(err?.message || "Gagal memproses dan mengompresi gambar.");
    } finally {
      setIsCompressing(false);
      // Reset input value so user can select the same file again if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
  const age = calculateAge(user.birth_date);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileError("Nama lengkap wajib diisi.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const payload: UserProfileInput = {
      name: editName.trim(),
      occupation: editOccupation.trim() || null,
      birth_date: editBirthDate || null,
      avatar_url: editAvatarUrl.trim() || null,
    };

    try {
      const res = await updateUserProfile(payload);
      if (res.success && res.data) {
        setUser(res.data);
        setProfileSuccess("Profil berhasil diperbarui!");
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setProfileSuccess(null);
        }, 800);
      } else {
        setProfileError(res.error ?? "Gagal menyimpan perubahan profil.");
      }
    } catch {
      setProfileError("Terjadi kesalahan teknis saat menyimpan profil.");
    } finally {
      setIsSavingProfile(false);
    }
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
          Profil &amp; Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Kelola data personal pengguna, tabungan bersama, dan preferensi aplikasi Anda.
        </p>
      </div>

      {/* ─── 1. Profile User Card with Rich Details ──────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 min-w-0 flex-1">
          {/* Avatar Photo / Initial */}
          <div className="relative group shrink-0">
            {user.avatar_url ? (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-xs relative bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  width={88}
                  height={88}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {initial}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditName(user.name);
                setEditOccupation(user.occupation || "");
                setEditBirthDate(user.birth_date || "");
                setEditAvatarUrl(user.avatar_url || "");
                setProfileError(null);
                setProfileSuccess(null);
                setIsEditProfileOpen(true);
              }}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
              title="Ubah Foto Profil & Data Diri"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {user.name}
              </h2>
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Akun Terverifikasi</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>

            {/* Profession & Age Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {user.occupation ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  <Briefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{user.occupation}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-[11px] text-zinc-400 hover:text-emerald-600 underline"
                >
                  + Tambah Profesi
                </button>
              )}

              {user.birth_date ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  <Cake className="w-3 h-3 text-amber-500" />
                  <span>
                    {age !== null ? `${age} Tahun` : formatDate(user.birth_date)}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-[11px] text-zinc-400 hover:text-emerald-600 underline"
                >
                  + Tambah Tgl Lahir
                </button>
              )}
            </div>

            {/* Summary Stats */}
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

        {/* Edit Profile CTA Button */}
        <button
          type="button"
          onClick={() => {
            setEditName(user.name);
            setEditOccupation(user.occupation || "");
            setEditBirthDate(user.birth_date || "");
            setEditAvatarUrl(user.avatar_url || "");
            setProfileError(null);
            setProfileSuccess(null);
            setIsEditProfileOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer shrink-0"
        >
          Edit Data Diri
        </button>
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
              <span>Pilih Pos &amp; Undang</span>
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

      {/* ─── 3. Master Data, Preferences & Financial Management ───────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Pengaturan Master Data &amp; Keuangan
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Categories Management */}
          <Link
            href="/categories"
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Tag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Manajemen Kategori Transaksi
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                    Master Data
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Kelola taksonomi kategori bawaan dan buat kategori kustom
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Debts & Liabilities Management */}
          <Link
            href="/debts"
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Pencatatan Hutang &amp; Piutang (Liabilitas)
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 whitespace-nowrap shrink-0">
                    Liabilitas
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Monitor jatuh tempo, bayar cicilan, dan sinkronkan dengan Net Worth
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Export PDF Document */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Ekspor Dokumen PDF
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase whitespace-nowrap shrink-0">
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
                  Tagihan &amp; Transaksi Berulang
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
            href="/transactions?tab=budget"
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
            Sistem &amp; Kecerdasan AI
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
                  Google Gemini Flash &amp; Certified Financial Planner
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
            Manajemen Akun &amp; Sesi
          </h3>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isSigningOut ? "Sedang Keluar..." : "Keluar Akun (Sign Out)"}</span>
          </button>
        </div>
      </div>

      {/* ─── Modal: Edit User Profile ─────────────────────────────────────── */}
      {isEditProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingProfile) {
              setIsEditProfileOpen(false);
            }
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Personalisasi Profil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
                {profileError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {/* Avatar Preview & Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Foto Profil / Avatar
                    </label>
                    {editAvatarUrl && editAvatarUrl.startsWith("data:image/webp") && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ✓ WebP Terkompresi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs relative">
                      {editAvatarUrl ? (
                        <Image
                          src={editAvatarUrl}
                          alt="Preview Avatar"
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {editName.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />

                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressing}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-300/80 dark:border-zinc-700 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isCompressing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>
                          {isCompressing
                            ? "Mengompresi ke WebP..."
                            : "Pilih dari Galeri / File"}
                        </span>
                      </button>

                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        Foto otomatis dikompresi ke format WebP (max 400px) agar hemat memori &amp; cepat dimuat.
                      </p>
                    </div>
                  </div>

                  {/* Avatar Preset Grid */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Atau pilih karakter avatar preset:
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatarUrl(url)}
                          className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            editAvatarUrl === url
                              ? "border-emerald-500 scale-105 shadow-xs"
                              : "border-transparent opacity-75 hover:opacity-100 hover:border-zinc-300"
                          }`}
                        >
                          <Image
                            src={url}
                            alt={`Preset ${idx + 1}`}
                            width={44}
                            height={44}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom URL Input */}
                  <input
                    type="url"
                    placeholder="Atau tempel URL gambar (https://...)"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 mt-2"
                  />
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Occupation Input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Pekerjaan / Sumber Penghasilan Utama
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Contoh: Software Engineer, Wirausaha, Dokter..."
                    value={editOccupation}
                    onChange={(e) => setEditOccupation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Birth Date & Auto Age Calculation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Tanggal Lahir
                    </label>
                    {editBirthDate && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        Usia: {calculateAge(editBirthDate)} Tahun
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={isSavingProfile}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile || !editName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
