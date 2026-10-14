'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productionApi } from '@/lib/api';
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
import { ClipboardList, Search, RefreshCw, Package, Factory } from 'lucide-react';

const QC_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  passed: { label: 'Passed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
  in_progress: { label: 'In Progress', variant: 'outline' },
};

export default function DailyLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['production-logs', page, search],
    queryFn: () =>
      productionApi.getLogs({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const totalConsumed = logs.reduce((s: number, l: any) => s + Number(l.qtyConsumed || 0), 0);
  const totalProduced = logs.reduce((s: number, l: any) => s + Number(l.qtyProduced || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Production Log</h1>
          <p className="text-muted-foreground">Track daily raw material consumption and finished goods output</p>
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
              <div className="rounded-lg bg-blue-100 p-2"><ClipboardList className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2"><Package className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Raw Material Consumed</p>
                <p className="text-2xl font-bold">{totalConsumed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Factory className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Finished Goods Produced</p>
                <p className="text-2xl font-bold">{totalProduced.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Production Logs</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[200px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardList className="mb-2 h-10 w-10" />
              <p>No production logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Log No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Qty Consumed</TableHead>
                    <TableHead>Finished Product</TableHead>
                    <TableHead>Qty Produced</TableHead>
                    <TableHead>QC Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => {
                    const qcConfig = QC_STATUS_CONFIG[log.qcStatus] || QC_STATUS_CONFIG.pending;
                    return (
                      <TableRow key={log.logId}>
                        <TableCell className="font-medium">{log.logNumber || log.logId?.substring(0, 8)}</TableCell>
                        <TableCell>{log.date ? new Date(log.date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{log.productionWarehouseName || '—'}</TableCell>
                        <TableCell>{log.rawMaterialName || '—'}</TableCell>
                        <TableCell>{Number(log.qtyConsumed || 0).toLocaleString()}</TableCell>
                        <TableCell>{log.finishedProductName || '—'}</TableCell>
                        <TableCell>{Number(log.qtyProduced || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={qcConfig.variant}>{qcConfig.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {logs.length} of {total} logs
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
