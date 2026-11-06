'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi, purchaseOrderApi, mastersApi } from '@/lib/api';
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
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function PurchaseRejectActionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  const [resolveDialog, setResolveDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [resolveForm, setResolveForm] = useState({
    isReplacementExpected: true,
    supplierOption: 'same_vendor',
    replacementVendorId: '',
    replacementVendor: '',
    documentNoteType: 'debit_note',
    freightCharges: 'with_freight',
    replacementEta: '',
    purchaseRemarks: '',
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchase-reject-actions', statusFilter, search, page],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await qualityApi.getRejectActions(params);
      return res.data;
    },
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-for-reject'],
    queryFn: async () => {
      const res = await mastersApi.getVendors({ limit: 500 });
      return res.data?.data || [];
    },
  });
  const vendors = vendorsData || [];

  const actions = data?.data || [];
  const total = data?.total || 0;

  const updateMutation = useMutation({
    mutationFn: async ({ actionId, updateData }: { actionId: string; updateData: any }) => {
      return qualityApi.updateRejectAction(actionId, updateData);
    },
    onSuccess: () => {
      toast.success('Defect action saved successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-reject-actions'] });
      setResolveDialog(false);
      setSelectedAction(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save action');
    },
  });

  const pendingCount = actions.filter((a: any) => a.status === 'pending').length;
  const inProgressCount = actions.filter((a: any) => a.status === 'in_progress').length;
  const completedCount = actions.filter((a: any) => a.status === 'completed').length;

  const openResolveDialog = (action: any) => {
    setSelectedAction(action);
    setResolveForm({
      isReplacementExpected: action.isReplacementExpected ?? true,
      supplierOption: action.supplierOption || 'same_vendor',
      replacementVendorId: action.replacementVendorId || '',
      replacementVendor: action.replacementVendor || '',
      documentNoteType: action.documentNoteType || 'debit_note',
      freightCharges: action.freightCharges || 'with_freight',
      replacementEta: action.replacementEta ? new Date(action.replacementEta).toISOString().split('T')[0] : '',
      purchaseRemarks: action.purchaseRemarks || action.qualityRemarks || '',
    });
    setResolveDialog(true);
  };

  const handleSave = () => {
    if (!selectedAction) return;

    const payload: any = {
      isReplacementExpected: resolveForm.isReplacementExpected,
      supplierOption: resolveForm.supplierOption,
      documentNoteType: resolveForm.documentNoteType,
      freightCharges: resolveForm.freightCharges,
      purchaseRemarks: resolveForm.purchaseRemarks,
      status: 'in_progress',
    };

    if (resolveForm.isReplacementExpected) {
      payload.actionType = 'others';
      if (resolveForm.supplierOption === 'other_vendor' && resolveForm.replacementVendorId) {
        const vendor = vendors.find((v: any) => v.vendorId === resolveForm.replacementVendorId);
        payload.replacementVendorId = resolveForm.replacementVendorId;
        payload.replacementVendor = vendor?.vendorName || resolveForm.replacementVendor;
      }
      if (resolveForm.replacementEta) {
        payload.replacementEta = resolveForm.replacementEta;
      }
    } else {
      payload.actionType = 'others';
      payload.isReplacementExpected = false;
    }

    updateMutation.mutate({ actionId: selectedAction.actionId, updateData: payload });
  };

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Rejections Requiring Sourcing Action" description="Resolve rejected GRN items — assign replacement or return action">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm px-3 py-1">Immediate Attention</Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </WorkspacePageHeader>

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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by receipt ID, product, vendor..."
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
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Rejected Stage & Reason</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Resolve</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Loading reject actions...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-red-400">
                    Failed to load reject actions.
                  </TableCell>
                </TableRow>
              ) : actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No reject actions found
                  </TableCell>
                </TableRow>
              ) : (
                actions.map((action: any) => {
                  const statusCfg = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
                  return (
                    <TableRow key={action.actionId}>
                      <TableCell className="font-medium">{action.actionNumber || '—'}</TableCell>
                      <TableCell className="text-sm">{action.productName || '—'}</TableCell>
                      <TableCell>{action.vendorName || '—'}</TableCell>
                      <TableCell>
                        <span className="text-red-600 text-sm">
                          [Inbound Receiving] {action.qualityRemarks || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {Number(action.rejectedQty || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={action.status === 'pending' ? 'default' : 'outline'}
                          onClick={() => openResolveDialog(action)}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {actions.length} of {total} entries
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

      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Defect Action Form</DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm border">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">Receipt ID: </span>
                    <span className="font-medium text-blue-600">{selectedAction.actionNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">PO ID: </span>
                    <span className="font-medium">{selectedAction.poNumber || selectedAction.referenceNo || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Order No: </span>
                    <span className="font-medium">{selectedAction.referenceNo || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rejected Qty: </span>
                    <span className="font-bold text-red-600">{Number(selectedAction.rejectedQty || 0)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Product ID: </span>
                    <span className="font-medium">{selectedAction.productName || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Replacement Required? *</Label>
                  <Select
                    value={resolveForm.isReplacementExpected ? 'yes' : 'no'}
                    onValueChange={(v) => setResolveForm({ ...resolveForm, isReplacementExpected: v === 'yes' })}
                  >
                    <SelectTrigger className="bg-yellow-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No (Deduct PO)</SelectItem>
                      <SelectItem value="yes">Yes (Ask Replacement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Supplier Option</Label>
                  <Select
                    value={resolveForm.supplierOption}
                    onValueChange={(v) => setResolveForm({ ...resolveForm, supplierOption: v })}
                  >
                    <SelectTrigger className="bg-yellow-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same_vendor">Same Vendor</SelectItem>
                      <SelectItem value="other_vendor">Other Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {resolveForm.supplierOption === 'other_vendor' && (
                <div className="space-y-2">
                  <Label>Select Other Supplier *</Label>
                  <Select
                    value={resolveForm.replacementVendorId}
                    onValueChange={(v) => {
                      const vendor = vendors.find((vn: any) => vn.vendorId === v);
                      setResolveForm({
                        ...resolveForm,
                        replacementVendorId: v,
                        replacementVendor: vendor?.vendorName || '',
                      });
                    }}
                  >
                    <SelectTrigger className="bg-yellow-50">
                      <SelectValue placeholder="Select Supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.vendorId} value={v.vendorId}>
                          {v.vendorName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Document Note Type</Label>
                <Select
                  value={resolveForm.documentNoteType}
                  onValueChange={(v) => setResolveForm({ ...resolveForm, documentNoteType: v })}
                >
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return_material_note">Return Material Note</SelectItem>
                    <SelectItem value="debit_note">Debit Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-sm uppercase">Freight Charges</Label>
                <div className="flex gap-4 p-3 bg-blue-50 rounded-lg border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="freightCharges"
                      checked={resolveForm.freightCharges === 'with_freight'}
                      onChange={() => setResolveForm({ ...resolveForm, freightCharges: 'with_freight' })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">With Freight</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="freightCharges"
                      checked={resolveForm.freightCharges === 'without_freight'}
                      onChange={() => setResolveForm({ ...resolveForm, freightCharges: 'without_freight' })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">Without Freight</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expected Delivery ETA</Label>
                <Input
                  type="date"
                  value={resolveForm.replacementEta}
                  onChange={(e) => setResolveForm({ ...resolveForm, replacementEta: e.target.value })}
                  className="bg-yellow-50"
                />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={resolveForm.purchaseRemarks}
                  onChange={(e) => setResolveForm({ ...resolveForm, purchaseRemarks: e.target.value })}
                  placeholder="Add remarks..."
                  rows={3}
                  className="bg-yellow-50"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {updateMutation.isPending ? 'Saving...' : 'Save Action'}
            </Button>
            <Button variant="secondary" onClick={() => setResolveDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
