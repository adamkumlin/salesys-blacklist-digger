import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Database } from 'lucide-react';
import { BlacklistItem, BlacklistString } from '@/lib/api';

interface DataTableProps {
  data: BlacklistString[];
  blacklists: BlacklistItem[];
  loading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

export function DataTable({ data, blacklists, loading, hasNextPage, onLoadMore }: DataTableProps) {
  const getListName = (listId: string) => {
    return blacklists.find(bl => bl.id === listId)?.name || 'Unknown';
  };

  const getListType = (listId: string) => {
    const list = blacklists.find(bl => bl.id === listId);
    return list?.isGlobal ? 'Global' : 'Local';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Blacklist Strings ({data.length} loaded)
        </CardTitle>
        <CardDescription>
          Phone numbers and contacts from selected blacklists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Phone Number</TableHead>
                <TableHead>List Name</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[300px]">Organization ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {item.string}
                  </TableCell>
                  <TableCell>
                    {getListName(item.listId)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getListType(item.listId) === 'Global' ? "default" : "secondary"}>
                      {getListType(item.listId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.organizationId}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {hasNextPage && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={onLoadMore}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
        
        {!hasNextPage && data.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            All data loaded ({data.length} records)
          </div>
        )}
      </CardContent>
    </Card>
  );
}