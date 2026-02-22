import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, Category, RecurringItem, getAccounts, getCategories, createRecurringItem, updateRecurringItem } from '@/lib/db';
import { toast } from 'sonner';

interface AddRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editItem?: RecurringItem;
}

export default function AddRecurringDialog({ open, onOpenChange, onSuccess, editItem }: AddRecurringDialogProps) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
      if (editItem) {
        setDescription(editItem.description);
        setType(editItem.type);
        setAmount(String(editItem.amount));
        setDayOfMonth(String(editItem.day_of_month));
        setAccountId(String(editItem.account_id));
        setCategoryId(String(editItem.category_id));
      } else {
        setDescription('');
        setAmount('');
        setDayOfMonth('1');
        setType('expense');
      }
    }
  }, [open, editItem]);

  const loadData = async () => {
    const allAccounts = (await getAccounts()).filter(a => a.active);
    const allCategories = (await getCategories()).filter(c => c.active);
    setAccounts(allAccounts);
    setCategories(allCategories);
    
    if (allAccounts.length > 0 && !accountId) {
      setAccountId(String(allAccounts[0].id));
    }
    if (allCategories.length > 0 && !categoryId) {
      setCategoryId(String(allCategories[0].id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!accountId || !categoryId) {
      toast.error('Please select an account and category');
      return;
    }

    const day = parseInt(dayOfMonth);
    if (day < 1 || day > 31) {
      toast.error('Day of month must be between 1 and 31');
      return;
    }

    setLoading(true);
    try {
      if (editItem) {
        await updateRecurringItem(editItem.id!, {
          description: description.trim(),
          amount: parseFloat(amount),
          category_id: parseInt(categoryId),
          account_id: parseInt(accountId),
          type,
          day_of_month: day,
        });
        toast.success('Recurring item updated successfully!');
      } else {
        await createRecurringItem({
          description: description.trim(),
          amount: parseFloat(amount),
          category_id: parseInt(categoryId),
          account_id: parseInt(accountId),
          type,
          day_of_month: day,
          active: true,
        });
        toast.success('Recurring item created successfully!');
      }

      setDescription('');
      setAmount('');
      setDayOfMonth('1');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving recurring item:', error);
      toast.error('Failed to save recurring item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Recurring Item' : 'Add Recurring Item'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Update your recurring income or expense' : 'Create a recurring income or expense'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly Rent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (kr)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="day">Day of Month (1-31)</Label>
              <Input
                id="day"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editItem ? 'Update Recurring Item' : 'Create Recurring Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
