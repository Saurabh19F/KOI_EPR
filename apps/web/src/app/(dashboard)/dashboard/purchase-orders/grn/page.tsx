'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseOrderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Search, RefreshCw, Truck, CheckCircle, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  received: { label: 'Received', variant: 'default' },
  partially_received: { label: 'Partial', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function GoodsReceiptNotePage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grns', page, search],
    queryFn: () =>
      purchaseOrderApi.getGrns({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const grns = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goods Receipt Notes</h1>
          <p className="text-muted-foreground">Track goods received against purchase orders</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Truck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total GRNs</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{grns.filter((g: any) => g.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="text-2xl font-bold">{grns.filter((g: any) => g.status === 'received' || !g.status).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>GRN List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by GRN no or vendor..."
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
          ) : grns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="mb-2 h-10 w-10" />
              <p>No goods receipt notes found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GRN No</TableHead>
                    <TableHead>GRN Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.map((grn: any) => {
                    const statusConfig = STATUS_CONFIG[grn.status] || { label: grn.status || 'Received', variant: 'default' as const };
                    return (
                      <TableRow key={grn.grnId}>
                        <TableCell className="font-medium">{grn.grnNumber || grn.grnId?.substring(0, 8)}</TableCell>
                        <TableCell>{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{grn.vendorName || '—'}</TableCell>
                        <TableCell>{grn.invoiceNumber || '—'}</TableCell>
                        <TableCell>{grn.transporterName || '—'}</TableCell>
                        <TableCell className="text-right">{Number(grn.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {grns.length} of {total} GRNs
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
