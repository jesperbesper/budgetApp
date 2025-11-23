import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDB, RecurringItem, Account, Category } from '@/lib/db';
import { Plus, Calendar } from 'lucide-react';

export default function Recurring() {
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDB();
    const allRecurring = await db.getAll('recurring_items');
    const allAccounts = await db.getAll('accounts');
    const allCategories = await db.getAll('categories');

    setRecurringItems(allRecurring);
    setAccounts(allAccounts);
    setCategories(allCategories);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Recurring Items</h1>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Apply for This Month
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Recurring Item
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recurring Items</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recurring items yet. Add recurring income or expenses to automate your budgeting.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
