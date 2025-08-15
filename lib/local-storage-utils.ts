import { Transaction, TransactionType, DailySummary } from '../types/index';

const LOCAL_STORAGE_KEY = 'pos_transactions';

export function loadTransactions(): Transaction[] {
  if (typeof window === 'undefined') {
    return []; // Return empty array if not in browser environment
  }
  try {
    const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTransactions) {
      // Parse stored JSON and convert timestamp strings back to Date objects
      const parsed = JSON.parse(storedTransactions) as Transaction[];
      return parsed.map(t => ({
        ...t,
        timestamp: new Date(t.timestamp),
      }));
    }
  } catch (error) {
    console.error("Failed to load transactions from local storage:", error);
  }
  return [];
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to save transactions to local storage:", error);
  }
}

// Helper function to combine current date with a time string
export function createTimestamp(timeString: string, date?: Date): Date {
  const targetDate = date || new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  targetDate.setHours(hours, minutes, 0, 0); // Set hours and minutes, clear seconds and milliseconds
  return targetDate;
}

export function getDailySummaryFromLocalStorage(
  allTransactions: Transaction[],
  dateString?: string,
  transactionTypeFilter?: TransactionType | 'all'
): DailySummary {
  const targetDate = dateString ? new Date(dateString) : new Date();
  targetDate.setHours(0, 0, 0, 0); // Start of target day

  const endOfTargetDate = new Date(targetDate);
  endOfTargetDate.setDate(targetDate.getDate() + 1); // Start of next day

  let filteredTransactions = allTransactions.filter(
    (t) => t.timestamp >= targetDate && t.timestamp < endOfTargetDate
  );

  if (transactionTypeFilter && transactionTypeFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.type === transactionTypeFilter
    );
  }

  // Sort filtered transactions by timestamp in descending order for display
  filteredTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const totalDeposits = filteredTransactions.filter((t) => t.type === 'deposit').length;
  const totalWithdrawals = filteredTransactions.filter((t) => t.type === 'withdrawal').length;
  const totalAmountProcessed = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalDepositAmount = filteredTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawalAmount = filteredTransactions
    .filter((t) => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalEarnings = filteredTransactions.reduce((sum, t) => sum + t.charge, 0);
  const earningsFromAccount = filteredTransactions
    .filter((t) => t.chargeMode === 'from_account')
    .reduce((sum, t) => sum + t.charge, 0);
  const earningsCash = filteredTransactions
    .filter((t) => t.chargeMode === 'cash')
    .reduce((sum, t) => sum + t.charge, 0);

  return {
    totalTransactions: filteredTransactions.length,
    totalDeposits,
    totalWithdrawals,
    totalAmountProcessed,
    totalDepositAmount,
    totalWithdrawalAmount,
    totalEarnings,
    earningsFromAccount,
    earningsCash,
    recentTransactions: filteredTransactions.slice(0, 5), // Keep for the summary card
    allFilteredTransactions: filteredTransactions, // New: all transactions for the detailed list
    summaryDate: targetDate, // Return the date for which summary was generated
  };
}
