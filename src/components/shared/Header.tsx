"use client";

import Link from "next/link";
import { Bell, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { cn, formatDate } from "@/lib/utils";

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { theme, toggle } = useTheme();
  const today = formatDate(new Date(), "EEEE, d MMMM yyyy");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-16 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80 transition-colors duration-150">
      {/* Left: Greeting + date */}
      <div className="flex flex-col justify-center">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
          Selamat Datang 👋
        </h1>
        <p
          suppressHydrationWarning
          className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 hidden sm:block capitalize"
        >
          {today}
        </p>
      </div>

      {/* Right: Actions row */}
      <div className="flex items-center gap-2">
        {/* Quick AI Trigger */}
        <Link
          href="/ai"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all active:scale-[0.95]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pintar AI</span>
        </Link>

        {/* Notification */}
        <button
          className={cn(
            "p-2 rounded-lg text-zinc-600 dark:text-zinc-400",
            "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "transition-all duration-100 active:scale-[0.95]"
          )}
          aria-label="Notifikasi"
        >
          <Bell className="w-4 h-4" strokeWidth={1.75} />
        </button>

        {/* Theme toggle with hydration suppression */}
        <button
          suppressHydrationWarning
          onClick={toggle}
          className={cn(
            "p-2 rounded-lg text-zinc-600 dark:text-zinc-400",
            "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            "transition-all duration-100 active:scale-[0.95]"
          )}
          aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">D</span>
          </div>
          <div className="hidden md:block pr-1">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-none">Demo User</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
