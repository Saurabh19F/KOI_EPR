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
  ArrowLeftRight,
  Search,
  Download,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransferHistoryPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: transfersIn } = useQuery({
    queryKey: ['transfer-in', selectedWarehouse, search, page],
    queryFn: () => inventoryApi.getMovements({
      type: 'transfer_in',
      warehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      search: search || undefined,
      page,
      limit: 50,
    }),
  });

  const { data: transfersOut } = useQuery({
    queryKey: ['transfer-out', selectedWarehouse, search, page],
    queryFn: () => inventoryApi.getMovements({
      type: 'transfer_out',
      warehouseId: selectedWarehouse !== 'all' ? selectedWarehouse : undefined,
      search: search || undefined,
      page,
      limit: 50,
    }),
  });

  const warehouseList = warehouses?.data || [];
  const inItems = transfersIn?.data?.items || transfersIn?.data || [];
  const outItems = transfersOut?.data?.items || transfersOut?.data || [];
  const allTransfers = [...(Array.isArray(inItems) ? inItems : []), ...(Array.isArray(outItems) ? outItems : [])]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = !transfersIn && !transfersOut;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transfer History Log</h1>
          <p className="text-muted-foreground">Track inter-warehouse stock transfers</p>
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
                placeholder="Search by product or reference..."
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
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransfers.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="font-medium">{item.referenceNo || item.reference || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'transfer_in' ? 'default' : 'secondary'}>
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      {item.type === 'transfer_in' ? 'Transfer In' : 'Transfer Out'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {item.productName || item.product?.name || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{item.fromWarehouseName || item.fromWarehouse?.name || '-'}</TableCell>
                  <TableCell>{item.toWarehouseName || item.toWarehouse?.name || item.warehouseName || '-'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status || 'Completed'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {allTransfers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {isLoading ? 'Loading transfer history...' : 'No transfer records found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
