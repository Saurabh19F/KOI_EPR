'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivingPlanApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { PackagePlus, Search, RefreshCw, Download, Plus, Pencil, XCircle, ClipboardCheck, History } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  partially_received: { label: 'Partial', variant: 'outline' },
  received: { label: 'Received', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const EMPTY_FORM = {
  productId: '',
  productName: '',
  warehouseId: '',
  warehouseName: '',
  plannedQty: '',
  purchaseOrderId: '',
  poNumber: '',
  remarks: '',
};

const EMPTY_GRN_FORM = {
  receivedQty: '',
  rejectedQty: '',
  storageLocation: '',
  invoiceNo: '',
  biltyNo: '',
  truckNo: '',
  driverName: '',
  driverNo: '',
  gstInvoiceNo: '',
  invoiceImageUrl: '',
  itemImageUrl: '',
  remarks: '',
};

export default function ReceivingPlansPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showGrnDialog, setShowGrnDialog] = useState(false);
  const [grnPlan, setGrnPlan] = useState<any>(null);
  const [grnForm, setGrnForm] = useState(EMPTY_GRN_FORM);
  const [showGrnHistory, setShowGrnHistory] = useState(false);
  const [historyPlan, setHistoryPlan] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['receiving-plans', page, search, status],
    queryFn: () =>
      receivingPlanApi.getPlans({
        page,
        limit: 20,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }).then((res) => res.data),
  });

  const syncMutation = useMutation({
    mutationFn: () => receivingPlanApi.syncFromApprovedPOs(),
    onSuccess: (res) => {
      const result = res.data;
      toast.success(`Sync complete: ${result.synced} POs synced, ${result.skipped} skipped`);
      if (result.errors?.length > 0) {
        toast.error(`${result.errors.length} error(s) during sync`);
      }
      queryClient.invalidateQueries({ queryKey: ['receiving-plans'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to sync receiving plans';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => receivingPlanApi.createPlan(data),
    onSuccess: () => {
      toast.success('Receiving plan created');
      queryClient.invalidateQueries({ queryKey: ['receiving-plans'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create plan';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => receivingPlanApi.updatePlan(id, data),
    onSuccess: () => {
      toast.success('Receiving plan updated');
      queryClient.invalidateQueries({ queryKey: ['receiving-plans'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update plan';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => receivingPlanApi.cancelPlan(id),
    onSuccess: () => {
      toast.success('Receiving plan cancelled');
      queryClient.invalidateQueries({ queryKey: ['receiving-plans'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to cancel plan';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const grnMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => receivingPlanApi.submitGrn(planId, data),
    onSuccess: (res) => {
      toast.success(`GRN ${res.data?.grnNumber || ''} created successfully`);
      queryClient.invalidateQueries({ queryKey: ['receiving-plans'] });
      queryClient.invalidateQueries({ queryKey: ['grn-history'] });
      handleCloseGrnDialog();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to submit GRN';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const { data: grnHistoryData } = useQuery({
    queryKey: ['grn-history', historyPlan?.planId],
    queryFn: () => receivingPlanApi.getGrnHistory(historyPlan.planId).then((res) => res.data),
    enabled: !!historyPlan?.planId && showGrnHistory,
  });

  const handleCloseGrnDialog = () => {
    setShowGrnDialog(false);
    setGrnPlan(null);
    setGrnForm(EMPTY_GRN_FORM);
  };

  const handleOpenGrn = (plan: any) => {
    setGrnPlan(plan);
    setGrnForm(EMPTY_GRN_FORM);
    setShowGrnDialog(true);
  };

  const handleSubmitGrn = () => {
    const received = Number(grnForm.receivedQty);
    const rejected = Number(grnForm.rejectedQty || 0);
    if (received <= 0) {
      toast.error('Received quantity must be greater than 0');
      return;
    }
    if (rejected > received) {
      toast.error('Rejected quantity cannot exceed received quantity');
      return;
    }
    grnMutation.mutate({
      planId: grnPlan.planId,
      data: {
        receivedQty: received,
        rejectedQty: rejected || undefined,
        storageLocation: grnForm.storageLocation || undefined,
        invoiceNo: grnForm.invoiceNo || undefined,
        biltyNo: grnForm.biltyNo || undefined,
        truckNo: grnForm.truckNo || undefined,
        driverName: grnForm.driverName || undefined,
        driverNo: grnForm.driverNo || undefined,
        gstInvoiceNo: grnForm.gstInvoiceNo || undefined,
        invoiceImageUrl: grnForm.invoiceImageUrl || undefined,
        itemImageUrl: grnForm.itemImageUrl || undefined,
        remarks: grnForm.remarks || undefined,
      },
    });
  };

  const handleOpenHistory = (plan: any) => {
    setHistoryPlan(plan);
    setShowGrnHistory(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditPlan(null);
    setFormData(EMPTY_FORM);
  };

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setEditPlan(null);
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditPlan(plan);
    setFormData({
      productId: plan.productId || '',
      productName: plan.productName || '',
      warehouseId: plan.warehouseId || '',
      warehouseName: plan.warehouseName || '',
      plannedQty: String(plan.plannedQty || ''),
      purchaseOrderId: plan.purchaseOrderId || '',
      poNumber: plan.poNumber || '',
      remarks: plan.remarks || '',
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    const qty = Number(formData.plannedQty);
    if (!formData.productId || !formData.productName || !formData.warehouseId || !formData.warehouseName || qty <= 0) {
      toast.error('Please fill all required fields with valid values');
      return;
    }

    if (editPlan) {
      updateMutation.mutate({
        id: editPlan.planId,
        data: {
          plannedQty: qty,
          warehouseId: formData.warehouseId,
          warehouseName: formData.warehouseName,
          remarks: formData.remarks || undefined,
        },
      });
    } else {
      createMutation.mutate({
        productId: formData.productId,
        productName: formData.productName,
        warehouseId: formData.warehouseId,
        warehouseName: formData.warehouseName,
        plannedQty: qty,
        purchaseOrderId: formData.purchaseOrderId || undefined,
        poNumber: formData.poNumber || undefined,
        remarks: formData.remarks || undefined,
      });
    }
  };

  const handleCancel = (plan: any) => {
    if (confirm(`Cancel plan ${plan.planNumber}? This cannot be undone.`)) {
      cancelMutation.mutate(plan.planId);
    }
  };

  const plans = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receiving Plans</h1>
          <p className="text-muted-foreground">Track expected receipts against purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {syncMutation.isPending ? 'Syncing...' : 'Sync from Approved POs'}
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Plan List</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_received">Partial</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackagePlus className="mb-2 h-10 w-10" />
              <p>No receiving plans found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan No</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Planned Qty</TableHead>
                    <TableHead>Received Qty</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan: any) => {
                    const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.pending;
                    const canEdit = plan.status === 'pending' || plan.status === 'partially_received';
                    const canCancel = plan.status !== 'received' && plan.status !== 'cancelled';
                    const canReceive = plan.status === 'pending' || plan.status === 'partially_received';
                    return (
                      <TableRow key={plan.planId}>
                        <TableCell className="font-medium">{plan.planNumber}</TableCell>
                        <TableCell>{plan.poNumber || '—'}</TableCell>
                        <TableCell>{plan.productName || '—'}</TableCell>
                        <TableCell>{Number(plan.plannedQty || 0).toLocaleString()}</TableCell>
                        <TableCell>{Number(plan.totalReceivedQty || 0).toLocaleString()}</TableCell>
                        <TableCell>{plan.warehouseName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell>{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canReceive && (
                              <Button variant="ghost" size="icon" onClick={() => handleOpenGrn(plan)} title="Receive Goods (GRN)">
                                <ClipboardCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(plan)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(plan)} title="GRN History">
                              <History className="h-4 w-4" />
                            </Button>
                            {canCancel && (
                              <Button variant="ghost" size="icon" onClick={() => handleCancel(plan)} title="Cancel" disabled={cancelMutation.isPending}>
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {plans.length} of {total} plans
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

      {/* GRN Submission Dialog */}
      <Dialog open={showGrnDialog} onOpenChange={(open) => { if (!open) handleCloseGrnDialog(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Goods Receiving (GRN)</DialogTitle>
          </DialogHeader>
          {grnPlan && (
            <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
              <p><strong>Plan:</strong> {grnPlan.planNumber}</p>
              <p><strong>Product:</strong> {grnPlan.productName}</p>
              <p><strong>Warehouse:</strong> {grnPlan.warehouseName}</p>
              <p><strong>Planned Qty:</strong> {Number(grnPlan.plannedQty || 0).toLocaleString()} | <strong>Received:</strong> {Number(grnPlan.totalReceivedQty || 0).toLocaleString()} | <strong>Balance:</strong> {(Number(grnPlan.plannedQty || 0) - Number(grnPlan.totalReceivedQty || 0)).toLocaleString()}</p>
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grn-receivedQty">Received Qty *</Label>
                <Input id="grn-receivedQty" type="number" min="1" step="any" value={grnForm.receivedQty} onChange={(e) => setGrnForm(f => ({ ...f, receivedQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grn-rejectedQty">Rejected Qty</Label>
                <Input id="grn-rejectedQty" type="number" min="0" step="any" value={grnForm.rejectedQty} onChange={(e) => setGrnForm(f => ({ ...f, rejectedQty: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grn-storageLocation">Storage Location</Label>
              <Input id="grn-storageLocation" value={grnForm.storageLocation} onChange={(e) => setGrnForm(f => ({ ...f, storageLocation: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grn-invoiceNo">Invoice No</Label>
                <Input id="grn-invoiceNo" value={grnForm.invoiceNo} onChange={(e) => setGrnForm(f => ({ ...f, invoiceNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grn-gstInvoiceNo">GST Invoice No</Label>
                <Input id="grn-gstInvoiceNo" value={grnForm.gstInvoiceNo} onChange={(e) => setGrnForm(f => ({ ...f, gstInvoiceNo: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grn-biltyNo">Bilty/LR No</Label>
                <Input id="grn-biltyNo" value={grnForm.biltyNo} onChange={(e) => setGrnForm(f => ({ ...f, biltyNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grn-truckNo">Truck No</Label>
                <Input id="grn-truckNo" value={grnForm.truckNo} onChange={(e) => setGrnForm(f => ({ ...f, truckNo: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grn-driverName">Driver Name</Label>
                <Input id="grn-driverName" value={grnForm.driverName} onChange={(e) => setGrnForm(f => ({ ...f, driverName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grn-driverNo">Driver Phone</Label>
                <Input id="grn-driverNo" value={grnForm.driverNo} onChange={(e) => setGrnForm(f => ({ ...f, driverNo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grn-remarks">Remarks</Label>
              <Input id="grn-remarks" value={grnForm.remarks} onChange={(e) => setGrnForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseGrnDialog}>Cancel</Button>
            <Button onClick={handleSubmitGrn} disabled={grnMutation.isPending}>
              {grnMutation.isPending ? 'Submitting...' : 'Submit GRN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GRN History Dialog */}
      <Dialog open={showGrnHistory} onOpenChange={(open) => { if (!open) { setShowGrnHistory(false); setHistoryPlan(null); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GRN History — {historyPlan?.planNumber}</DialogTitle>
          </DialogHeader>
          {grnHistoryData && Array.isArray(grnHistoryData) && grnHistoryData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grnHistoryData.map((grn: any) => (
                  <TableRow key={grn.grnId}>
                    <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                    <TableCell>{grn.grnDate ? new Date(grn.grnDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{grn.receivedByUsername || '—'}</TableCell>
                    <TableCell>{grn.invoiceNumber || grn.gstInvoiceNo || '—'}</TableCell>
                    <TableCell>{grn.vehicleNumber || '—'}</TableCell>
                    <TableCell><Badge variant="default">{grn.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No GRN records found for this plan</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Edit Receiving Plan' : 'Create Receiving Plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData(f => ({ ...f, productId: e.target.value }))}
                  disabled={!!editPlan}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData(f => ({ ...f, productName: e.target.value }))}
                  disabled={!!editPlan}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse ID *</Label>
                <Input
                  id="warehouseId"
                  value={formData.warehouseId}
                  onChange={(e) => setFormData(f => ({ ...f, warehouseId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouseName">Warehouse Name *</Label>
                <Input
                  id="warehouseName"
                  value={formData.warehouseName}
                  onChange={(e) => setFormData(f => ({ ...f, warehouseName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedQty">Planned Qty *</Label>
              <Input
                id="plannedQty"
                type="number"
                min="1"
                step="any"
                value={formData.plannedQty}
                onChange={(e) => setFormData(f => ({ ...f, plannedQty: e.target.value }))}
              />
            </div>
            {!editPlan && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderId">PO ID</Label>
                  <Input
                    id="purchaseOrderId"
                    value={formData.purchaseOrderId}
                    onChange={(e) => setFormData(f => ({ ...f, purchaseOrderId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => setFormData(f => ({ ...f, poNumber: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
