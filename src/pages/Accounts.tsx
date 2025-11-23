import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDB, Account, Transaction } from '@/lib/db';
import { Plus, Wallet } from 'lucide-react';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDB();
    const allAccounts = await db.getAll('accounts');
    const allTransactions = await db.getAll('transactions');

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
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">{account.name}</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
                <p className="text-3xl font-bold text-primary">
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
