import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDB, Transaction, Account, Category } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remaining: 0,
    totalSaved: 0,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [currentMonth]);

  async function loadDashboardData() {
    const db = await getDB();
    const allTransactions = await db.getAll('transactions');
    const allAccounts = await db.getAll('accounts');

    // Filter transactions for current month
    const monthTransactions = allTransactions.filter(
      (t) => t.date.startsWith(currentMonth)
    );

    // Calculate stats
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const transfersToSavings = monthTransactions
      .filter((t) => t.type === 'transfer' && t.to_account_id === 2) // Assuming Savings is ID 2
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpenses: expenses,
      remaining: income - expenses,
      totalSaved: transfersToSavings,
    });

    setAccounts(allAccounts);
    setTransactions(monthTransactions);
  }

  const chartData = [
    { name: 'Income', value: stats.totalIncome, fill: 'hsl(var(--success))' },
    { name: 'Expenses', value: stats.totalExpenses, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-4 py-2 border border-border rounded-md bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.totalIncome.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.totalExpenses.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.remaining.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved This Month</CardTitle>
            <PiggyBank className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.totalSaved.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="fill" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
