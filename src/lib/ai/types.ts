export interface AIContext {
  wallets: Array<{ id: string; name: string; type: string }>;
  categories: Array<{ id: string; name: string; type: string }>;
  savingsGoals: Array<{ id: string; name: string; target_amount: number }>;
}

export interface ParsedTransactionResult {
  type: "expense" | "income" | "transfer" | "saving";
  amount: number;
  description: string;
  category_id: string | null;
  category_name_guess: string | null;
  wallet_id: string | null;
  wallet_name_guess: string | null;
  destination_wallet_id: string | null;
  destination_wallet_name_guess: string | null;
  savings_goal_id: string | null;
  savings_goal_name_guess: string | null;
  transaction_date: string;
  confidence: number;
  raw_text: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ParsedReceiptResult {
  merchant_name: string;
  total_amount: number;
  transaction_date: string;
  category_name_guess: string | null;
  suggested_category_id: string | null;
  suggested_wallet_id: string | null;
  items: ReceiptItem[];
  confidence: number;
}
