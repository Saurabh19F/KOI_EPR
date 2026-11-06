'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { qualityApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search,
  RefreshCw,
  History,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  packing_issue: 'Packing Issue',
  expired: 'Expired',
  bet_ctn: 'Bet CTN',
  bent_ctn: 'Bent CTN',
  shortage_pcs_ctn: 'Shortage in PCS and CTN',
  different_item_as_po: 'Different Item as PO',
  infected: 'Infected',
  impacted: 'Impacted',
  infection_in_material: 'Infection in Material',
  moisture_damage: 'Moisture Damage',
  others: 'Others',
  short_kg: 'Short KG',
};

export default function RejectHistoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('completed');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reject-history', statusFilter, search, page],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await qualityApi.getRejectActions(params);
      return res.data;
    },
  });

  const actions = data?.data || [];
  const total = data?.total || 0;

  const filteredActions = actions.filter((a: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.actionNumber?.toLowerCase().includes(s) ||
      a.poNumber?.toLowerCase().includes(s) ||
      a.productName?.toLowerCase().includes(s) ||
      a.productId?.toLowerCase().includes(s) ||
      a.receiptId?.toLowerCase().includes(s)
    );
  });

  const completedCount = actions.filter((a: any) => a.status === 'completed').length;
  const cancelledCount = actions.filter((a: any) => a.status === 'cancelled').length;

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Purchase Reject History" description="Completed and cancelled rejection resolutions">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </WorkspacePageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{completedCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{cancelledCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by receipt ID, PO number, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Reference No</TableHead>
                <TableHead>Resolution Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    Loading reject history...
                  </TableCell>
                </TableRow>
              ) : filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    No reject history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((action: any) => {
                  const statusCfg = STATUS_CONFIG[action.status] || { label: action.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={action.actionId}>
                      <TableCell className="font-medium">
                        {action.actionNumber || action.receiptId?.slice(0, 8) || '—'}
                      </TableCell>
                      <TableCell>
                        {action.actionDate
                          ? new Date(action.actionDate).toLocaleDateString()
                          : action.createdAt
                          ? new Date(action.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>{action.poNumber || '—'}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{action.productName || '—'}</div>
                          {action.productId && (
                            <div className="text-xs text-slate-400">{action.productId.slice(0, 8)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(action.rejectedQty || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {action.actionType
                          ? ACTION_TYPE_LABELS[action.actionType] || action.actionType
                          : '—'}
                      </TableCell>
                      <TableCell>{action.referenceNo || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {action.resolutionPath || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>{action.updatedBy || action.createdBy || '—'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {Math.ceil(total / 20)}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
