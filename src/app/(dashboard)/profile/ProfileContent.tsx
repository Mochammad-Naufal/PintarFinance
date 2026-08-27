"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Moon, ShieldCheck, Sun, User as UserIcon } from "lucide-react";
import { signOut } from "@/actions/auth";
import { useTheme } from "@/components/shared/ThemeProvider";

interface ProfileContentProps {
  user: {
    name: string;
    email: string;
    isDemo: boolean;
  };
}

export function ProfileContent({ user }: ProfileContentProps) {
  const { theme, toggle } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initial = user.name.charAt(0).toUpperCase() || "U";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Profil & Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Kelola preferensi akun dan pengaturan aplikasi Anda.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <span className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400">
            {initial}
          </span>
        </div>
        
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {user.name}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.email}
          </p>
          
          <div className="pt-2 flex justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>{user.isDemo ? "Sesi Demo Aktif" : "Akun Terverifikasi"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Preferensi Aplikasi
          </h3>
        </div>
        
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tema Tampilan
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {theme === "light" ? "Beralih ke mode gelap" : "Beralih ke mode terang"}
                </p>
              </div>
            </div>
            <div suppressHydrationWarning className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              {theme === "light" ? "Terang" : "Gelap"}
            </div>
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Manajemen Akun
          </h3>
        </div>
        
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 p-2">
          {user.isDemo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Masuk Akun Pribadi
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <UserIcon className="w-4 h-4" />
                Daftar Akun Baru
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? "Keluar..." : "Keluar Akun (Sign Out)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
