import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getDB, WishlistItem } from '@/lib/db';
import { Plus, Target } from 'lucide-react';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDB();
    const allWishlist = await db.getAll('wishlist_items');
    setWishlistItems(allWishlist);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Wishlist</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Wishlist Item
        </Button>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No wishlist items yet. Start saving for your goals!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => {
            const progress = (item.saved_amount / item.target_amount) * 100;

            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Saved</span>
                      <span className="font-semibold">
                        {item.saved_amount.toFixed(2)} / {item.target_amount.toFixed(2)} kr
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>

                  {item.deadline && (
                    <p className="text-sm text-muted-foreground">
                      Deadline: {new Date(item.deadline).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    {item.status === 'active' && (
                      <Button size="sm" variant="outline" className="ml-auto">
                        Add Funds
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
