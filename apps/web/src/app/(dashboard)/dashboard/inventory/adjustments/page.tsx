'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockAdjustmentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SlidersHorizontal, Search, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

export default function StockAdjustmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-adjustments', page, search],
    queryFn: () =>
      stockAdjustmentApi.getAdjustments({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const adjustments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Stock Adjustments" description="View and manage inventory stock adjustments">
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Adjustment Log</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : adjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <SlidersHorizontal className="mb-2 h-10 w-10" />
              <p>No stock adjustments found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Adjusted Qty</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj: any) => (
                    <TableRow key={adj.adjustmentId}>
                      <TableCell className="font-medium font-mono text-xs">{adj.adjustmentId?.substring(0, 8)}</TableCell>
                      <TableCell>{adj.productName || adj.productId}</TableCell>
                      <TableCell>{adj.warehouseName || adj.warehouseId}</TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 ${Number(adj.adjustedQty) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(adj.adjustedQty) > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(Number(adj.adjustedQty)).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>{adj.reason || '—'}</TableCell>
                      <TableCell>{new Date(adj.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {adjustments.length} of {total} adjustments
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
