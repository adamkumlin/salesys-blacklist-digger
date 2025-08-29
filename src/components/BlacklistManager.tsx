import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, List, LogOut, RefreshCw } from 'lucide-react';
import { ApiClient, BlacklistItem, BlacklistString } from '@/lib/api';
import { DataTable } from './DataTable';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface BlacklistManagerProps {
  apiClient: ApiClient;
  onLogout: () => void;
}

export function BlacklistManager({ apiClient, onLogout }: BlacklistManagerProps) {
  const [blacklists, setBlacklists] = useState<BlacklistItem[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [strings, setStrings] = useState<BlacklistString[]>([]);
  const [stringsLoading, setStringsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const { toast } = useToast();

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadBlacklists();
  }, []);

  const loadBlacklists = async () => {
    try {
      const data = await apiClient.getBlacklists();
      setBlacklists(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blacklists. Please check your token.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStrings = async (page: number = 0) => {
    if (selectedLists.length === 0) return;
    
    setStringsLoading(true);
    try {
      const offset = page * PAGE_SIZE;
      const data = await apiClient.getBlacklistStrings(selectedLists, offset, PAGE_SIZE);
      
      if (page === 0) {
        setStrings(data);
      } else {
        setStrings(prev => [...prev, ...data]);
      }
      
      setHasNextPage(data.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blacklist strings.',
        variant: 'destructive',
      });
    } finally {
      setStringsLoading(false);
    }
  };

  const handleListSelection = (listId: string, checked: boolean) => {
    setSelectedLists(prev => {
      const newSelection = checked 
        ? [...prev, listId]
        : prev.filter(id => id !== listId);
      
      // Clear existing data when selection changes
      setStrings([]);
      setCurrentPage(0);
      setHasNextPage(false);
      
      return newSelection;
    });
  };

  const loadMoreStrings = () => {
    if (!stringsLoading && hasNextPage) {
      loadStrings(currentPage + 1);
    }
  };

  const exportToExcel = async () => {
    if (selectedLists.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one blacklist.',
        variant: 'destructive',
      });
      return;
    }

    if (stringsLoading) {
      return; // Prevent multiple simultaneous exports
    }

    try {
      setStringsLoading(true);
      
      toast({
        title: 'Export Started',
        description: 'Loading all data for export...',
      });
      
      // Load all strings for export
      let allStrings: BlacklistString[] = [];
      let offset = 0;
      let hasMore = true;
      const batchSize = 50;
      
      while (hasMore) {
        const batch = await apiClient.getBlacklistStrings(selectedLists, offset, batchSize);
        allStrings = [...allStrings, ...batch];
        hasMore = batch.length === batchSize;
        offset += batchSize;
        
        // Add a small delay to prevent overwhelming the API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (allStrings.length === 0) {
        toast({
          title: 'No Data',
          description: 'No strings found in selected blacklists.',
          variant: 'destructive',
        });
        return;
      }

      // Prepare data for Excel
      const exportData = allStrings.map(item => ({
        'Phone Number': item.string,
        'List ID': item.listId,
        'List Name': blacklists.find(bl => bl.id === item.listId)?.name || 'Unknown',
        'Organization ID': item.organizationId
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Blacklist Strings');

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const filename = `salesys-blacklist-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Export Complete',
        description: `Successfully exported ${allStrings.length} records to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data to Excel.',
        variant: 'destructive',
      });
    } finally {
      setStringsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading blacklists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SaleSys Blacklist Manager</h1>
            <p className="text-muted-foreground">Manage and export blacklist data</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Blacklists Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Available Blacklists ({blacklists.length})
            </CardTitle>
            <CardDescription>
              Select the blacklists you want to view and export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blacklists.map((list) => (
                <div key={list.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <Checkbox
                    id={list.id}
                    checked={selectedLists.includes(list.id)}
                    onCheckedChange={(checked) => handleListSelection(list.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={list.id} className="text-sm font-medium cursor-pointer block truncate">
                      {list.name}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={list.isGlobal ? "default" : "secondary"} className="text-xs">
                        {list.isGlobal ? 'Global' : 'Local'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedLists.length} of {blacklists.length} blacklists selected
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => loadStrings(0)}
                  disabled={selectedLists.length === 0 || stringsLoading}
                  variant="secondary"
                >
                  {stringsLoading ? 'Loading...' : 'Load Data'}
                </Button>
                <Button
                  onClick={exportToExcel}
                  disabled={selectedLists.length === 0 || stringsLoading}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {strings.length > 0 && (
          <DataTable
            data={strings}
            blacklists={blacklists}
            loading={stringsLoading}
            hasNextPage={hasNextPage}
            onLoadMore={loadMoreStrings}
          />
        )}
      </div>
    </div>
  );
}