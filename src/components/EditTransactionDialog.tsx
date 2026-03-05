import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account, Category, Transaction, getAccounts, getCategories, updateTransaction } from '@/lib/db';
import { toast } from 'sonner';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  transaction: Transaction;
}

export default function EditTransactionDialog({ open, onOpenChange, onSuccess, transaction }: EditTransactionDialogProps) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction.type);
  const [date, setDate] = useState(transaction.date);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [accountId, setAccountId] = useState<string>(transaction.account_id ? String(transaction.account_id) : '');
  const [categoryId, setCategoryId] = useState<string>(transaction.category_id ? String(transaction.category_id) : '');
  const [fromAccountId, setFromAccountId] = useState<string>(transaction.from_account_id ? String(transaction.from_account_id) : '');
  const [toAccountId, setToAccountId] = useState<string>(transaction.to_account_id ? String(transaction.to_account_id) : '');
  const [note, setNote] = useState(transaction.note || '');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
      // Re-sync form state when the dialog opens (transaction may have changed)
      setType(transaction.type);
      setDate(transaction.date);
      setAmount(String(transaction.amount));
      setAccountId(transaction.account_id ? String(transaction.account_id) : '');
      setCategoryId(transaction.category_id ? String(transaction.category_id) : '');
      setFromAccountId(transaction.from_account_id ? String(transaction.from_account_id) : '');
      setToAccountId(transaction.to_account_id ? String(transaction.to_account_id) : '');
      setNote(transaction.note || '');
    }
  }, [open, transaction]);

  const loadData = async () => {
    const allAccounts = (await getAccounts()).filter(a => a.active);
    const allCategories = (await getCategories()).filter(c => c.active);
    setAccounts(allAccounts);
    setCategories(allCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (type === 'transfer') {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
          toast.error('Please select different accounts for transfer');
          setLoading(false);
          return;
        }
        await updateTransaction(transaction.id!, {
          account_id: null,
          date,
          type,
          amount: parseFloat(amount),
          category_id: null,
          from_account_id: parseInt(fromAccountId),
          to_account_id: parseInt(toAccountId),
          note: note.trim() || null,
        });
      } else {
        if (!accountId || !categoryId) {
          toast.error('Please select an account and category');
          setLoading(false);
          return;
        }
        await updateTransaction(transaction.id!, {
          account_id: parseInt(accountId),
          date,
          type,
          amount: parseFloat(amount),
          category_id: parseInt(categoryId),
          from_account_id: null,
          to_account_id: null,
          note: note.trim() || null,
        });
      }

      toast.success('Transaction updated successfully!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Edit Transaction</DialogTitle>
          <DialogDescription className="text-sm">
            Update the details of this transaction
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={type} onValueChange={(value) => setType(value as 'income' | 'expense' | 'transfer')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs md:text-sm">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>

            {/* Expense & Income share the same fields */}
            {(['expense', 'income'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 md:space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label className="text-sm">Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Amount (kr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)} className="text-sm md:text-base">
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)} className="text-sm md:text-base">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">Note (optional)</Label>
                  <Textarea
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="text-sm md:text-base"
                  />
                </div>
              </TabsContent>
            ))}

            <TabsContent value="transfer" className="space-y-3 md:space-y-4 mt-4">
              <div className="grid gap-2">
                <Label className="text-sm">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">Amount (kr)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">From Account</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)} className="text-sm md:text-base">
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">To Account</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger className="text-sm md:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)} className="text-sm md:text-base">
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm">Note (optional)</Label>
                <Textarea
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="text-sm md:text-base"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
