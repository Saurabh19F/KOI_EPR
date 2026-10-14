'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowDown,
  Search,
  Download,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceivingHistoryPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ['receiving-history', selectedWarehouse, search, page],
    queryFn: () => inventoryApi.getMovements({
      type: 'purchase_receipt',
      warehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      search: search || undefined,
      page,
      limit: 20,
    }),
  });

  const warehouseList = warehouses?.data || [];
  const items = movements?.data?.items || movements?.data || [];
  const totalPages = movements?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receiving History Log</h1>
          <p className="text-muted-foreground">Track all incoming goods received at warehouses</p>
        </div>
        <Button variant="outline" onClick={() => toast.success('Export feature coming soon')}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by product, PO number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={(v) => { setSelectedWarehouse(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouseList.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(items) ? items : []).map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="font-medium">{item.referenceNo || item.reference || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {item.productName || item.product?.name || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{item.warehouseName || item.warehouse?.name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.createdByName || item.createdBy?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status || 'Completed'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!Array.isArray(items) || items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {isLoading ? 'Loading receiving history...' : 'No receiving records found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
