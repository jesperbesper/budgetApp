import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account, Category, getAccounts, getCategories, createTransaction } from '@/lib/db';
import { toast } from 'sonner';
import ReceiptUploadTab, { type ReceiptUploadTabHandle, type Phase as ReceiptPhase } from '@/components/ReceiptUploadTab';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddTransactionDialog({ open, onOpenChange, onSuccess }: AddTransactionDialogProps) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inputMode, setInputMode] = useState<'manual' | 'upload'>('manual');
  const receiptTabRef = useRef<ReceiptUploadTabHandle>(null);
  const [receiptPhase, setReceiptPhase] = useState<ReceiptPhase>('idle');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const allAccounts = (await getAccounts()).filter(a => a.active);
    const allCategories = (await getCategories()).filter(c => c.active);
    setAccounts(allAccounts);
    setCategories(allCategories);
    
    if (allAccounts.length > 0 && !accountId) {
      setAccountId(String(allAccounts[0].id));
      setFromAccountId(String(allAccounts[0].id));
      if (allAccounts.length > 1) {
        setToAccountId(String(allAccounts[1].id));
      }
    }
    if (allCategories.length > 0 && !categoryId) {
      setCategoryId(String(allCategories[0].id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In upload mode, delegate to ReceiptUploadTab
    if (inputMode === 'upload') {
      receiptTabRef.current?.confirm();
      return;
    }
    
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
        await createTransaction({
          account_id: null,
          date,
          type,
          amount: parseFloat(amount),
          category_id: null,
          from_account_id: parseInt(fromAccountId),
          to_account_id: parseInt(toAccountId),
          note: note.trim() || null,
          tags: null,
        });
      } else {
        if (!accountId || !categoryId) {
          toast.error('Please select an account and category');
          setLoading(false);
          return;
        }
        await createTransaction({
          account_id: parseInt(accountId),
          date,
          type,
          amount: parseFloat(amount),
          category_id: parseInt(categoryId),
          from_account_id: null,
          to_account_id: null,
          note: note.trim() || null,
          tags: null,
        });
      }

      toast.success('Transaction added successfully!');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setInputMode('manual');
    setReceiptPhase('idle');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Add New Transaction</DialogTitle>
          <DialogDescription className="text-sm">
            Record an income, expense, or transfer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={type} onValueChange={(value: any) => setType(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs md:text-sm">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-4">
              {/* Manual / Upload segmented toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden mb-4">
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setInputMode('manual')}
                >
                  Manual
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                    inputMode === 'upload'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setInputMode('upload')}
                >
                  Upload
                </button>
              </div>

              {inputMode === 'manual' && (
                <div className="space-y-3 md:space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-sm">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-sm">Amount (kr)</Label>
                    <Input
                      id="amount"
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
                    <Label htmlFor="account" className="text-sm">Account</Label>
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
                    <Label htmlFor="category" className="text-sm">Category</Label>
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
                    <Label htmlFor="note" className="text-sm">Note (optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="text-sm md:text-base"
                    />
                  </div>
                </div>
              )}

              {inputMode === 'upload' && (
                <ReceiptUploadTab
                  ref={receiptTabRef}
                  accounts={accounts}
                  categories={categories}
                  onSuccess={onSuccess}
                  onClose={() => onOpenChange(false)}
                  onPhaseChange={setReceiptPhase}
                />
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-3 md:space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="date-income" className="text-sm">Date</Label>
                <Input
                  id="date-income"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount-income" className="text-sm">Amount (kr)</Label>
                <Input
                  id="amount-income"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-income" className="text-sm">Account</Label>
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
                <Label htmlFor="category-income" className="text-sm">Category</Label>
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
                <Label htmlFor="note-income" className="text-sm">Note (optional)</Label>
                <Textarea
                  id="note-income"
                  placeholder="Add a note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="text-sm md:text-base"
                />
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-3 md:space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="date-transfer" className="text-sm">Date</Label>
                <Input
                  id="date-transfer"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount-transfer" className="text-sm">Amount (kr)</Label>
                <Input
                  id="amount-transfer"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-sm md:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from-account" className="text-sm">From Account</Label>
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
                <Label htmlFor="to-account" className="text-sm">To Account</Label>
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
                <Label htmlFor="note-transfer" className="text-sm">Note (optional)</Label>
                <Textarea
                  id="note-transfer"
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
            <Button
              type="submit"
              disabled={
                loading ||
                (inputMode === 'upload' && receiptPhase !== 'review') ||
                (inputMode === 'upload' && receiptPhase === 'confirming')
              }
              className="w-full sm:w-auto"
            >
              {(inputMode === 'upload' && receiptPhase === 'confirming') ? 'Saving...' : loading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
