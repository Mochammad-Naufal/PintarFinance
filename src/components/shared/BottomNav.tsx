"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, type LucideIcon, PiggyBank, Plus, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Home",      icon: Home     },
  { href: "/transactions", label: "Transaksi", icon: Receipt  },
  // Center FAB placeholder — rendered inline below
  { href: "/savings",      label: "Tabungan",  icon: PiggyBank },
  { href: "/profile",      label: "Profil",    icon: User     },
];

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/80 transition-colors duration-150"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-1 h-16">
        {/* First 2 items: Home, Transaksi */}
        {NAV_ITEMS.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] h-full",
                "transition-all duration-100 active:scale-[0.90]",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}

        {/* Center FAB — Floating Add Button */}
        <button
          className={cn(
            "flex items-center justify-center w-14 h-14 -mt-5 rounded-2xl shrink-0",
            "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25",
            "transition-all duration-100 active:scale-[0.90] hover:bg-emerald-400"
          )}
          aria-label="Tambah Transaksi"
        >
          <Plus className="w-6 h-6" strokeWidth={2.25} />
        </button>

        {/* Last 2 items: Tabungan, Profil */}
        {NAV_ITEMS.slice(2).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] h-full",
                "transition-all duration-100 active:scale-[0.90]",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
