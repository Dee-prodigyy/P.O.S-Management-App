import { TransactionManager } from "@/components/transaction-manager";

export default async function POSPage() {
  // No need to fetch initial summary on the server anymore,
  // TransactionManager will handle loading from localStorage client-side.

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">POS Transaction Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your daily POS activities.</p>
      </header>

      <TransactionManager />

    </div>
  );
}
