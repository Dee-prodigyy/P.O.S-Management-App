"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Transaction, TransactionType, ChargeMode } from "@/types";

interface TransactionFormProps {
  initialTransaction?: Transaction | null;
  onSave: (transaction: Omit<Transaction, 'timestamp' | 'id'> | Transaction, timeString: string) => Promise<{ success: boolean; message: string }>;
  onCancelEdit?: () => void;
  isSaving: boolean;
}

export function TransactionForm({ initialTransaction, onSave, onCancelEdit, isSaving }: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>(initialTransaction?.type || 'deposit');
  const [amount, setAmount] = useState<string>(initialTransaction?.amount.toString() || '');
  const [charge, setCharge] = useState<string>(initialTransaction?.charge.toString() || '');
  const [chargeMode, setChargeMode] = useState<ChargeMode>(initialTransaction?.chargeMode || 'from_account');
  const [transactionTime, setTransactionTime] = useState<string>(''); // New state for time

  // Helper to set current time
  const setCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setTransactionTime(`${hours}:${minutes}`);
  };

  useEffect(() => {
    if (initialTransaction) {
      setTransactionType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setCharge(initialTransaction.charge.toString());
      setChargeMode(initialTransaction.chargeMode);
      // Format time for input field (HH:MM)
      const hours = initialTransaction.timestamp.getHours().toString().padStart(2, '0');
      const minutes = initialTransaction.timestamp.getMinutes().toString().padStart(2, '0');
      setTransactionTime(`${hours}:${minutes}`);
    } else {
      // Reset form and set current time for new transaction
      setTransactionType('deposit');
      setAmount('');
      setCharge('');
      setChargeMode('from_account');
      setCurrentTime(); // Set current time for new form
    }
  }, [initialTransaction]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission

    const type = transactionType; // Use state directly
    let parsedAmount = parseFloat(amount); // Use state directly
    const parsedCharge = parseFloat(charge); // Use state directly
    const parsedChargeMode = chargeMode; // Use state directly
    const timeString = transactionTime; // Use state directly

    if (isNaN(parsedAmount) || isNaN(parsedCharge) || !type || !parsedChargeMode || !timeString) {
      toast("Error: Please fill in all required fields with valid numbers and time.");
      return;
    }

    // Apply charge deduction for withdrawals from account
    if (type === 'withdrawal' && parsedChargeMode === 'from_account') {
      parsedAmount -= parsedCharge;
    }

    const transactionData: Omit<Transaction, 'timestamp' | 'id'> = { // Exclude timestamp from this object, it will be created in manager
      type,
      amount: parsedAmount,
      charge: parsedCharge,
      chargeMode: parsedChargeMode,
      // id will be added if updating, or generated if new
    };

    try {
      let result;
      if (initialTransaction) {
        // For updating, include the existing ID
        result = await onSave({ ...transactionData, id: initialTransaction.id }, timeString);
      } else {
        result = await onSave(transactionData, timeString);
      }

      if (result.success) {
        toast(`Success! ${result.message}`);
        // Reset form for NEW transactions, or trigger onCancelEdit for EDITING
        if (!initialTransaction) {
          setTransactionType('deposit');
          setAmount('');
          setCharge('');
          setChargeMode('from_account');
          setCurrentTime(); // Reset time to current
        } else if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        toast( "Error: result.message,: destructive",);
      }
    } catch (error: any) {
      console.error("Transaction form submission error:", error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to save transaction",})

    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{initialTransaction ? 'Edit Transaction' : 'Record New Transaction'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              name="type"
              value={transactionType}
              onValueChange={(value: TransactionType) => setTransactionType(value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Transaction Amount (₦)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="e.g. 1050.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="charge">Charge (Fee) (₦)</Label>
            <Input
              id="charge"
              name="charge"
              type="number"
              step="0.01"
              placeholder="e.g. 50.00"
              required
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Charge Mode</Label>
            <RadioGroup
              name="chargeMode"
              value={chargeMode}
              onValueChange={(value: ChargeMode) => setChargeMode(value)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="from_account" id="from_account" />
                <Label htmlFor="from_account">From Account</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              name="time"
              type="time"
              required
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (initialTransaction ? "Saving Changes..." : "Saving...") : (initialTransaction ? "Save Changes" : "Save Transaction")}
          </Button>
          {initialTransaction && (
            <Button type="button" variant="outline" className="w-full" onClick={onCancelEdit} disabled={isSaving}>
              Cancel Edit
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
