'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
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
import { Search, RefreshCw, Clock, AlertTriangle, FileText } from 'lucide-react';

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

export default function PendingPOReportPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pending-po-report', page, search],
    queryFn: () =>
      purchaseOrderApi.getOrders({
        page,
        limit: 100,
        status: 'pending',
        search: search || undefined,
      } as any).then((res) => res.data),
  });

  const orders = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const weekGroups = useMemo(() => {
    const groups = new Map<string, { label: string; orders: any[]; totalAmount: number }>();
    for (const order of orders) {
      const created = new Date(order.createdAt || order.orderDate);
      const key = getWeekKey(created);
      if (!groups.has(key)) {
        groups.set(key, { label: getWeekLabel(created), orders: [], totalAmount: 0 });
      }
      const g = groups.get(key)!;
      g.orders.push(order);
      g.totalAmount += Number(order.totalAmount || 0);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [orders]);

  const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
  const overdueCount = orders.filter((o: any) => {
    if (!o.expectedDeliveryDate) return false;
    return new Date(o.expectedDeliveryDate) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Pending PO Weekly Report" description="All pending purchase orders grouped by week of creation">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending POs</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Clock className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pending Value</p>
                <p className="text-2xl font-bold">
                  {totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue (Past ETA)</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Pending Purchase Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search PO number or vendor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-[260px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-10 w-10" />
              <p>No pending purchase orders</p>
            </div>
          ) : (
            <div className="space-y-6">
              {weekGroups.map(([weekKey, group]) => (
                <div key={weekKey} className="rounded-lg border">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-bold">Week of {group.label}</span>
                      <Badge variant="outline">{group.orders.length} POs</Badge>
                    </div>
                    <span className="font-semibold text-primary">
                      {group.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">PO Number</TableHead>
                        <TableHead className="text-xs">Vendor</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                        <TableHead className="text-xs">Expected Delivery</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.orders.map((o: any) => {
                        const isOverdue = o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < new Date();
                        return (
                          <TableRow key={o.orderId || o.id}>
                            <TableCell className="text-xs font-medium">{o.poNumber || o.orderNumber || '—'}</TableCell>
                            <TableCell className="text-xs">{o.vendorName || o.vendor?.name || '—'}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {o.expectedDeliveryDate ? (
                                <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                  {new Date(o.expectedDeliveryDate).toLocaleDateString()}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-right font-semibold">
                              {Number(o.totalAmount || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {orders.length} of {total} pending POs
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
