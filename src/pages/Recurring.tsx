import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecurringItem, Account, Category, getRecurringItems, getAccounts, getCategories, deleteRecurringItem, createTransaction } from '@/lib/db';
import { Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
import AddRecurringDialog from '@/components/AddRecurringDialog';
import { toast } from 'sonner';
import { DataTableSkeleton } from '@/components/PageSkeletons';
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

export default function Recurring() {
  const [loading, setLoading] = useState(true);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RecurringItem | undefined>(undefined);
  const [deleteItem, setDeleteItem] = useState<RecurringItem | undefined>(undefined);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const allRecurring = await getRecurringItems();
      const allAccounts = await getAccounts();
      const allCategories = await getCategories();

      setRecurringItems(allRecurring);
      setAccounts(allAccounts);
      setCategories(allCategories);
    } finally {
      setLoading(false);
    }
  }

  const getAccountName = (id: number) => {
    return accounts.find((a) => a.id === id)?.name || 'Unknown';
  };

  const getCategoryName = (id: number) => {
    return categories.find((c) => c.id === id)?.name || 'Unknown';
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-success' : 'text-destructive';
  };

  const handleEdit = (item: RecurringItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    try {
      await deleteRecurringItem(deleteItem.id!);
      toast.success('Recurring item deleted successfully');
      setDeleteItem(undefined);
      loadData();
    } catch (error) {
      console.error('Error deleting recurring item:', error);
      toast.error('Failed to delete recurring item');
    }
  };

  const handleApplyForThisMonth = async () => {
    setApplying(true);
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      
      let totalApplied = 0;
      
      for (const item of recurringItems) {
        if (!item.active) continue;
        
        await createTransaction({
          account_id: item.account_id,
          date: dateStr,
          type: item.type,
          amount: item.amount,
          category_id: item.category_id,
          from_account_id: null,
          to_account_id: null,
          note: `Recurring: ${item.description}`,
          tags: null,
        });
        
        totalApplied++;
      }
      
      toast.success(`Applied ${totalApplied} recurring item${totalApplied !== 1 ? 's' : ''} for this month`);
      loadData();
    } catch (error) {
      console.error('Error applying recurring items:', error);
      toast.error('Failed to apply recurring items');
    } finally {
      setApplying(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditItem(undefined);
    }
  };

  if (loading) return <DataTableSkeleton title="Recurring Items" />;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Recurring Items</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleApplyForThisMonth}
            disabled={applying || recurringItems.filter(item => item.active).length === 0}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {applying ? 'Applying...' : 'Apply for This Month'}
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Item
          </Button>
        </div>
      </div>

      <AddRecurringDialog 
        open={dialogOpen} 
        onOpenChange={handleDialogClose} 
        onSuccess={loadData}
        editItem={editItem}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.description}"? This action cannot be undone.
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
          <CardTitle className="text-base md:text-lg">All Recurring Items</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recurring items yet. Add recurring income or expenses to automate your budgeting.
            </p>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-2">
                {recurringItems.map((item) => (
                  <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.description}</p>
                        <p className={`text-xs capitalize ${getTypeColor(item.type)}`}>
                          {item.type}
                        </p>
                      </div>
                      <p className={`font-bold text-base shrink-0 ${getTypeColor(item.type)}`}>
                        {item.amount.toFixed(2)} kr
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getAccountName(item.account_id)}</span>
                      <span>Day {item.day_of_month}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{getCategoryName(item.category_id)}</span>
                      {item.active ? (
                        <Badge className="bg-success text-success-foreground text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="flex-1"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteItem(item)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Account</th>
                      <th className="text-left py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                      <th className="text-center py-3 px-4 font-medium">Day</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-center py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringItems.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{item.description}</td>
                        <td className="py-3 px-4">
                          <span className={`capitalize ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">{getAccountName(item.account_id)}</td>
                        <td className="py-3 px-4">{getCategoryName(item.category_id)}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${getTypeColor(item.type)}`}>
                          {item.amount.toFixed(2)} kr
                        </td>
                        <td className="py-3 px-4 text-center">{item.day_of_month}</td>
                        <td className="py-3 px-4 text-center">
                          {item.active ? (
                            <Badge className="bg-success text-success-foreground">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItem(item)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
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
