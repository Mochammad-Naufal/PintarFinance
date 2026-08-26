"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  GraduationCap,
  LogIn,
  LogOut,
  type LucideIcon,
  PiggyBank,
  Receipt,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/actions/auth";

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",       icon: BarChart3                          },
  { href: "/wallets",      label: "Dompet",          icon: CreditCard                         },
  { href: "/transactions", label: "Transaksi",       icon: Receipt                            },
  { href: "/budgets",      label: "Anggaran",        icon: GraduationCap                      },
  { href: "/savings",      label: "Tabungan Impian", icon: PiggyBank                          },
  { href: "/ai",           label: "AI Quick Scan",   icon: Sparkles,      badge: "Beta"       },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
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
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800/80 transition-colors duration-150">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-xs">
          <BarChart3 className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
          Pintar Finance
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                "transition-all duration-150 active:scale-[0.98]",
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-50 font-medium"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile card & action */}
      <div className="px-3 pb-4 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{user.name}</p>
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
      </div>
    </aside>
  );
}
