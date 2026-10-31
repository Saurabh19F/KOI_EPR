'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productionApi } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

const QC_DISPLAY: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending QC', className: 'text-orange-500 font-semibold' },
  passed: { label: 'QC Passed', className: 'text-green-600 font-semibold' },
  failed: { label: 'QC Failed', className: 'text-red-600 font-semibold' },
  in_progress: { label: 'QC In Progress', className: 'text-blue-600 font-semibold' },
};

export default function ProductionHistoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['production-history-logs', page, entriesPerPage, search],
    queryFn: () =>
      productionApi.getLogs({
        page,
        limit: entriesPerPage,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const logs: any[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / entriesPerPage);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <h1 className="text-xl font-bold text-slate-900">Production History &amp; Quality Verification Console</h1>

      {/* Search + Entries per page */}
      <div className="flex items-center gap-4">
        <div className="relative w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search ledger..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="text-sm pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(entriesPerPage)} onValueChange={(v) => { setEntriesPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">entries per page</span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Run Log ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Date</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Consumed Raw SKU</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Produced Finished SKU</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Produced Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Dest Warehouse</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">QC Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Last Edit Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                  Loading production history...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                  No production logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => {
                const qc = QC_DISPLAY[log.qcStatus] || QC_DISPLAY.pending;
                const consumedQty = Math.round(Number(log.qtyConsumed || 0));
                const rawSkuDisplay = `${log.rawMaterialId || log.rawMaterialName || '—'} (${consumedQty})`;
                return (
                  <TableRow key={log.logId} className="border-b">
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {log.logNumber || `PROD-${log.logId?.slice(-4) || '—'}`}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {log.date ? new Date(log.date).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[400px]">
                      <span className="font-mono text-xs break-all">{rawSkuDisplay}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px]">
                      <span className="text-amber-600 font-medium cursor-pointer hover:underline">
                        {log.finishedProductName || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-slate-900">{Math.round(Number(log.qtyProduced || 0)).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.destinationWarehouseName || log.destinationWarehouseId || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={qc.className}>{qc.label}</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {log.updatedAt && log.updatedAt !== log.createdAt
                        ? new Date(log.updatedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-slate-500 font-medium">Review Locked</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {total === 0 ? 0 : (page - 1) * entriesPerPage + 1} to {Math.min(page * entriesPerPage, total)} of {total} entries
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
              &laquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              &lsaquo;
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="min-w-[36px]">
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              &rsaquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              &raquo;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
