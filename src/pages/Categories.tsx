import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDB, Category } from '@/lib/db';
import { Plus } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, Category[]>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const db = await getDB();
    const allCategories = await db.getAll('categories');

    setCategories(allCategories);

    // Group by group_name
    const grouped = allCategories.reduce((acc, category) => {
      const group = category.group_name || 'Uncategorized';
      if (!acc[group]) acc[group] = [];
      acc[group].push(category);
      return acc;
    }, {} as Record<string, Category[]>);

    setGroupedCategories(grouped);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedCategories).map(([groupName, groupCategories]) => (
          <Card key={groupName}>
            <CardHeader>
              <CardTitle className="text-xl">{groupName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
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
