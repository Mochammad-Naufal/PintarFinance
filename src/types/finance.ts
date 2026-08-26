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

// ─── Action Result Type ──────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
