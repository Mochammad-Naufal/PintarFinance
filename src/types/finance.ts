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
  is_synced?: boolean;
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
  is_default?: boolean;
  is_synced?: boolean;
  transaction_count?: number;
  created_at: string;
}

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100, "Maksimal 100 karakter"),
  type: z.enum(["expense", "income"], {
    message: "Pilih tipe kategori yang valid",
  }),
  color: z.string().default("#10b981"),
  icon: z.string().default("tag"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// ─── Savings Goal Types & Schemas ────────────────────────────────────────────

export interface SavingsGoalMember {
  id: string;
  goal_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string | null;
  total_contributed?: number;
}

export interface SavingsGoalInvite {
  id: string;
  goal_id: string;
  inviter_id: string;
  invite_code: string;
  expires_at: string;
  is_used: boolean;
  created_at: string;
  goal_name?: string;
  target_amount?: number;
  current_amount?: number;
  inviter_name?: string;
}

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
  is_synced?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Collaborative properties
  is_shared?: boolean;
  user_role?: "owner" | "member";
  owner_name?: string;
  members?: SavingsGoalMember[];
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
  is_synced?: boolean;
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
  is_synced?: boolean;
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
  is_synced?: boolean;
  created_at: string;
  updated_at: string;
}

export const budgetSchema = z.object({
  category_id: z.string().min(1, "Pilih kategori pengeluaran"),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format periode harus YYYY-MM (e.g. 2026-08)"),
  limit_amount: z.coerce.number().min(10000, "Batas limit anggaran minimal Rp 10.000"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

// ─── Debts & Liabilities Types & Schemas ─────────────────────────────────────

export type DebtType = "debt" | "receivable"; // "debt" = Hutang Saya (Payable), "receivable" = Piutang (Receivable)
export type DebtStatus = "unpaid" | "partial" | "paid";

export interface Debt {
  id: string;
  user_id: string;
  type: DebtType;
  counterparty_name: string;
  title: string;
  total_amount: number;
  remaining_amount: number;
  monthly_installment?: number;
  due_day?: number;
  due_date: string | null;
  target_payoff_date?: string | null;
  status: DebtStatus;
  wallet_id: string | null;
  notes: string | null;
  is_synced?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined fields for rich UI
  wallet_name?: string;
  wallet_icon?: string;
  wallet_color?: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  wallet_id?: string | null;
  wallet_name?: string;
  debt_title: string;
  counterparty_name: string;
  debt_type: DebtType;
  payment_date: string;
  remaining_after: number;
  notes?: string | null;
  created_at: string;
}

export const debtSchema = z.object({
  type: z.enum(["debt", "receivable"], {
    message: "Pilih tipe: Hutang Saya atau Piutang",
  }),
  counterparty_name: z
    .string()
    .min(1, "Nama pihak/orang/lembaga wajib diisi")
    .max(100, "Maksimal 100 karakter"),
  title: z
    .string()
    .min(1, "Judul / keterangan hutang wajib diisi")
    .max(150, "Maksimal 150 karakter"),
  total_amount: z.coerce.number().min(100, "Nominal pokok minimal Rp 100"),
  remaining_amount: z.coerce.number().min(0, "Sisa nominal tidak boleh negatif").optional(),
  monthly_installment: z.coerce.number().min(0, "Cicilan tidak boleh negatif").optional(),
  due_day: z.coerce.number().min(1, "Tanggal minimal 1").max(31, "Tanggal maksimal 31").optional(),
  due_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  target_payoff_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  wallet_id: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
});

export type DebtInput = z.infer<typeof debtSchema>;

export const payDebtSchema = z.object({
  debt_id: z.string().min(1, "ID hutang/piutang wajib diisi"),
  amount: z.coerce.number().min(100, "Nominal pembayaran minimal Rp 100"),
  wallet_id: z.string().min(1, "Pilih dompet untuk transaksi pembayaran"),
  transaction_date: z.string().min(1, "Tanggal pembayaran wajib diisi"),
  notes: z.string().nullable().optional(),
});

export type PayDebtInput = z.infer<typeof payDebtSchema>;

// ─── User Feedback Types & Schemas ───────────────────────────────────────────

export type FeedbackCategory = "bug" | "feature_request" | "question" | "other";

export const feedbackSchema = z.object({
  category: z.enum(["bug", "feature_request", "question", "other"], {
    message: "Pilih kategori masukan yang sesuai",
  }),
  message: z
    .string()
    .min(5, "Pesan masukan minimal 5 karakter")
    .max(2000, "Pesan masukan maksimal 2000 karakter"),
  is_anonymous: z.boolean().default(false),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export interface UserFeedback {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  category: FeedbackCategory;
  message: string;
  is_anonymous: boolean;
  status: "unread" | "read" | "resolved";
  created_at: string;
}

// ─── User Profile Types & Schemas ────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  occupation?: string | null;
  birth_date?: string | null;
  age?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const userProfileSchema = z.object({
  name: z.string().min(1, "Nama lengkap wajib diisi").max(100, "Maksimal 100 karakter"),
  avatar_url: z.string().nullable().optional(),
  occupation: z
    .string()
    .max(100, "Maksimal 100 karakter")
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
  birth_date: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : null)),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

// ─── Analytics Types ─────────────────────────────────────────────────────────

export interface MonthlyCashflowTrend {
  month: string; // 'YYYY-MM'
  label: string; // 'Mar 26'
  income: number;
  expense: number;
  debt: number;
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
  totalDebts: number;
  totalReceivables: number;
  netWorth: number;
  savingsRatio: number;
  debtToIncomeRatio: number;
  debtHealthStatus: "healthy" | "moderate" | "critical" | "debt_free";
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  cashflowTrend: MonthlyCashflowTrend[];
  categoryBreakdown: CategoryExpenseBreakdown[];
  topSavingsGoals: SavingsGoal[];
  topDebts?: Debt[];
  recentTransactions: Transaction[];
  currentPeriod: string;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationType =
  | "budget_warning"
  | "recurring_due"
  | "goal_reached"
  | "system";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Action Result Type ──────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

