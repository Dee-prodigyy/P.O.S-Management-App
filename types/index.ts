export type TransactionType = 'deposit' | 'withdrawal';
export type ChargeMode = 'from_account' | 'cash';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  charge: number;
  chargeMode: ChargeMode;
  timestamp: Date;
}

export interface DailySummary {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalAmountProcessed: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalEarnings: number;
  earningsFromAccount: number;
  earningsCash: number;
  recentTransactions: Transaction[]; // Still for the summary card (latest 5)
  allFilteredTransactions: Transaction[]; // New: for the full list
  summaryDate: Date;
}
