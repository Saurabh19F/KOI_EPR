'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  RotateCcw,
  Search,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Factory,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Review', variant: 'secondary' },
  approved: { label: 'Accepted', variant: 'default' },
  in_transit: { label: 'In Transit', variant: 'outline' },
  received: { label: 'Received', variant: 'default' },
  cancelled: { label: 'Rejected', variant: 'destructive' },
};

export default function ProductionReturnsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['production-returns', warehouseId, statusFilter, page],
    queryFn: async () => {
      const params: any = { page, limit: 50 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await inventoryTrackingApi.getTransfers(params);
      return res.data;
    },
    enabled: !!warehouseId,
  });

  const allTransfers = data?.data || data?.transfers || [];
  const returns = allTransfers.filter((t: any) => {
    const isReturn =
      t.requestType === 'production_return' ||
      t.requestType === 'return' ||
      (t.productionId && t.destinationWarehouseId === warehouseId);
    return isReturn;
  });
  const total = returns.length;

  const approveMutation = useMutation({
    mutationFn: async (transferId: string) => {
      return inventoryTrackingApi.approveTransfer(transferId);
    },
    onSuccess: () => {
      toast.success('Return accepted — material added to warehouse stock');
      queryClient.invalidateQueries({ queryKey: ['production-returns'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to accept return');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      return inventoryTrackingApi.rejectTransfer(transferId, reason);
    },
    onSuccess: () => {
      toast.success('Return rejected');
      queryClient.invalidateQueries({ queryKey: ['production-returns'] });
      setRejectDialog(false);
      setSelectedTransfer(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reject return');
    },
  });

  const handleAccept = (transfer: any) => {
    approveMutation.mutate(transfer.transferId);
  };

  const openRejectDialog = (transfer: any) => {
    setSelectedTransfer(transfer);
    setRejectReason('');
    setRejectDialog(true);
  };

  const handleReject = () => {
    if (!selectedTransfer) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({
      transferId: selectedTransfer.transferId,
      reason: rejectReason.trim(),
    });
  };

  const filteredReturns = returns.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.transferNumber?.toLowerCase().includes(s) ||
      t.orderNo?.toLowerCase().includes(s) ||
      t.productionId?.toLowerCase().includes(s) ||
      t.finalProductName?.toLowerCase().includes(s) ||
      t.sourceWarehouseName?.toLowerCase().includes(s) ||
      t.requestedByUsername?.toLowerCase().includes(s)
    );
  });

  const pendingCount = returns.filter((t: any) => t.status === 'pending').length;
  const acceptedCount = returns.filter((t: any) => t.status === 'approved' || t.status === 'received').length;
  const rejectedCount = returns.filter((t: any) => t.status === 'cancelled').length;

  if (!warehouseId) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-semibold text-amber-800">No Warehouse Assigned</h3>
            <p className="text-amber-600 mt-1">
              Contact your admin to assign you to a warehouse to view production returns.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Material Returns</h1>
          <p className="text-sm text-slate-500 mt-1">Review and accept materials returned from production</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{acceptedCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{rejectedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by return ID, order no, production ID, material..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Accepted</SelectItem>
            <SelectItem value="cancelled">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Production ID</TableHead>
                <TableHead>Order No</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>From Production</TableHead>
                <TableHead className="text-right">Return Qty</TableHead>
                <TableHead>Return Reason</TableHead>
                <TableHead>Returned By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    Loading production returns...
                  </TableCell>
                </TableRow>
              ) : filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    No production returns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((transfer: any) => {
                  const statusCfg = STATUS_CONFIG[transfer.status] || { label: transfer.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={transfer.transferId}>
                      <TableCell className="font-medium">{transfer.transferNumber}</TableCell>
                      <TableCell>
                        {transfer.productionId ? (
                          <div className="flex items-center gap-1">
                            <Factory className="h-3.5 w-3.5 text-slate-400" />
                            {transfer.productionId.slice(0, 8)}...
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{transfer.orderNo || '—'}</TableCell>
                      <TableCell>{transfer.finalProductName || '—'}</TableCell>
                      <TableCell>{transfer.sourceWarehouseName || '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(transfer.totalQuantity || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transfer.requestRemarks || '—'}
                      </TableCell>
                      <TableCell>{transfer.requestedByUsername || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {transfer.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAccept(transfer)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(transfer)}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Production Return</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return ID:</span>
                  <span className="font-medium">{selectedTransfer.transferNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Material:</span>
                  <span>{selectedTransfer.finalProductName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Qty:</span>
                  <span className="font-medium">{Number(selectedTransfer.totalQuantity || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Returned By:</span>
                  <span>{selectedTransfer.requestedByUsername || '—'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejecting this return..."
                  className="bg-yellow-50"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
