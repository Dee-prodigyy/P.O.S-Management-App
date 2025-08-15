"use client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { DailySummary, Transaction, TransactionType } from "@/types"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon, FileTextIcon, CalendarIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DashboardSummaryProps {
  summary: DailySummary
  onEditTransaction: (transaction: Transaction) => void
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  selectedType: TransactionType | "all"
  onTypeChange: (type: TransactionType | "all") => void
  onDeleteTransaction: (id: string) => Promise<{ success: boolean; message: string }>
  isDeleting: boolean
}

export function DashboardSummary({
  summary,
  onEditTransaction,
  selectedDate,
  onDateChange,
  selectedType,
  onTypeChange,
  onDeleteTransaction,
  isDeleting,
}: DashboardSummaryProps) {
  const formatCurrency = (amount: number) => `₦${amount.toFixed(2)}`
  const formatDate = (date: Date) => date.toLocaleString()

  const handleDelete = async (id: string) => {
    try {
      const result = await onDeleteTransaction(id)
      if (result.success) {
        toast( "Success! : result.message,")
      } else {
        toast( "Error : result.message:destructive",)
      }
    } catch (error: unknown) {
      console.error("Delete transaction error:", error)
      toast(
        `Error: ${error instanceof Error ? error.message : `Failed to delete transaction: ${JSON.stringify(error)}`}`
      )
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    let y = 15 // Y-coordinate for content
    const pageHeight = doc.internal.pageSize.height
    const margin = 10 // 10mm margin from top/bottom
    let currentPage = 1

    const addPageNumber = () => {
      doc.setFontSize(10)
      doc.text(`Page ${currentPage}`, doc.internal.pageSize.width - margin, pageHeight - margin, { align: "right" })
    }

    const checkPageBreak = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        addPageNumber() // Add page number to current page before breaking
        doc.addPage()
        y = margin // Reset Y for new page
        currentPage++
        return true // Indicate that a page break occurred
      }
      return false
    }

    // --- Document Header ---
    doc.setFontSize(24)
    checkPageBreak(15)
    doc.text("POS Daily Summary", margin, y)
    y += 15

    doc.setFontSize(12)
    checkPageBreak(7)
    doc.text(`Date: ${summary.summaryDate.toLocaleDateString()}`, margin, y)
    y += 7
    checkPageBreak(7)
    doc.text(
      `Filter Type: ${selectedType === "all" ? "All Transactions" : selectedType === "deposit" ? "Deposits" : "Withdrawals"}`,
      margin,
      y,
    )
    y += 15 // Extra space after header

    // --- Summary Metrics Section ---
    doc.setFontSize(18)
    checkPageBreak(10)
    doc.text("Summary Metrics", margin, y)
    y += 10

    doc.setFontSize(12)
    checkPageBreak(7)
    doc.text(`Total Transactions: ${summary.totalTransactions}`, margin + 5, y)
    y += 7
    checkPageBreak(7)
    doc.text(`  Deposits: ${summary.totalDeposits}`, margin + 10, y)
    y += 7
    checkPageBreak(10)
    doc.text(`  Withdrawals: ${summary.totalWithdrawals}`, margin + 10, y)
    y += 10

    checkPageBreak(7)
    doc.text(`Total Amount Processed: ${formatCurrency(summary.totalAmountProcessed)}`, margin + 5, y)
    y += 7
    checkPageBreak(7)
    doc.text(`  Total Deposit Amount: ${formatCurrency(summary.totalDepositAmount)}`, margin + 10, y)
    y += 7
    checkPageBreak(10)
    doc.text(`  Total Withdrawal Amount: ${formatCurrency(summary.totalWithdrawalAmount)}`, margin + 10, y)
    y += 10

    checkPageBreak(7)
    doc.text(`Total Earnings: ${formatCurrency(summary.totalEarnings)}`, margin + 5, y)
    y += 7
    checkPageBreak(7)
    doc.text(`  Earnings From Account: ${formatCurrency(summary.earningsFromAccount)}`, margin + 10, y)
    y += 7
    checkPageBreak(15)
    doc.text(`  Earnings Cash: ${formatCurrency(summary.earningsCash)}`, margin + 10, y)
    y += 15 // Extra space after section

    // --- All Filtered Transactions Section ---
    doc.setFontSize(18)
    checkPageBreak(10)
    doc.text("All Filtered Transactions", margin, y)
    y += 10

    if (summary.allFilteredTransactions.length === 0) {
      doc.setFontSize(12)
      checkPageBreak(7)
      doc.text("No transactions recorded for this filter yet.", margin + 5, y)
    } else {
      // Table Headers
      const colX = {
        type: margin + 5,
        amount: margin + 40,
        charge: margin + 75,
        mode: margin + 110,
        time: margin + 150,
      }
      const rowHeight = 7

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      checkPageBreak(rowHeight * 2) // Space for header and line
      doc.text("Type", colX.type, y)
      doc.text("Amount", colX.amount, y)
      doc.text("Charge", colX.charge, y)
      doc.text("Mode", colX.mode, y)
      doc.text("Time", colX.time, y)
      y += rowHeight - 2 // Adjust for line
      doc.line(margin, y, doc.internal.pageSize.width - margin, y) // Horizontal line
      y += rowHeight
      doc.setFont("helvetica", "normal")

      // Transaction Rows
      summary.allFilteredTransactions.forEach((t) => {
        checkPageBreak(rowHeight) // Check before adding each transaction item
        doc.text(t.type === "deposit" ? "Deposit" : "Withdrawal", colX.type, y)
        doc.text(formatCurrency(t.amount), colX.amount, y)
        doc.text(formatCurrency(t.charge), colX.charge, y)
        doc.text(t.chargeMode === "from_account" ? "From Account" : "Cash", colX.mode, y)
        doc.text(formatDate(t.timestamp), colX.time, y)
        y += rowHeight
      })
    }

    // --- Finalize PDF ---
    addPageNumber() // Add page number to the last page
    doc.save(`pos_summary_${summary.summaryDate.toLocaleDateString("en-CA")}_${selectedType}.pdf`)
    toast( "Download Started : Your daily summary PDF is downloading.",)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Daily Summary Overview for {selectedDate ? format(selectedDate, "PPP") : "Today"}
          </CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={onDateChange} initialFocus />
              </PopoverContent>
            </Popover>

            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleDownloadPDF} aria-label="Download Daily Summary PDF">
              <FileTextIcon className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <span className="text-muted-foreground text-xs">Daily</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalDeposits} Deposits, {summary.totalWithdrawals} Withdrawals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposit Amount</CardTitle>
              <span className="text-muted-foreground text-xs">Daily</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalDepositAmount)}</div>
              <p className="text-xs text-muted-foreground">Total amount processed from deposits.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawal Amount</CardTitle>
              <span className="text-muted-foreground text-xs">Daily</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalWithdrawalAmount)}</div>
              <p className="text-xs text-muted-foreground">Total amount processed from withdrawals.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <span className="text-muted-foreground text-xs">Daily</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.earningsFromAccount)} From Account, {formatCurrency(summary.earningsCash)} Cash
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* All Transactions Card */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {summary.allFilteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions found for the current filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.allFilteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant={transaction.type === "deposit" ? "default" : "outline"}>
                        {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatCurrency(transaction.charge)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {transaction.chargeMode === "from_account" ? "From Account" : "Cash"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(transaction.timestamp)}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTransaction(transaction)}
                        aria-label={`Edit transaction ${transaction.id}`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            aria-label={`Delete transaction ${transaction.id}`}
                            disabled={isDeleting}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the transaction.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
