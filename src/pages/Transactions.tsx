import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Transaction, Account, Category, getTransactions, getAccounts, getCategories, deleteTransaction } from '@/lib/db';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AddTransactionDialog from '@/components/AddTransactionDialog';
import EditTransactionDialog from '@/components/EditTransactionDialog';
import { DataTableSkeleton } from '@/components/PageSkeletons';

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const allTransactions = await getTransactions();
      const allAccounts = await getAccounts();
      const allCategories = await getCategories();

      setTransactions(allTransactions);
      setAccounts(allAccounts);
      setCategories(allCategories);
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async () => {
    if (!deletingTransaction?.id) return;
    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
      loadData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  if (loading) return <DataTableSkeleton title="Transactions" />;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadData}
      />

      {editingTransaction && (
        <EditTransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => { if (!open) setEditingTransaction(null); }}
          onSuccess={loadData}
          transaction={editingTransaction}
        />
      )}

      <AlertDialog open={!!deletingTransaction} onOpenChange={(open) => { if (!open) setDeletingTransaction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transactions yet. Add your first transaction to get started.
            </p>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-2">
                {transactions.map((transaction) => {
                  const category = getCategoryName(transaction.category_id);
                  return (
                    <div key={transaction.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm capitalize ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{category}</p>
                        </div>
                        <p className={`font-bold text-base ${getTypeColor(transaction.type)} shrink-0`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '→'} {transaction.amount.toFixed(2)} kr
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{transaction.date}</span>
                        <span className="truncate ml-2">
                          {transaction.type === 'transfer'
                            ? `${getAccountName(transaction.from_account_id)} → ${getAccountName(transaction.to_account_id)}`
                            : getAccountName(transaction.account_id)}
                        </span>
                      </div>
                      {transaction.note && (
                        <p className="text-xs text-muted-foreground italic truncate">{transaction.note}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => setEditingTransaction(transaction)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeletingTransaction(transaction)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Account</th>
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Note</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditingTransaction(transaction)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingTransaction(transaction)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
