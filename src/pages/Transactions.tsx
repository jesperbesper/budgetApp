import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDB, Transaction, Account, Category } from '@/lib/db';
import { Plus } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDB();
    const allTransactions = await db.getAll('transactions');
    const allAccounts = await db.getAll('accounts');
    const allCategories = await db.getAll('categories');

    setTransactions(allTransactions.reverse());
    setAccounts(allAccounts);
    setCategories(allCategories);
  }

  const getAccountName = (id: number | null) => {
    if (!id) return '-';
    return accounts.find((a) => a.id === id)?.name || 'Unknown';
  };

  const getCategoryName = (id: number | null) => {
    if (!id) return '-';
    return categories.find((c) => c.id === id)?.name || 'Unknown';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-success';
      case 'expense':
        return 'text-destructive';
      case 'transfer':
        return 'text-primary';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet. Add your first transaction to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Account</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{transaction.date}</td>
                      <td className="py-3 px-4">
                        <span className={`capitalize ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {transaction.type === 'transfer'
                          ? `${getAccountName(transaction.from_account_id)} → ${getAccountName(transaction.to_account_id)}`
                          : getAccountName(transaction.account_id)}
                      </td>
                      <td className="py-3 px-4">{getCategoryName(transaction.category_id)}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${getTypeColor(transaction.type)}`}>
                        {transaction.amount.toFixed(2)} kr
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{transaction.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
