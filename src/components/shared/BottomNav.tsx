"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Camera,
  Home,
  type LucideIcon,
  PiggyBank,
  Plus,
  PlusCircle,
  ReceiptText,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Category,
  type SavingsGoal,
  type Wallet,
} from "@/types/finance";
import { getWallets } from "@/actions/wallets";
import { createTransaction, getCategories } from "@/actions/transactions";
import { getSavingsGoals } from "@/actions/savings";
import { TransactionModal } from "@/components/modules/transactions/TransactionModal";
import { QuickEntryModal } from "@/components/modules/ai/QuickEntryModal";
import { ReceiptScanModal } from "@/components/modules/ai/ReceiptScanModal";
import {
  addOfflineMutation,
  getOfflineData,
  saveOfflineData,
} from "@/lib/offline/db";

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS_LEFT: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
];

const NAV_ITEMS_RIGHT: NavItem[] = [
  { href: "/savings", label: "Tabungan", icon: PiggyBank },
  { href: "/wallets", label: "Dompet", icon: WalletIcon },
];

// ─── BottomNav Component ──────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Speed Dial & Modal States
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isReceiptScanOpen, setIsReceiptScanOpen] = useState(false);

  // Data for Modals
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const fetchModalData = async () => {
    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        const [w, c, s] = await Promise.all([
          getOfflineData<Wallet[]>("wallets"),
          getOfflineData<Category[]>("categories"),
          getOfflineData<SavingsGoal[]>("savings_goals"),
        ]);
        if (w) setWallets(w);
        if (c) setCategories(c);
        if (s) setSavingsGoals(s);
        setHasLoadedData(true);
        return;
      }

      const [w, c, s] = await Promise.all([
        getWallets(),
        getCategories(),
        getSavingsGoals(),
      ]);
      setWallets(w);
      setCategories(c);
      setSavingsGoals(s);
      setHasLoadedData(true);

      if (w?.length) void saveOfflineData("wallets", w);
      if (c?.length) void saveOfflineData("categories", c);
      if (s?.length) void saveOfflineData("savings_goals", s);
    } catch (err) {
      console.warn("Failed to preload online modal data, trying offline cache:", err);
      const [w, c, s] = await Promise.all([
        getOfflineData<Wallet[]>("wallets"),
        getOfflineData<Category[]>("categories"),
        getOfflineData<SavingsGoal[]>("savings_goals"),
      ]);
      if (w) setWallets(w);
      if (c) setCategories(c);
      if (s) setSavingsGoals(s);
      setHasLoadedData(true);
    }
  };

  const handleToggleSpeedDial = () => {
    if (!hasLoadedData) {
      void fetchModalData();
    }
    setIsSpeedDialOpen((prev) => !prev);
  };

  const handleOpenManual = () => {
    setIsSpeedDialOpen(false);
    setIsManualModalOpen(true);
  };

  const handleOpenQuickEntry = () => {
    setIsSpeedDialOpen(false);
    setIsQuickEntryOpen(true);
  };

  const handleOpenReceiptScan = () => {
    setIsSpeedDialOpen(false);
    setIsReceiptScanOpen(true);
  };

  const handleModalSuccess = () => {
    router.refresh();
  };

  return (
    <>
      {/* ─── Backdrop Overlay ────────────────────────────────────────────── */}
      {isSpeedDialOpen && (
        <div
          onClick={() => setIsSpeedDialOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* ─── Floating Speed Dial Menu Popup ────────────────────────────────── */}
      {isSpeedDialOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-[290px] animate-in slide-in-from-bottom-6 fade-in duration-200 lg:hidden">
          {/* Action 1: Manual Transaction */}
          <button
            type="button"
            onClick={handleOpenManual}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xl shadow-black/10 dark:shadow-black/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:scale-[0.97] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <PlusCircle className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Transaksi Manual
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Catat pengeluaran atau pemasukan
                </p>
              </div>
            </div>
          </button>

          {/* Action 2: Quick Entry AI */}
          <button
            type="button"
            onClick={handleOpenQuickEntry}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-500/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:scale-[0.97] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Quick Entry AI
                  </p>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                    NLP
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Ketik teks santai bahasa Indonesia
                </p>
              </div>
            </div>
          </button>

          {/* Action 3: Pindai Struk AI */}
          <button
            type="button"
            onClick={handleOpenReceiptScan}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-teal-500/30 dark:border-teal-500/20 shadow-xl shadow-teal-500/10 dark:shadow-teal-500/5 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 active:scale-[0.97] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-xs">
                <Camera className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Pindai Struk AI
                  </p>
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[9px] font-bold">
                    OCR
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Scan foto nota & struk belanja
                </p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ─── Main Bottom Navigation Bar ──────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-150 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-around px-1 h-16">
          {/* Left Menu Items: Home, Transaksi */}
          {NAV_ITEMS_LEFT.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] h-full",
                  "transition-all duration-100 active:scale-[0.90]",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}

          {/* Center FAB — Multi-Action Speed Dial Button (+) */}
          <button
            type="button"
            onClick={handleToggleSpeedDial}
            className={cn(
              "relative flex items-center justify-center w-14 h-14 -mt-5 rounded-2xl shrink-0 cursor-pointer",
              "bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25",
              "transition-all duration-200 active:scale-[0.90] hover:brightness-110",
              isSpeedDialOpen ? "ring-4 ring-emerald-500/30 scale-105" : ""
            )}
            aria-label="Menu Aksi Cepat"
            aria-expanded={isSpeedDialOpen}
          >
            <Plus
              className={cn(
                "w-7 h-7 transition-transform duration-300 ease-out",
                isSpeedDialOpen ? "rotate-45" : "rotate-0"
              )}
              strokeWidth={2.5}
            />
          </button>

          {/* Right Menu Items: Tabungan, Dompet */}
          {NAV_ITEMS_RIGHT.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] h-full",
                  "transition-all duration-100 active:scale-[0.90]",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ─── 1. Manual Transaction Modal ─────────────────────────────────── */}
      <TransactionModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={async (data) => {
          if (typeof window !== "undefined" && !navigator.onLine) {
            await addOfflineMutation({
              entity: "transaction",
              action: "create",
              payload: data,
            });
            handleModalSuccess();
            return {
              success: true,
              data: {
                id: `offline_tx_${Date.now()}`,
                user_id: "local_user",
                type: data.type,
                wallet_id: data.wallet_id,
                destination_wallet_id: data.destination_wallet_id ?? null,
                category_id: data.category_id ?? null,
                savings_goal_id: data.savings_goal_id ?? null,
                amount: data.amount,
                admin_fee: data.admin_fee ?? 0,
                transaction_date: data.transaction_date,
                description: data.description ?? null,
                receipt_url: null,
                is_synced: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                deleted_at: null,
              },
            };
          }

          try {
            const res = await createTransaction(data);
            if (res.success) {
              handleModalSuccess();
            }
            return res;
          } catch {
            await addOfflineMutation({
              entity: "transaction",
              action: "create",
              payload: data,
            });
            handleModalSuccess();
            return {
              success: true,
              data: {
                id: `offline_tx_${Date.now()}`,
                user_id: "local_user",
                type: data.type,
                wallet_id: data.wallet_id,
                destination_wallet_id: data.destination_wallet_id ?? null,
                category_id: data.category_id ?? null,
                savings_goal_id: data.savings_goal_id ?? null,
                amount: data.amount,
                admin_fee: data.admin_fee ?? 0,
                transaction_date: data.transaction_date,
                description: data.description ?? null,
                receipt_url: null,
                is_synced: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                deleted_at: null,
              },
            };
          }
        }}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
      />

      {/* ─── 2. AI Quick Entry Modal ─────────────────────────────────────── */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        wallets={wallets}
        categories={categories}
        savingsGoals={savingsGoals}
        onSuccess={handleModalSuccess}
      />

      {/* ─── 3. AI Receipt Vision OCR Scan Modal ─────────────────────────── */}
      <ReceiptScanModal
        isOpen={isReceiptScanOpen}
        onClose={() => setIsReceiptScanOpen(false)}
        wallets={wallets}
        categories={categories}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
