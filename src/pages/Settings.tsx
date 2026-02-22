import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw, Calendar, FileText } from 'lucide-react';
import { Account, Transaction, RecurringItem, getAccounts, getTransactions, getRecurringItems, createTransaction } from '@/lib/db';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const [sweeping, setSweeping] = useState(false);
  const [applyingRecurring, setApplyingRecurring] = useState(false);
  const [showSweepDialog, setShowSweepDialog] = useState(false);
  const [sweepAmount, setSweepAmount] = useState(0);
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import data');
  };

  const handleSweepClick = async () => {
    try {
      const accounts = (await getAccounts()).filter(a => a.active);
      const allTransactions = await getTransactions();

      // Find checking and savings accounts
      const checking = accounts.find(a => a.type === 'checking');
      const savings = accounts.find(a => a.type === 'savings');

      if (!checking || !savings) {
        toast.error('You need both a checking and savings account to perform a sweep');
        return;
      }

      // Calculate checking account balance
      let checkingBalance = checking.initial_balance;
      
      checkingBalance += allTransactions
        .filter((t) => t.type === 'income' && t.account_id === checking.id)
        .reduce((sum, t) => sum + t.amount, 0);

      checkingBalance -= allTransactions
        .filter((t) => t.type === 'expense' && t.account_id === checking.id)
        .reduce((sum, t) => sum + t.amount, 0);

      checkingBalance -= allTransactions
        .filter((t) => t.type === 'transfer' && t.from_account_id === checking.id)
        .reduce((sum, t) => sum + t.amount, 0);

      checkingBalance += allTransactions
        .filter((t) => t.type === 'transfer' && t.to_account_id === checking.id)
        .reduce((sum, t) => sum + t.amount, 0);

      if (checkingBalance <= 0) {
        toast.error('No balance to sweep. Checking account balance is ' + checkingBalance.toFixed(2) + ' kr');
        return;
      }

      // Show confirmation dialog
      setSweepAmount(checkingBalance);
      setFromAccount(checking);
      setToAccount(savings);
      setShowSweepDialog(true);
    } catch (error) {
      console.error('Error preparing sweep:', error);
      toast.error('Failed to prepare sweep');
    }
  };

  const confirmSweep = async () => {
    if (!fromAccount || !toAccount) return;
    
    setSweeping(true);
    try {
      const now = new Date();
      
      await createTransaction({
        account_id: null,
        date: now.toISOString().split('T')[0],
        type: 'transfer',
        amount: sweepAmount,
        category_id: null,
        from_account_id: fromAccount.id!,
        to_account_id: toAccount.id!,
        note: 'End-of-month sweep',
        tags: null,
      });

      toast.success(`Swept ${sweepAmount.toFixed(2)} kr from ${fromAccount.name} to ${toAccount.name}`);
      setShowSweepDialog(false);
    } catch (error) {
      console.error('Error performing sweep:', error);
      toast.error('Failed to perform sweep');
    } finally {
      setSweeping(false);
    }
  };

  const handleApplyNextMonthRecurring = async () => {
    setApplyingRecurring(true);
    try {
      const recurringItems = (await getRecurringItems()).filter(r => r.active);
      
      if (recurringItems.length === 0) {
        toast.info('No active recurring items to apply');
        return;
      }

      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const dateStr = nextMonth.toISOString().split('T')[0];
      
      let appliedCount = 0;
      
      for (const item of recurringItems) {
        await createTransaction({
          account_id: item.account_id,
          date: dateStr,
          type: item.type,
          amount: item.amount,
          category_id: item.category_id,
          from_account_id: null,
          to_account_id: null,
          note: `Recurring (next month): ${item.description}`,
          tags: null,
        });
        appliedCount++;
      }
      
      toast.success(`Applied ${appliedCount} recurring item${appliedCount !== 1 ? 's' : ''} for next month`);
    } catch (error) {
      console.error('Error applying recurring items:', error);
      toast.error('Failed to apply recurring items');
    } finally {
      setApplyingRecurring(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      
      const allTransactions = await getTransactions();
      const monthTransactions = allTransactions.filter(t => t.date.startsWith(currentMonth));
      
      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const message = `Monthly Report for ${currentMonth}:\n\n` +
        `Total Income: ${income.toFixed(2)} kr\n` +
        `Total Expenses: ${expenses.toFixed(2)} kr\n` +
        `Net: ${(income - expenses).toFixed(2)} kr\n` +
        `Transactions: ${monthTransactions.length}`;
      
      toast.success(message, { duration: 8000 });
      console.log(message);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Data Management</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Export or import your financial data for backup or migration purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Data (JSON)
            </Button>
            <Button onClick={handleImport} variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Import Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">End-of-Month Operations</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Automated tasks to help close out the month and prepare for the next
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button onClick={handleSweepClick} disabled={sweeping} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                {sweeping ? 'Processing...' : 'Sweep to Savings'}
              </Button>
              <Button 
                onClick={handleApplyNextMonthRecurring} 
                disabled={applyingRecurring}
                variant="outline" 
                className="w-full sm:w-auto"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {applyingRecurring ? 'Applying...' : 'Apply Next Month Recurring'}
              </Button>
              <Button 
                onClick={handleGenerateReport} 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Monthly Report
              </Button>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-4 space-y-1">
              <p><strong>Sweep to Savings:</strong> Transfers remaining balance from checking to savings</p>
              <p><strong>Apply Next Month Recurring:</strong> Pre-applies all recurring items for the next month</p>
              <p><strong>Generate Monthly Report:</strong> Shows a summary of current month's income and expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-xs md:text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">App Version</dt>
                <dd className="font-medium">1.0.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Database</dt>
                <dd className="font-medium">SQLite (Local)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Storage Type</dt>
                <dd className="font-medium">Client-side only</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showSweepDialog} onOpenChange={setShowSweepDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm End-of-Month Sweep</AlertDialogTitle>
            <AlertDialogDescription>
              Transfer {sweepAmount.toFixed(2)} kr from {fromAccount?.name} to {toAccount?.name}?
              <br /><br />
              This will create a transfer transaction dated today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSweep} disabled={sweeping}>
              {sweeping ? 'Processing...' : 'Confirm Sweep'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
