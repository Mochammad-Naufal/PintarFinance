import { z } from "zod";

// ─── Wallet Types & Schemas ──────────────────────────────────────────────────

export type WalletType = "bank" | "ewallet" | "cash";

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi").max(100, "Maksimal 100 karakter"),
  type: z.enum(["bank", "ewallet", "cash"], {
    message: "Pilih tipe dompet yang valid",
  }),
  balance: z.coerce.number().min(0, "Saldo tidak boleh negatif"),
  color: z.string().default("#10b981"),
  icon: z.string().default("wallet"),
});

export type WalletInput = z.infer<typeof walletSchema>;

// ─── Category Types ──────────────────────────────────────────────────────────

export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  created_at: string;
}

// ─── Savings Goal Types & Schemas ────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const savingsGoalSchema = z.object({
  name: z.string().min(1, "Nama target impian wajib diisi").max(150, "Maksimal 150 karakter"),
  target_amount: z.coerce.number().min(1000, "Target minimal Rp 1.000"),
  current_amount: z.coerce.number().min(0, "Nominal terkumpul tidak boleh negatif").default(0),
  target_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  color: z.string().default("#3b82f6"),
  icon: z.string().default("target"),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;

// ─── Transaction Types & Schemas ─────────────────────────────────────────────

export type TransactionType = "expense" | "income" | "transfer" | "saving";

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  destination_wallet_id: string | null;
  category_id: string | null;
  savings_goal_id: string | null;
  type: TransactionType;
  amount: number;
  admin_fee: number;
  transaction_date: string;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined fields for rich UI
  wallet_name?: string;
  wallet_color?: string;
  wallet_icon?: string;
  destination_wallet_name?: string;
  destination_wallet_color?: string;
  destination_wallet_icon?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  savings_goal_name?: string;
  savings_goal_icon?: string;
  savings_goal_color?: string;
}

export const transactionSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer", "saving"], {
      message: "Pilih tipe transaksi yang valid",
    }),
    wallet_id: z.string().min(1, "Pilih dompet"),
    destination_wallet_id: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : null)),
    category_id: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : null)),
    savings_goal_id: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : null)),
    amount: z.coerce.number().min(100, "Nominal minimal Rp 100"),
    admin_fee: z.coerce.number().min(0, "Biaya admin tidak boleh negatif").default(0),
    transaction_date: z.string().min(1, "Tanggal transaksi wajib diisi"),
    description: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : null)),
    receipt_url: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : null)),
  })
  .refine(
    (data) => {
      if (data.type === "transfer") {
        return (
          !!data.destination_wallet_id &&
          data.destination_wallet_id !== data.wallet_id
        );
      }
      return true;
    },
    {
      message: "Pilih dompet tujuan yang berbeda untuk transfer",
      path: ["destination_wallet_id"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "saving") {
        return !!data.savings_goal_id;
      }
      return true;
    },
    {
      message: "Pilih target pos tabungan tujuan",
      path: ["savings_goal_id"],
    }
  );

export type TransactionInput = z.infer<typeof transactionSchema>;

export interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType | "all";
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ─── Recurring Transactions / Subscriptions Types & Schemas ─────────────────

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: "expense" | "income";
  amount: number;
  frequency: RecurringFrequency;
  start_date: string;
  next_run_date: string;
  last_run_date: string | null;
  description: string;
  is_active: boolean;
  auto_create: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined fields for UI
  wallet_name?: string;
  wallet_color?: string;
  wallet_icon?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export const recurringSchema = z.object({
  type: z.enum(["expense", "income"], {
    message: "Pilih tipe transaksi berulang",
  }),
  wallet_id: z.string().min(1, "Pilih dompet pembayaran"),
  category_id: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  amount: z.coerce.number().min(100, "Nominal minimal Rp 100"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"], {
    message: "Pilih frekuensi berulang",
  }),
  start_date: z.string().min(1, "Tanggal mulai/tagihan wajib diisi"),
  description: z.string().min(1, "Nama langganan / tagihan wajib diisi"),
  is_active: z.boolean().default(true),
  auto_create: z.boolean().default(false),
});

export type RecurringInput = z.infer<typeof recurringSchema>;

// ─── Budget Types & Schemas ──────────────────────────────────────────────────

export type BudgetStatus = "safe" | "warning" | "danger";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  period: string; // 'YYYY-MM'
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage: number;
  status: BudgetStatus;
  category_name: string;
  category_icon: string;
  category_color: string;
  created_at: string;
  updated_at: string;
}

export const budgetSchema = z.object({
  category_id: z.string().min(1, "Pilih kategori pengeluaran"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM (e.g. 2026-08)"),
  limit_amount: z.coerce.number().min(10000, "Batas limit anggaran minimal Rp 10.000"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface MonthlyCashflowTrend {
  month: string; // 'YYYY-MM'
  label: string; // 'Mar 26'
  income: number;
  expense: number;
  net: number;
}

export interface CategoryExpenseBreakdown {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  amount: number;
  percentage: number;
}

export interface DashboardAnalytics {
  totalBalance: number;
  totalSavings: number;
  netWorth: number;
  savingsRatio: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  cashflowTrend: MonthlyCashflowTrend[];
  categoryBreakdown: CategoryExpenseBreakdown[];
  topSavingsGoals: SavingsGoal[];
  recentTransactions: Transaction[];
  currentPeriod: string;
}

// ─── Action Result Type ──────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
