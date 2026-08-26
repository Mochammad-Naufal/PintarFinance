"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  GraduationCap,
  type LucideIcon,
  PiggyBank,
  Receipt,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0 bg-zinc-900 border-r border-zinc-800/60">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-zinc-800/60 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-50">
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
                  ? "bg-zinc-800 text-zinc-50 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Demo user card */}
      <div className="px-3 pb-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/40">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-emerald-400">D</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">Demo User</p>
            <p className="text-[10px] text-zinc-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
