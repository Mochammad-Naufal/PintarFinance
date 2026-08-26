"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  CreditCard,
  GraduationCap,
  LogIn,
  LogOut,
  type LucideIcon,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Receipt,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/actions/auth";
import { useSidebar } from "./SidebarContext";

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",        icon: BarChart3                          },
  { href: "/wallets",      label: "Dompet",           icon: CreditCard                         },
  { href: "/transactions", label: "Transaksi",        icon: Receipt                            },
  { href: "/budgets",      label: "Anggaran",         icon: GraduationCap                      },
  { href: "/savings",      label: "Tabungan Impian",  icon: PiggyBank                          },
  { href: "/calculator",   label: "Kalkulator Bunga", icon: Calculator                         },
  { href: "/ai",           label: "AI Quick Scan",    icon: Sparkles,      badge: "Beta"       },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [user, setUser] = useState<{ name: string; email: string; isDemo: boolean }>({
    name: "Demo User",
    email: "demo@pintarfinance.com",
    isDemo: true,
  });

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split("@")[0] || "Pengguna",
          email: authUser.email || "user@pintarfinance.com",
          isDemo: false,
        });
      } else {
        setUser({
          name: "Demo User",
          email: "demo@pintarfinance.com",
          isDemo: true,
        });
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Pengguna",
          email: session.user.email || "user@pintarfinance.com",
          isDemo: false,
        });
      } else {
        setUser({
          name: "Demo User",
          email: "demo@pintarfinance.com",
          isDemo: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initial = user.name.charAt(0).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed top-0 left-0 bottom-0 h-screen z-30",
        "bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80",
        "transition-all duration-300 ease-in-out select-none shadow-xs",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header: Logo + Toggle Button */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2.5 min-w-0 transition-opacity duration-200",
            isCollapsed ? "justify-center w-full" : ""
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-xs shrink-0">
            <BarChart3 className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
              Pintar Finance
            </span>
          )}
        </Link>

        {/* Toggle Button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Tutup Panel Sidebar"
            aria-label="Tutup Panel Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When collapsed, toggle button placed below header */}
      {isCollapsed && (
        <div className="flex justify-center pt-2 shrink-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Buka Panel Sidebar"
            aria-label="Buka Panel Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overscroll-contain">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group",
                isCollapsed ? "justify-center px-0 h-10 w-full" : "",
                isActive
                  ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-150",
                  isActive ? "text-emerald-600 dark:text-emerald-400 scale-105" : "text-zinc-500 dark:text-zinc-400"
                )}
                strokeWidth={isActive ? 2 : 1.75}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip on collapsed hover */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile card & action */}
      <div className="p-3 shrink-0 border-t border-zinc-200 dark:border-zinc-800/80">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{initial}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user.isDemo ? "Mode Demo" : "Free Plan"}</p>
              </div>
            </div>

            {user.isDemo ? (
              <Link
                href="/login"
                title="Masuk Akun Pribadi"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => signOut()}
                title="Keluar Akun"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {user.isDemo ? (
              <Link
                href="/login"
                title={`${user.name} (Masuk Akun)`}
                className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
              >
                {initial}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => signOut()}
                title={`${user.name} (Keluar)`}
                className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
              >
                {initial}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
