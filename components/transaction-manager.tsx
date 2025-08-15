"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, DailySummary, TransactionType } from "@/types";
import { TransactionForm } from "./transaction-form";
import { DashboardSummary } from "./dashboard-summary";
import { loadTransactions, saveTransactions, getDailySummaryFromLocalStorage, createTimestamp } from "@/lib/local-storage-utils";
import { toast } from "sonner";

export function TransactionManager() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load transactions from localStorage on initial mount
  useEffect(() => {
    const loaded = loadTransactions();
    setAllTransactions(loaded);
    setIsLoadingSummary(false); // Set loading to false after initial load
  }, []);

  // Effect to re-calculate and set summary when allTransactions, selectedDate, or selectedType changes
  useEffect(() => {
    if (!isLoadingSummary) { // Only re-calculate if initial load is done
      const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      const newSummary = getDailySummaryFromLocalStorage(allTransactions, dateString, selectedType);
      setSummary(newSummary);
    }
  }, [allTransactions, selectedDate, selectedType, isLoadingSummary]);

  // Function to add/update a transaction
  const handleSaveTransaction = useCallback(async (
    transactionData: Omit<Transaction, 'timestamp' | 'id'> | Transaction, // Now Omit<..., 'timestamp'>
    timeString: string // timeString is passed separately
  ) => {
    setIsSaving(true);
    try {
      let updatedTransactions: Transaction[];
      let message: string;

      if ('id' in transactionData && transactionData.id) {
        // Update existing transaction
        updatedTransactions = allTransactions.map(t =>
          t.id === transactionData.id
            ? { ...transactionData, timestamp: createTimestamp(timeString, t.timestamp) } // Preserve original date, update time
            : t
        );
        message = 'Transaction updated successfully!';
      } else {
        // Add new transaction
        const newTransaction: Transaction = {
          ...transactionData,
          id: crypto.randomUUID(),
          timestamp: createTimestamp(timeString, new Date()), // Set current date with provided time
        };
        updatedTransactions = [...allTransactions, newTransaction];
        message = 'Transaction recorded successfully!';
      }

      // Sort transactions by timestamp in descending order
      updatedTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setAllTransactions(updatedTransactions);
      saveTransactions(updatedTransactions); // Save to localStorage
        toast.success(message)

      return { success: true, message };
    } catch (error) {
      console.error("Error saving transaction:", error);
        toast.error(
        "Error saving transaction",
        {
            description: error instanceof Error ? error.message : "Failed to save transaction."
        }
        )

      return { success: false, message: error instanceof Error ? error.message : "Failed to save transaction." };
    } finally {
      setIsSaving(false);
    }
  }, [allTransactions]);

  // Function to delete a transaction
  const handleDeleteTransaction = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      const initialLength = allTransactions.length;
      const updatedTransactions = allTransactions.filter(t => t.id !== id);

      if (updatedTransactions.length < initialLength) {
        setAllTransactions(updatedTransactions);
        saveTransactions(updatedTransactions); // Save to localStorage
        toast.success('Transaction deleted successfully!', {
        description: 'The record has been permanently removed.'
        })

        return { success: true, message: 'Transaction deleted successfully!' };
      } else {
        toast.error('Transaction not found for deletion.', {
        description: 'The transaction may have already been removed or never existed.'
        })

        return { success: false, message: 'Transaction not found for deletion.' };
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    toast.error(
    "Error deleting transaction",
    {
        description: error instanceof Error 
        ? error.message 
        : "Failed to delete transaction."
    }
    )

      return { success: false, message: error instanceof Error ? error.message : "Failed to delete transaction." };
    } finally {
      setIsDeleting(false);
    }
  }, [allTransactions]);

  const handleCancelEdit = useCallback(() => {
    setEditingTransaction(null);
  }, []);

  return (
    <main className="flex-1 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <div className="lg:col-span-1 xl:col-span-1">
        <TransactionForm
          initialTransaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancelEdit={handleCancelEdit}
          isSaving={isSaving}
        />
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        {isLoadingSummary || !summary ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading summary...
          </div>
        ) : (
          <DashboardSummary
            summary={summary}
            onEditTransaction={setEditingTransaction}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onDeleteTransaction={handleDeleteTransaction}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </main>
  );
}
