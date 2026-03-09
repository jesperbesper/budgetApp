import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Category, getCategories } from '@/lib/db';
import { Plus } from 'lucide-react';
import AddCategoryDialog from '@/components/AddCategoryDialog';
import { CategoryGroupSkeleton } from '@/components/PageSkeletons';

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
    const allCategories = (await getCategories()).filter(c => c.active);

    setCategories(allCategories);

    // Group by group_name
    const grouped = allCategories.reduce((acc, category) => {
      const group = category.group_name || 'Uncategorized';
      if (!acc[group]) acc[group] = [];
      acc[group].push(category);
      return acc;
    }, {} as Record<string, Category[]>);

    setGroupedCategories(grouped);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <CategoryGroupSkeleton />;

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Categories</h1>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <AddCategoryDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadData}
      />

      <div className="space-y-4 md:space-y-6">
        {Object.entries(groupedCategories).map(([groupName, groupCategories]) => (
          <Card key={groupName}>
            <CardHeader>
              <CardTitle className="text-base md:text-xl">{groupName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {groupCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-2 md:p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium text-sm md:text-base">{category.name}</span>
                    <div className="flex gap-2">
                      {category.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {!category.active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
