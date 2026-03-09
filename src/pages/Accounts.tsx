import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account, Transaction, getAccounts, getTransactions } from '@/lib/db';
import { Plus, Wallet, Pencil } from 'lucide-react';
import AddAccountDialog from '@/components/AddAccountDialog';
import { CardGridSkeleton } from '@/components/PageSkeletons';

export default function Accounts() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const allAccounts = (await getAccounts()).filter(a => a.active);
      const allTransactions = await getTransactions();

      setAccounts(allAccounts);

      // Calculate balances
      const calculatedBalances: Record<number, number> = {};
      
      for (const account of allAccounts) {
        let balance = account.initial_balance;

        // Add income
        balance += allTransactions
          .filter((t) => t.type === 'income' && t.account_id === account.id)
          .reduce((sum, t) => sum + t.amount, 0);

        // Subtract expenses
        balance -= allTransactions
          .filter((t) => t.type === 'expense' && t.account_id === account.id)
          .reduce((sum, t) => sum + t.amount, 0);

        // Handle transfers
        balance -= allTransactions
          .filter((t) => t.type === 'transfer' && t.from_account_id === account.id)
          .reduce((sum, t) => sum + t.amount, 0);

        balance += allTransactions
          .filter((t) => t.type === 'transfer' && t.to_account_id === account.id)
          .reduce((sum, t) => sum + t.amount, 0);

        calculatedBalances[account.id!] = balance;
      }

      setBalances(calculatedBalances);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setDialogOpen(true);
  };

  const getCurrentBalance = (accountId: number) => {
    return balances[accountId] || 0;
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditAccount(undefined);
    }
  };

  if (loading) return <CardGridSkeleton title="Accounts" />;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Accounts</h1>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <AddAccountDialog 
        open={dialogOpen} 
        onOpenChange={handleDialogClose} 
        onSuccess={loadData}
        editAccount={editAccount}
        currentBalance={editAccount ? getCurrentBalance(editAccount.id!) : undefined}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base md:text-lg font-semibold">{account.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(account)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {balances[account.id!]?.toFixed(2) || '0.00'} kr
                </p>
                <p className="text-xs text-muted-foreground">
                  Initial: {account.initial_balance.toFixed(2)} kr
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
