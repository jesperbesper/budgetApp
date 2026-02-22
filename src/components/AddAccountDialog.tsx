import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, createAccount, updateAccount } from '@/lib/db';
import { toast } from 'sonner';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editAccount?: Account;
  currentBalance?: number;
}

export default function AddAccountDialog({ open, onOpenChange, onSuccess, editAccount, currentBalance }: AddAccountDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'savings' | 'cash' | 'credit'>('checking');
  const [initialBalance, setInitialBalance] = useState('0');
  const [editingCurrentBalance, setEditingCurrentBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editAccount) {
        setName(editAccount.name);
        setType(editAccount.type);
        setInitialBalance(String(editAccount.initial_balance));
        setEditingCurrentBalance(String(currentBalance || editAccount.initial_balance));
      } else {
        setName('');
        setType('checking');
        setInitialBalance('0');
        setEditingCurrentBalance('0');
      }
    }
  }, [open, editAccount, currentBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    setLoading(true);
    try {
      if (editAccount) {
        const newCurrentBalance = parseFloat(editingCurrentBalance) || 0;
        const oldCurrentBalance = currentBalance || editAccount.initial_balance;
        const adjustment = newCurrentBalance - oldCurrentBalance;
        const newInitialBalance = editAccount.initial_balance + adjustment;

        await updateAccount(editAccount.id!, { name: name.trim(), type, initial_balance: newInitialBalance });
        toast.success('Account updated successfully!');
      } else {
        await createAccount({ name: name.trim(), type, initial_balance: parseFloat(initialBalance) || 0, active: true });
        toast.success('Account created successfully!');
      }

      setName('');
      setType('checking');
      setInitialBalance('0');
      setEditingCurrentBalance('0');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          <DialogDescription>
            {editAccount ? 'Update your account details' : 'Create a new account to track your finances'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Account Type</Label>
              <Select value={type} onValueChange={(value: 'checking' | 'savings' | 'cash' | 'credit') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editAccount ? (
              <div className="grid gap-2">
                <Label htmlFor="currentBalance">Current Balance (kr)</Label>
                <Input
                  id="currentBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingCurrentBalance}
                  onChange={(e) => setEditingCurrentBalance(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Edit this to adjust your account balance
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="balance">Initial Balance (kr)</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editAccount ? 'Update Account' : 'Create Account')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
