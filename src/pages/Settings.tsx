import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw } from 'lucide-react';

export default function Settings() {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import data');
  };

  const handleSweep = () => {
    // TODO: Implement end-of-month sweep
    console.log('Run sweep');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export or import your financial data for backup or migration purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Data (JSON)
            </Button>
            <Button onClick={handleImport} variant="outline" className="w-full sm:w-auto ml-0 sm:ml-3">
              <Upload className="h-4 w-4 mr-2" />
              Import Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>End-of-Month Operations</CardTitle>
            <CardDescription>
              Run end-of-month sweep to automatically transfer remaining balance to savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSweep} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run End-of-Month Sweep
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">App Version</dt>
                <dd className="font-medium">1.0.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Database</dt>
                <dd className="font-medium">IndexedDB (Local)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Storage Type</dt>
                <dd className="font-medium">Client-side only</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
