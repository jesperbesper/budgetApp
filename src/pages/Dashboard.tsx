import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Transaction, Account, Category, CategoryBudget, RecurringItem, getTransactions, getAccounts, getCategories, getCategoryBudgets, getRecurringItems, getReceiptAnalysis, ReceiptAnalysisRow } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, Calendar, ArrowUpDown, ShoppingCart, Store, Package } from 'lucide-react';

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [dashboardView, setDashboardView] = useState<'transactions' | 'items'>('transactions');
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remaining: 0,
    totalSaved: 0,
    savingsRate: 0,
    avgDailySpending: 0,
    projectedBalance: 0,
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryData, setCategoryData] = useState<Array<{name: string; Income: number; Expenses: number}>>([]);
  const [accountBalances, setAccountBalances] = useState<Array<{name: string; balance: number; type: string}>>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [topCategories, setTopCategories] = useState<Array<{name: string; amount: number; percentage: number}>>([]);
  const [largestTransactions, setLargestTransactions] = useState<{income: Transaction[], expenses: Transaction[]}>({income: [], expenses: []});
  const [dailySpendingData, setDailySpendingData] = useState<Array<{day: number; amount: number}>>([]);
  const [budgetProgress, setBudgetProgress] = useState<Array<{category: string; spent: number; budget: number; percentage: number}>>([]);

  // ── Item analysis state ────────────────────────────────────────────────────
  const [receiptRows, setReceiptRows] = useState<ReceiptAnalysisRow[]>([]);
  const [storeStats, setStoreStats] = useState<Array<{store: string; total: number; visits: number; avgBasket: number}>>([]);
  const [productCategoryStats, setProductCategoryStats] = useState<Array<{name: string; amount: number; percentage: number}>>([]);
  const [topProducts, setTopProducts] = useState<Array<{name: string; category: string; amount: number; count: number}>>([]);
  const [uncategorizedAmount, setUncategorizedAmount] = useState(0);
  const [weeklyGroceries, setWeeklyGroceries] = useState<Array<{week: string; amount: number}>>([]);
  const [groceriesCategoryName, setGroceriesCategoryName] = useState<string>('Groceries');

  const loadDashboardData = useCallback(async () => {
    const allTransactions = await getTransactions();
    const allAccounts = (await getAccounts()).filter(a => a.active);
    const allCategories = (await getCategories()).filter(c => c.active);
    const allBudgets = await getCategoryBudgets(currentMonth);
    const recurringItems = (await getRecurringItems()).filter(r => r.active);

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

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    // Average daily spending
    const today = new Date();
    const currentDayOfMonth = today.toISOString().slice(0, 7) === currentMonth ? today.getDate() : new Date(currentMonth + '-01').getDate();
    const avgDaily = currentDayOfMonth > 0 ? expenses / currentDayOfMonth : 0;

    // Projected balance (remaining recurring expenses)
    const daysInMonth = new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDayOfMonth;
    const projectedRemainingExpenses = avgDaily * daysRemaining;
    const projectedRecurringIncome = recurringItems
      .filter(r => r.type === 'income' && r.day_of_month > currentDayOfMonth)
      .reduce((sum, r) => sum + r.amount, 0);
    const projectedRecurringExpenses = recurringItems
      .filter(r => r.type === 'expense' && r.day_of_month > currentDayOfMonth)
      .reduce((sum, r) => sum + r.amount, 0);
    const projected = (income - expenses) + projectedRecurringIncome - projectedRecurringExpenses - projectedRemainingExpenses;

    setStats({
      totalIncome: income,
      totalExpenses: expenses,
      remaining: income - expenses,
      totalSaved: transfersToSavings,
      savingsRate,
      avgDailySpending: avgDaily,
      projectedBalance: projected,
    });

    // Calculate account balances
    const balances = allAccounts.map(account => {
      let balance = account.initial_balance;
      
      balance += allTransactions
        .filter((t) => t.type === 'income' && t.account_id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);

      balance -= allTransactions
        .filter((t) => t.type === 'expense' && t.account_id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);

      balance -= allTransactions
        .filter((t) => t.type === 'transfer' && t.from_account_id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);

      balance += allTransactions
        .filter((t) => t.type === 'transfer' && t.to_account_id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);

      return { name: account.name, balance, type: account.type };
    });
    setAccountBalances(balances);

    // Recent transactions (last 10)
    const recent = [...monthTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    setRecentTransactions(recent);

    // Top spending categories
    const categorySpending = new Map<number, {name: string; amount: number}>();
    allCategories.forEach(cat => {
      const spent = monthTransactions
        .filter(t => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > 0) {
        categorySpending.set(cat.id!, { name: cat.name, amount: spent });
      }
    });
    const topCats = Array.from(categorySpending.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(cat => ({
        ...cat,
        percentage: expenses > 0 ? (cat.amount / expenses) * 100 : 0
      }));
    setTopCategories(topCats);

    // Largest transactions
    const incomeTransactions = monthTransactions
      .filter(t => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    const expenseTransactions = monthTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    setLargestTransactions({ income: incomeTransactions, expenses: expenseTransactions });

    // Daily spending trend
    const dailyData = new Map<number, number>();
    for (let i = 1; i <= currentDayOfMonth; i++) {
      dailyData.set(i, 0);
    }
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const day = parseInt(t.date.split('-')[2]);
        dailyData.set(day, (dailyData.get(day) || 0) + t.amount);
      });
    
    let cumulative = 0;
    const trendData = Array.from(dailyData.entries())
      .map(([day, amount]) => {
        cumulative += amount;
        return { day, amount: cumulative };
      });
    setDailySpendingData(trendData);

    // Budget progress
    const budgetData = allBudgets.map(budget => {
      const category = allCategories.find(c => c.id === budget.category_id);
      const spent = monthTransactions
        .filter(t => t.type === 'expense' && t.category_id === budget.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        category: category?.name || 'Unknown',
        spent,
        budget: budget.amount,
        percentage: (spent / budget.amount) * 100
      };
    });
    setBudgetProgress(budgetData);

    // Calculate income and expenses per category
    const categoryMap = new Map<number, { name: string; income: number; expenses: number }>();
    
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id!, { name: cat.name, income: 0, expenses: 0 });
    });

    monthTransactions.forEach((t) => {
      if (t.category_id && categoryMap.has(t.category_id)) {
        const catData = categoryMap.get(t.category_id)!;
        if (t.type === 'income') {
          catData.income += t.amount;
        } else if (t.type === 'expense') {
          catData.expenses += t.amount;
        }
      }
    });

    const categoryChartData = Array.from(categoryMap.values())
      .filter((cat) => cat.income > 0 || cat.expenses > 0)
      .map((cat) => ({
        name: cat.name,
        Income: cat.income,
        Expenses: cat.expenses,
      }));

    setCategoryData(categoryChartData);
    setAccounts(allAccounts);
    setTransactions(monthTransactions);
    setCategories(allCategories);

    // ── Item analysis ─────────────────────────────────────────────────────────
    const receipts = await getReceiptAnalysis(currentMonth);
    setReceiptRows(receipts);

    // Spending by store
    const storeMap = new Map<string, { total: number; visits: number }>();
    receipts.forEach((r) => {
      const key = r.store_name?.trim() || 'Unknown store';
      const prev = storeMap.get(key) ?? { total: 0, visits: 0 };
      storeMap.set(key, { total: prev.total + (r.total ?? 0), visits: prev.visits + 1 });
    });
    setStoreStats(
      Array.from(storeMap.entries())
        .map(([store, s]) => ({ store, total: s.total, visits: s.visits, avgBasket: s.total / s.visits }))
        .sort((a, b) => b.total - a.total)
    );

    // Spending by product category + top products
    const catAmountMap = new Map<string, number>();
    const productMap = new Map<string, { name: string; category: string; amount: number; count: number }>();
    let uncategorized = 0;

    receipts.forEach((r) => {
      (r.receipt_items ?? []).forEach((item) => {
        const price = item.price ?? 0;
        const catName = item.products?.product_categories?.name ?? null;
        const productName = item.products?.canonical_name ?? null;

        if (catName) {
          catAmountMap.set(catName, (catAmountMap.get(catName) ?? 0) + price);
        } else {
          uncategorized += price;
        }

        if (productName) {
          const prev = productMap.get(productName) ?? { name: productName, category: catName ?? 'Uncategorized', amount: 0, count: 0 };
          productMap.set(productName, { ...prev, amount: prev.amount + price, count: prev.count + 1 });
        }
      });
    });

    const totalItemSpend = Array.from(catAmountMap.values()).reduce((s, v) => s + v, 0) + uncategorized;
    setProductCategoryStats(
      Array.from(catAmountMap.entries())
        .map(([name, amount]) => ({ name, amount, percentage: totalItemSpend > 0 ? (amount / totalItemSpend) * 100 : 0 }))
        .sort((a, b) => b.amount - a.amount)
    );
    setTopProducts(
      Array.from(productMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
    );
    setUncategorizedAmount(uncategorized);

    // ── Weekly groceries spending ─────────────────────────────────────────────
    const groceriesCat = allCategories.find(
      (c) => c.name.toLowerCase().includes('groceries') || c.name.toLowerCase().includes('grocery')
    );
    setGroceriesCategoryName(groceriesCat?.name ?? 'Groceries');

    const allWeeks = [
      { week: 'Week 1\n(1–7)',   start: 1,  end: 7  },
      { week: 'Week 2\n(8–14)',  start: 8,  end: 14 },
      { week: 'Week 3\n(15–21)', start: 15, end: 21 },
      { week: 'Week 4\n(22–28)', start: 22, end: 28 },
      { week: 'Week 5\n(29+)',   start: 29, end: 31 },
    ];

    const weeklyData = allWeeks.map(({ week, start, end }) => {
      const amount = groceriesCat
        ? monthTransactions
            .filter((t) => {
              if (t.type !== 'expense' || t.category_id !== groceriesCat.id) return false;
              const day = parseInt(t.date.split('-')[2]);
              return day >= start && day <= end;
            })
            .reduce((sum, t) => sum + t.amount, 0)
        : 0;
      return { week, amount };
    });

    // Only keep weeks that have started (up to currentDayOfMonth)
    const relevantWeeks = weeklyData.filter((_, i) => allWeeks[i].start <= currentDayOfMonth);
    setWeeklyGroceries(relevantWeeks);
  }, [currentMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const chartData = [
    { name: 'Income', value: stats.totalIncome, fill: 'hsl(var(--success))' },
    { name: 'Expenses', value: stats.totalExpenses, fill: 'hsl(var(--destructive))' },
  ];

  const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 20) return 'text-success';
    if (rate >= 10) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="px-3 py-2 text-sm md:text-base border border-border rounded-md bg-background w-full sm:w-auto"
        />
      </div>

      {/* View toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-full sm:w-72">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            dashboardView === 'transactions'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setDashboardView('transactions')}
        >
          Transaction Analysis
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            dashboardView === 'items'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setDashboardView('items')}
        >
          Item Analysis
        </button>
      </div>

      {/* ── TRANSACTION ANALYSIS ────────────────────────────────────────────── */}
      {dashboardView === 'transactions' && (<>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-success">
              {stats.totalIncome.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-destructive">
              {stats.totalExpenses.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {stats.remaining.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Saved This Month</CardTitle>
            <PiggyBank className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-accent">
              {stats.totalSaved.toFixed(2)} kr
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Savings Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${getSavingsRateColor(stats.savingsRate)}`}>
              {stats.savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.savingsRate >= 20 ? 'Excellent!' : stats.savingsRate >= 10 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Avg Daily Spending</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {stats.avgDailySpending.toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Projected End Balance</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold ${stats.projectedBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.projectedBalance.toFixed(2)} kr
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected month-end
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {accountBalances.map((account, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold text-sm md:text-base">{account.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground capitalize">{account.type}</p>
                </div>
                <p className="text-lg md:text-xl font-bold text-primary">
                  {account.balance.toFixed(2)} kr
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between p-2 md:p-3 bg-primary/10 rounded-lg border-2 border-primary">
              <p className="font-bold text-base md:text-lg">Total Net Worth</p>
              <p className="text-xl md:text-2xl font-bold text-primary">
                {accountBalances.reduce((sum, a) => sum + a.balance, 0).toFixed(2)} kr
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm md:text-base">{cat.name}</span>
                      <span className="text-xs md:text-sm font-semibold">{cat.amount.toFixed(2)} kr ({cat.percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No spending data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {budgetProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetProgress.map((budget, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-medium text-sm md:text-base">{budget.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm">{budget.spent.toFixed(2)} kr / {budget.budget.toFixed(2)} kr</span>
                      <Badge variant={budget.percentage > 100 ? 'destructive' : budget.percentage > 80 ? 'default' : 'outline'}>
                        {budget.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentage, 100)} 
                    className={`h-2 ${budget.percentage > 100 ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction, idx) => {
                const category = categories.find(c => c.id === transaction.category_id);
                return (
                  <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-muted/50 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{transaction.note || category?.name || 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold text-sm md:text-base ${transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                        {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '→'} {transaction.amount.toFixed(2)} kr
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Largest Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Largest Income</CardTitle>
          </CardHeader>
          <CardContent>
            {largestTransactions.income.length > 0 ? (
              <div className="space-y-2">
                {largestTransactions.income.map((transaction, idx) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  return (
                  <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-success/5 rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{transaction.note || category?.name || 'Income'}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <p className="font-semibold text-success text-sm md:text-base shrink-0">
                        +{transaction.amount.toFixed(2)} kr
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No income transactions</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Largest Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {largestTransactions.expenses.length > 0 ? (
              <div className="space-y-2">
                {largestTransactions.expenses.map((transaction, idx) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  return (
                  <div key={idx} className="flex items-center justify-between p-2 md:p-3 bg-destructive/5 rounded-lg gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{transaction.note || category?.name || 'Expense'}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                    <p className="font-semibold text-destructive text-sm md:text-base shrink-0">
                        -{transaction.amount.toFixed(2)} kr
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No expense transactions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Cumulative Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No spending data</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="fill" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Income & Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Income" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No category data for this month
            </p>
          )}
        </CardContent>
      </Card>
      </>)}

      {/* ── ITEM ANALYSIS ───────────────────────────────────────────────────── */}
      {dashboardView === 'items' && (<>
        {receiptRows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No receipt data for this month. Upload receipts using the Add Transaction button.
            </CardContent>
          </Card>
        ) : (<>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Total Receipts</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-primary">{receiptRows.length}</div>
                <p className="text-xs text-muted-foreground mt-1">this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Stores Visited</CardTitle>
                <Store className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-primary">{storeStats.length}</div>
                <p className="text-xs text-muted-foreground mt-1">unique stores</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Avg Basket Size</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-primary">
                  {receiptRows.length > 0
                    ? (storeStats.reduce((s, x) => s + x.total, 0) / receiptRows.length).toFixed(2)
                    : '0.00'} kr
                </div>
                <p className="text-xs text-muted-foreground mt-1">per receipt</p>
              </CardContent>
            </Card>
          </div>

          {/* Spending by store */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Spending by Store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {storeStats.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center flex-wrap gap-1">
                    <span className="font-medium text-sm">{s.store}</span>
                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                      <span>{s.visits} visit{s.visits !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>avg {s.avgBasket.toFixed(0)} kr</span>
                      <span className="font-semibold text-foreground">{s.total.toFixed(2)} kr</span>
                    </div>
                  </div>
                  <Progress
                    value={(s.total / storeStats[0].total) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Spending by store — bar chart */}
          {storeStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Store Spending Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={storeStats.map(s => ({ name: s.store, Total: parseFloat(s.total.toFixed(2)), Visits: s.visits }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Total" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Spending by product category */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Spending by Product Category</CardTitle>
              </CardHeader>
              <CardContent>
                {productCategoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {productCategoryStats.map((cat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-xs font-semibold">{cat.amount.toFixed(2)} kr ({cat.percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                      </div>
                    ))}
                    {uncategorizedAmount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Uncategorized items</span>
                          <span className="text-xs font-semibold text-muted-foreground">{uncategorizedAmount.toFixed(2)} kr</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    No categorized items yet — categories are assigned automatically after upload.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {productCategoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={productCategoryStats}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        labelLine={false}
                        label={({ percentage }) => `${percentage.toFixed(0)}%`}
                        dataKey="amount"
                      >
                        {productCategoryStats.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toFixed(2)} kr`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Top Products by Spend</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category} · bought {p.count}×</p>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0">{p.amount.toFixed(2)} kr</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">No product data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly groceries spending */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                Weekly {groceriesCategoryName} Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyGroceries.some((w) => w.amount > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyGroceries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" fontSize={11} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${v} kr`} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kr`, groceriesCategoryName]} />
                    <Bar dataKey="amount" name={groceriesCategoryName} fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No {groceriesCategoryName.toLowerCase()} transactions this month.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent receipts list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Recent Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {receiptRows.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.store_name ?? 'Unknown store'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()} · {r.receipt_items?.length ?? 0} items
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{(r.total ?? 0).toFixed(2)} kr</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </>)}
      </>)}
    </div>
  );
}
