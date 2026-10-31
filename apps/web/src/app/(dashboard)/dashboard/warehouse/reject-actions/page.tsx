'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '@/lib/api';
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
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle,
  Wrench,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'outline' },
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

export default function RejectActionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const [resolveDialog, setResolveDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [resolveForm, setResolveForm] = useState({
    actionType: '',
    referenceNo: '',
    resolutionPath: '',
    purchaseRemarks: '',
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reject-actions', statusFilter, search, page],
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

  const updateMutation = useMutation({
    mutationFn: async ({ actionId, updateData }: { actionId: string; updateData: any }) => {
      return qualityApi.updateRejectAction(actionId, updateData);
    },
    onSuccess: () => {
      toast.success('Reject action resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['reject-actions'] });
      setResolveDialog(false);
      setSelectedAction(null);
      setResolveForm({ actionType: '', referenceNo: '', resolutionPath: '', purchaseRemarks: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update reject action');
    },
  });

  const openResolveDialog = (action: any) => {
    setSelectedAction(action);
    setResolveForm({
      actionType: action.actionType || '',
      referenceNo: action.referenceNo || '',
      resolutionPath: action.resolutionPath || '',
      purchaseRemarks: action.purchaseRemarks || '',
    });
    setResolveDialog(true);
  };

  const handleResolve = () => {
    if (!selectedAction) return;
    if (!resolveForm.actionType) {
      toast.error('Please select an action type');
      return;
    }
    updateMutation.mutate({
      actionId: selectedAction.actionId,
      updateData: {
        actionType: resolveForm.actionType,
        referenceNo: resolveForm.referenceNo,
        resolutionPath: resolveForm.resolutionPath,
        purchaseRemarks: resolveForm.purchaseRemarks,
        status: 'in_progress',
      },
    });
  };

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

  const pendingCount = actions.filter((a: any) => a.status === 'pending').length;
  const inProgressCount = actions.filter((a: any) => a.status === 'in_progress').length;
  const completedCount = actions.filter((a: any) => a.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Reject Actions</h1>
          <p className="text-sm text-slate-500 mt-1">Resolve rejected GRN items — assign action type and track resolution</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
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
            <CardTitle className="text-sm font-medium text-slate-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{inProgressCount}</span>
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
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
                <TableHead>Action No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead>Action Type</TableHead>
                <TableHead>Reference No</TableHead>
                <TableHead>Resolution Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Loading reject actions...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-red-400">
                    Failed to load reject actions. Please check permissions or try again.
                  </TableCell>
                </TableRow>
              ) : filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    No reject actions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((action: any) => {
                  const statusCfg = STATUS_CONFIG[action.status] || { label: action.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={action.actionId}>
                      <TableCell className="font-medium">
                        {action.actionNumber || '—'}
                      </TableCell>
                      <TableCell>
                        {action.actionDate
                          ? new Date(action.actionDate).toLocaleDateString()
                          : action.createdAt
                          ? new Date(action.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell>{action.vendorName || '—'}</TableCell>
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
                          : <span className="text-slate-400">Not set</span>}
                      </TableCell>
                      <TableCell>{action.referenceNo || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(action.status === 'pending' || action.status === 'in_progress') && (
                          <Button
                            size="sm"
                            onClick={() => openResolveDialog(action)}
                          >
                            <Wrench className="h-3.5 w-3.5 mr-1" /> Resolve Reject
                          </Button>
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

      {/* Resolve Reject Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Reject Action</DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt:</span>
                  <span className="font-medium">{selectedAction.actionNumber || selectedAction.receiptId?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PO Number:</span>
                  <span>{selectedAction.poNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span>{selectedAction.productName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rejected Qty:</span>
                  <span className="font-medium text-red-600">{Number(selectedAction.rejectedQty || 0).toLocaleString()}</span>
                </div>
                {selectedAction.qualityRemarks && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quality Remarks:</span>
                    <span className="max-w-[200px] text-right">{selectedAction.qualityRemarks}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Action Type *</Label>
                <Select
                  value={resolveForm.actionType}
                  onValueChange={(v) => setResolveForm({ ...resolveForm, actionType: v })}
                >
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="packing_issue">Packing Issue</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="bet_ctn">Bet CTN</SelectItem>
                    <SelectItem value="bent_ctn">Bent CTN</SelectItem>
                    <SelectItem value="shortage_pcs_ctn">Shortage in PCS and CTN</SelectItem>
                    <SelectItem value="different_item_as_po">Different Item as PO</SelectItem>
                    <SelectItem value="infected">Infected</SelectItem>
                    <SelectItem value="impacted">Impacted</SelectItem>
                    <SelectItem value="infection_in_material">Infection in Material</SelectItem>
                    <SelectItem value="moisture_damage">Moisture Damage</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                    <SelectItem value="short_kg">Short KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference No</Label>
                <Input
                  value={resolveForm.referenceNo}
                  onChange={(e) => setResolveForm({ ...resolveForm, referenceNo: e.target.value })}
                  placeholder="e.g. RTV-001, CN-001"
                  className="bg-yellow-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Resolution Path</Label>
                <Input
                  value={resolveForm.resolutionPath}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionPath: e.target.value })}
                  placeholder="e.g. Vendor pickup scheduled"
                  className="bg-yellow-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Remarks</Label>
                <Textarea
                  value={resolveForm.purchaseRemarks}
                  onChange={(e) => setResolveForm({ ...resolveForm, purchaseRemarks: e.target.value })}
                  placeholder="Additional remarks..."
                  className="bg-yellow-50"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={updateMutation.isPending || !resolveForm.actionType}
            >
              {updateMutation.isPending ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
