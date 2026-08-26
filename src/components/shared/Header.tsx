"use client";

import Link from "next/link";
import { Moon, PanelLeft, PanelLeftClose, Sparkles, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { cn, formatDate } from "@/lib/utils";
import { UserProfileMenu } from "./UserProfileMenu";
import { NotificationDropdown } from "@/components/modules/notifications/NotificationDropdown";
import { useSidebar } from "./SidebarContext";

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { theme, toggle } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const today = formatDate(new Date(), "EEEE, d MMMM yyyy");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80 transition-colors duration-150">
      {/* Left: Sidebar Toggle + Greeting + date */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {/* Toggle Button for Desktop Sidebar */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title={isCollapsed ? "Buka Panel Menu (Expand)" : "Sembunyikan Panel Menu (Collapse)"}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none truncate">
            Selamat Datang 👋
          </h1>
          <p
            suppressHydrationWarning
            className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 hidden sm:block capitalize truncate"
          >
            {today}
          </p>
        </div>
      </div>

      {/* Right: Actions row */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Quick AI Trigger */}
        <Link
          href="/ai"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-all active:scale-[0.95]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pintar AI</span>
        </Link>

        {/* Dynamic Notification Bell & Alert Engine */}
        <NotificationDropdown />

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

        {/* Dynamic User Profile Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
}
