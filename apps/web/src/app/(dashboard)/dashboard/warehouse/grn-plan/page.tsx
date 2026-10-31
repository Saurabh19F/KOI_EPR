'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivingPlanApi, filesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  PackagePlus,
  Search,
  RefreshCw,
  ClipboardCheck,
  History,
  Package,
  TruckIcon,
  Clock,
  CheckCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  partially_received: { label: 'Partial', variant: 'outline' },
  received: { label: 'Received', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
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

export default function WarehouseGrnPlanPage() {
  const { user } = useAuthStore();
  const warehouseId = user?.warehouseId || '';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showGrnDialog, setShowGrnDialog] = useState(false);
  const [grnPlan, setGrnPlan] = useState<any>(null);
  const [grnForm, setGrnForm] = useState(EMPTY_GRN_FORM);
  const [showGrnHistory, setShowGrnHistory] = useState(false);
  const [historyPlan, setHistoryPlan] = useState<any>(null);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [showExtraQtyConfirm, setShowExtraQtyConfirm] = useState(false);
  const [extraQtyInfo, setExtraQtyInfo] = useState<{ balance: number; received: number; percent: number } | null>(null);
  const [showBulkGrnDialog, setShowBulkGrnDialog] = useState(false);
  const [bulkGrnForm, setBulkGrnForm] = useState({ invoiceNo: '', biltyNo: '', truckNo: '', driverName: '', driverNo: '', gstInvoiceNo: '', invoiceImageUrl: '', remarks: '' });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, fieldKey: string): Promise<string> => {
    setUploadingField(fieldKey);
    try {
      const res = await filesApi.getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        moduleName: 'grn',
      });
      const { uploadUrl, publicUrl } = res.data.data;
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      return publicUrl;
    } finally {
      setUploadingField(null);
    }
  }, []);
  const [bulkItems, setBulkItems] = useState<Record<string, { receivedQty: string; rejectedQty: string; storageLocation: string; planNumber: string; productName: string; productId: string; uniqueCode: string; balance: number; vendorName: string; poNumber: string; salesOrderNo: string; vendorCode: string; plannedBy: string; uomName: string; warehouseName: string }>>({});
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warehouse-grn-plans', page, search, status, warehouseId],
    queryFn: () =>
      receivingPlanApi.getPlans({
        page,
        limit: 20,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        warehouseId: warehouseId || undefined,
      }).then((res) => res.data),
  });

  const grnMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => receivingPlanApi.submitGrn(planId, data),
    onSuccess: (res) => {
      toast.success(`GRN ${res.data?.grnNumber || ''} created successfully`);
      queryClient.invalidateQueries({ queryKey: ['warehouse-grn-plans'] });
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
    const balance = Math.max(0, Number(plan.plannedQty || 0) - Number(plan.totalReceivedQty || 0));
    setGrnForm({ ...EMPTY_GRN_FORM, receivedQty: balance > 0 ? String(balance) : '' });
    setShowGrnDialog(true);
  };

  const doSubmitGrn = () => {
    const accepted = Number(grnForm.receivedQty);
    const rejected = Number(grnForm.rejectedQty || 0);
    grnMutation.mutate({
      planId: grnPlan.planId,
      data: {
        receivedQty: accepted + rejected,
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

  const handleSubmitGrn = () => {
    const accepted = Number(grnForm.receivedQty);
    const rejected = Number(grnForm.rejectedQty || 0);
    const totalReceived = accepted + rejected;
    if (totalReceived <= 0) {
      toast.error('Total received quantity must be greater than 0');
      return;
    }
    if (accepted < 0) {
      toast.error('Accepted quantity cannot be negative');
      return;
    }
    const balance = Math.max(0, Number(grnPlan?.plannedQty || 0) - Number(grnPlan?.totalReceivedQty || 0));
    if (balance > 0 && totalReceived > balance * 1.15) {
      const percent = Math.round(((totalReceived - balance) / balance) * 100);
      setExtraQtyInfo({ balance, received: totalReceived, percent });
      setShowExtraQtyConfirm(true);
      return;
    }
    doSubmitGrn();
  };

  const handleOpenHistory = (plan: any) => {
    setHistoryPlan(plan);
    setShowGrnHistory(true);
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlans(prev => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const handleOpenBulkGrn = () => {
    const receivablePlans = plans.filter((p: any) =>
      selectedPlans.has(p.planId) && (p.status === 'pending' || p.status === 'partially_received')
    );
    if (receivablePlans.length === 0) {
      toast.error('Select at least one pending/partial plan');
      return;
    }
    const items: typeof bulkItems = {};
    receivablePlans.forEach((p: any) => {
      const balance = Math.max(0, Number(p.plannedQty || 0) - Number(p.totalReceivedQty || 0));
      items[p.planId] = {
        receivedQty: String(balance),
        rejectedQty: '',
        storageLocation: '',
        planNumber: p.planNumber || '',
        productName: p.productName || '',
        productId: p.productId || p.uniqueCode || '',
        uniqueCode: p.uniqueCode || '',
        balance,
        vendorName: p.vendorName || '',
        poNumber: p.poNumber || '',
        salesOrderNo: p.salesOrderNo || '',
        vendorCode: p.vendorCode || '',
        plannedBy: p.plannedBy || '',
        uomName: p.uomName || '',
        warehouseName: p.warehouseName || '',
      };
    });
    setBulkItems(items);
    setBulkGrnForm({ invoiceNo: '', biltyNo: '', truckNo: '', driverName: '', driverNo: '', gstInvoiceNo: '', invoiceImageUrl: '', remarks: '' });
    setShowBulkGrnDialog(true);
  };

  const bulkGrnMutation = useMutation({
    mutationFn: (data: any) => receivingPlanApi.bulkGrn(data),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Bulk GRN submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-grn-plans'] });
      setShowBulkGrnDialog(false);
      setSelectedPlans(new Set());
      setBulkItems({});
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Bulk GRN failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const handleSubmitBulkGrn = () => {
    const itemsArray = Object.entries(bulkItems).map(([planId, item]) => {
      const accepted = Number(item.receivedQty);
      const rejected = Number(item.rejectedQty || 0);
      return {
        planId,
        productId: item.productId,
        itemDescription: item.productName,
        receivedQty: accepted + rejected,
        rejectedQty: rejected || undefined,
        storageLocation: item.storageLocation || undefined,
      };
    }).filter(i => i.receivedQty > 0);

    if (itemsArray.length === 0) {
      toast.error('At least one item must have received qty > 0');
      return;
    }

    const overItems = Object.entries(bulkItems).filter(([, item]) => {
      const bal = item.balance;
      const accepted = Number(item.receivedQty);
      const rejected = Number(item.rejectedQty || 0);
      const totalReceived = accepted + rejected;
      return bal > 0 && totalReceived > bal * 1.15;
    });
    if (overItems.length > 0) {
      const names = overItems.map(([, item]) => item.productName).join(', ');
      if (!window.confirm(`Extra Qty Warning (>15%): ${names}. Proceed?`)) return;
    }

    bulkGrnMutation.mutate({
      ...bulkGrnForm,
      invoiceImageUrl: bulkGrnForm.invoiceImageUrl || undefined,
      items: itemsArray,
    });
  };

  const plans = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const pendingCount = plans.filter((p: any) => p.status === 'pending').length;
  const partialCount = plans.filter((p: any) => p.status === 'partially_received').length;
  const receivedCount = plans.filter((p: any) => p.status === 'received').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbound GRN Plan</h1>
          <p className="text-muted-foreground">
            Receiving plans assigned to your warehouse — receive goods against planned quantities
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPlans.size > 0 && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleOpenBulkGrn}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Bulk GRN ({selectedPlans.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!warehouseId && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800">
              No warehouse is assigned to your account. All receiving plans are shown. Contact your admin to assign a warehouse.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Package className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
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
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2"><TruckIcon className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Partially Received</p>
                <p className="text-2xl font-bold">{partialCount}</p>
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
                <p className="text-2xl font-bold">{receivedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>GRN Plan List</CardTitle>
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
              <p>No receiving plans found for your warehouse</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={plans.filter((p: any) => p.status === 'pending' || p.status === 'partially_received').length > 0 && plans.filter((p: any) => p.status === 'pending' || p.status === 'partially_received').every((p: any) => selectedPlans.has(p.planId))}
                        onCheckedChange={(checked) => {
                          const receivable = plans.filter((p: any) => p.status === 'pending' || p.status === 'partially_received');
                          if (checked) {
                            setSelectedPlans(new Set(receivable.map((p: any) => p.planId)));
                          } else {
                            setSelectedPlans(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Item Desc.</TableHead>
                    <TableHead>Unique Code</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Last Edit Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan: any) => {
                    const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.pending;
                    const canReceive = plan.status === 'pending' || plan.status === 'partially_received';
                    const planned = Number(plan.plannedQty || 0);
                    const received = Number(plan.totalReceivedQty || 0);
                    const balance = Math.max(0, planned - received);
                    return (
                      <TableRow key={plan.planId}>
                        <TableCell>
                          {canReceive && (
                            <Checkbox
                              checked={selectedPlans.has(plan.planId)}
                              onCheckedChange={() => togglePlanSelection(plan.planId)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {plan.planNumber}
                          {plan.status === 'partially_received' && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1">p/r</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{plan.poNumber || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{plan.salesOrderNo || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={plan.productName}>{plan.productName || '—'}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground" title={plan.uniqueCode}>{plan.uniqueCode || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{plan.vendorName || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {plan.expectedDate ? new Date(plan.expectedDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">{planned.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{received.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {balance > 0 ? (
                            <span className="text-green-600">{balance.toLocaleString()}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </TableCell>
                        <TableCell>{plan.uomName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {canReceive ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleOpenGrn(plan)}
                            >
                              Receive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenHistory(plan)}
                            >
                              History
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
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
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-bold text-center">Goods Receipt Note (GRN)</h2>
          </div>

          {grnPlan && (
            <div className="px-6 space-y-4">
              {/* Header Info */}
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order No (Sales Order):</p>
                    <p className="font-semibold text-primary">{grnPlan.salesOrderNo || grnPlan.poNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor Name:</p>
                    <p className="font-bold">{grnPlan.vendorName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor Code:</p>
                    <p className="font-medium">{grnPlan.vendorCode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Buyer Code:</p>
                    <p className="font-semibold">{grnPlan.vendorCode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchaser Name (Sourcing):</p>
                    <p className="font-medium text-primary">{grnPlan.plannedBy || user?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Planned By (Planner):</p>
                    <p className="font-medium">{grnPlan.plannedBy || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Cargo Transport Parameters */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase">Cargo Transport Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grn-invoiceNo" className="font-semibold">Invoice No. *</Label>
                    <Input id="grn-invoiceNo" placeholder="Enter Invoice No" value={grnForm.invoiceNo} onChange={(e) => setGrnForm(f => ({ ...f, invoiceNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grn-gstInvoiceNo" className="font-semibold">GST Invoice No. / GSTIN *</Label>
                    <div className="flex gap-2">
                      <Input id="grn-gstInvoiceNo" placeholder="E.G.  07AAAAA0000A1Z5" value={grnForm.gstInvoiceNo} onChange={(e) => setGrnForm(f => ({ ...f, gstInvoiceNo: e.target.value }))} />
                      <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">✓ Verify GST</Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grn-biltyNo" className="font-semibold">Bilty (LR) No. *</Label>
                    <Input id="grn-biltyNo" placeholder="Enter LR No" value={grnForm.biltyNo} onChange={(e) => setGrnForm(f => ({ ...f, biltyNo: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grn-truckNo" className="font-semibold">Truck Vehicle No. *</Label>
                    <Input id="grn-truckNo" placeholder="e.g. MH-04-AB-1234" value={grnForm.truckNo} onChange={(e) => setGrnForm(f => ({ ...f, truckNo: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grn-driverName" className="font-semibold">Driver Name *</Label>
                    <Input id="grn-driverName" placeholder="Driver Full Name" value={grnForm.driverName} onChange={(e) => setGrnForm(f => ({ ...f, driverName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grn-driverNo" className="font-semibold">Driver Phone *</Label>
                    <Input id="grn-driverNo" placeholder="Mobile Number" value={grnForm.driverNo} onChange={(e) => setGrnForm(f => ({ ...f, driverNo: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold uppercase text-xs">Freight Invoice Image *</Label>
                  <Input type="file" accept="image/*,.pdf" disabled={uploadingField === 'grn-invoice'} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadFile(file, 'grn-invoice');
                      setGrnForm(f => ({ ...f, invoiceImageUrl: url }));
                      toast.success('Invoice image uploaded');
                    } catch {
                      toast.error('Failed to upload invoice image');
                    }
                  }} />
                  {uploadingField === 'grn-invoice' && <p className="text-xs text-blue-600">Uploading...</p>}
                  {grnForm.invoiceImageUrl && uploadingField !== 'grn-invoice' && (
                    <p className="text-xs text-green-600 truncate">Uploaded</p>
                  )}
                </div>
              </div>

              {/* Physical Quality Validation */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-primary uppercase">Physical Quality Validation</h3>
                  <span className="text-sm text-muted-foreground">PLAN: {grnPlan.planNumber}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Item:</strong> {grnPlan.productName} ({grnPlan.uniqueCode || grnPlan.productId})</p>
                  <p><strong>Balance Due:</strong>{' '}
                    <span className="text-green-600 font-semibold">
                      {Math.max(0, Number(grnPlan.plannedQty || 0) - Number(grnPlan.totalReceivedQty || 0)).toLocaleString()} {grnPlan.uomName || ''}
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grn-receivedQty" className="font-semibold">Accepted Qty *</Label>
                    <Input id="grn-receivedQty" type="number" min="1" step="any" value={grnForm.receivedQty} onChange={(e) => setGrnForm(f => ({ ...f, receivedQty: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grn-rejectedQty" className="font-semibold">Rejected/Return Qty</Label>
                    <Input id="grn-rejectedQty" type="number" min="0" step="any" value={grnForm.rejectedQty} onChange={(e) => {
                      const rej = Number(e.target.value) || 0;
                      const balance = Math.max(0, Number(grnPlan?.plannedQty || 0) - Number(grnPlan?.totalReceivedQty || 0));
                      const newAccepted = Math.max(0, balance - rej);
                      setGrnForm(f => ({ ...f, rejectedQty: e.target.value, receivedQty: String(newAccepted) }));
                    }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grn-storageLocation" className="font-semibold">Initial Storage Bin</Label>
                    <Input id="grn-storageLocation" placeholder="Inward-Staging" value={grnForm.storageLocation} onChange={(e) => setGrnForm(f => ({ ...f, storageLocation: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Item Attachments / Photos</Label>
                    <Input type="file" accept="image/*,.pdf" disabled={uploadingField === 'grn-item'} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadFile(file, 'grn-item');
                        setGrnForm(f => ({ ...f, itemImageUrl: url }));
                        toast.success('Item image uploaded');
                      } catch {
                        toast.error('Failed to upload item image');
                      }
                    }} />
                    {uploadingField === 'grn-item' && <p className="text-xs text-blue-600">Uploading...</p>}
                    {grnForm.itemImageUrl && uploadingField !== 'grn-item' && (
                      <p className="text-xs text-green-600 truncate">Uploaded</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grn-remarks" className="font-semibold">Operation Remarks</Label>
                  <Input id="grn-remarks" placeholder="Enter quality or condition notes..." value={grnForm.remarks} onChange={(e) => setGrnForm(f => ({ ...f, remarks: e.target.value }))} />
                </div>
                <div className="text-sm">
                  <p className="text-red-600 font-semibold">Verified / Checked By:</p>
                  <p className="text-primary font-medium">{grnPlan.warehouseName} - {user?.name || '—'}</p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-center gap-4 pb-6 pt-2">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={handleSubmitGrn}
                  disabled={grnMutation.isPending}
                >
                  {grnMutation.isPending ? 'Submitting...' : 'Authorize GRN Receipt'}
                </Button>
                <Button size="lg" variant="secondary" className="px-8" onClick={handleCloseGrnDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
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

      {/* Bulk GRN Dialog */}
      <Dialog open={showBulkGrnDialog} onOpenChange={(open) => { if (!open) setShowBulkGrnDialog(false); }}>
        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto p-0">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-bold text-center">Goods Receipt Note (GRN)</h2>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Bulk Receive — {Object.keys(bulkItems).length} items
            </p>
          </div>

          <div className="px-6 space-y-4">
            {/* Cargo Transport Parameters */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-bold text-sm text-primary uppercase">Cargo Transport Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Invoice No. *</Label>
                  <Input placeholder="Enter Invoice No" value={bulkGrnForm.invoiceNo} onChange={(e) => setBulkGrnForm(f => ({ ...f, invoiceNo: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">GST Invoice No. / GSTIN *</Label>
                  <div className="flex gap-2">
                    <Input placeholder="E.G. 07AAAAA0000A1Z5" value={bulkGrnForm.gstInvoiceNo} onChange={(e) => setBulkGrnForm(f => ({ ...f, gstInvoiceNo: e.target.value }))} />
                    <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">✓ Verify GST</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Bilty (LR) No. *</Label>
                  <Input placeholder="Enter LR No" value={bulkGrnForm.biltyNo} onChange={(e) => setBulkGrnForm(f => ({ ...f, biltyNo: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Truck Vehicle No. *</Label>
                  <Input placeholder="e.g. MH-04-AB-1234" value={bulkGrnForm.truckNo} onChange={(e) => setBulkGrnForm(f => ({ ...f, truckNo: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Driver Name *</Label>
                  <Input placeholder="Driver Full Name" value={bulkGrnForm.driverName} onChange={(e) => setBulkGrnForm(f => ({ ...f, driverName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Driver Phone *</Label>
                  <Input placeholder="Mobile Number" value={bulkGrnForm.driverNo} onChange={(e) => setBulkGrnForm(f => ({ ...f, driverNo: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold uppercase text-xs">Freight Invoice Image *</Label>
                <Input type="file" accept="image/*,.pdf" disabled={uploadingField === 'bulk-invoice'} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadFile(file, 'bulk-invoice');
                    setBulkGrnForm(f => ({ ...f, invoiceImageUrl: url }));
                    toast.success('Invoice image uploaded');
                  } catch {
                    toast.error('Failed to upload invoice image');
                  }
                }} />
                {uploadingField === 'bulk-invoice' && <p className="text-xs text-blue-600">Uploading...</p>}
                {bulkGrnForm.invoiceImageUrl && uploadingField !== 'bulk-invoice' && (
                  <p className="text-xs text-green-600 truncate">Uploaded</p>
                )}
              </div>
            </div>

            {/* Physical Quality Validation — Per Item */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-primary uppercase">
                  Physical Quality Validation ({Object.keys(bulkItems).length} Items Selected)
                </h3>
                <span className="font-bold text-sm text-primary uppercase">
                  Target WH: {Object.values(bulkItems)[0]?.warehouseName || '—'}
                </span>
              </div>

              {Object.entries(bulkItems).map(([planId, item], index) => (
                <div key={planId} className="rounded-lg border bg-slate-50/60 p-5 space-y-4">
                  {/* Item header row */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-primary">
                      ITEM #{index + 1} - PLAN: {item.planNumber}
                    </p>
                    <Badge variant="outline" className="text-xs font-semibold border-primary text-primary px-3 py-1">
                      PO: {item.poNumber || '—'}
                    </Badge>
                  </div>

                  {/* Item details grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Item Description:</p>
                      <p className="font-bold">{item.productName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Order No / Code:</p>
                      <p className="font-semibold">{item.salesOrderNo || item.poNumber || '—'} ({item.uniqueCode || item.productId})</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance Due:</p>
                      <p className="font-bold text-green-600 text-lg">{item.balance.toLocaleString()} {item.uomName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchaser / Planner:</p>
                      <p className="font-medium">{item.plannedBy || '—'}</p>
                    </div>
                  </div>

                  {/* Qty fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Accepted Qty *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.balance}
                        className="text-green-600 font-semibold"
                        value={item.receivedQty}
                        onChange={(e) => setBulkItems(prev => ({ ...prev, [planId]: { ...prev[planId], receivedQty: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Rejected Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        className="text-red-500"
                        value={item.rejectedQty}
                        onChange={(e) => {
                          const rej = Number(e.target.value) || 0;
                          const bal = item.balance;
                          const newAccepted = Math.max(0, bal - rej);
                          setBulkItems(prev => ({ ...prev, [planId]: { ...prev[planId], rejectedQty: e.target.value, receivedQty: String(newAccepted) } }));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Initial Storage Bin</Label>
                      <Input
                        placeholder="Inward-Staging"
                        value={item.storageLocation}
                        onChange={(e) => setBulkItems(prev => ({ ...prev, [planId]: { ...prev[planId], storageLocation: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Remarks & Verified By */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="space-y-2">
                <Label className="font-semibold">Operation Remarks</Label>
                <Input placeholder="Enter quality or condition notes..." value={bulkGrnForm.remarks} onChange={(e) => setBulkGrnForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div className="text-sm">
                <p className="text-red-600 font-semibold">Verified / Checked By:</p>
                <p className="text-primary font-medium">{Object.values(bulkItems)[0]?.warehouseName || ''} - {user?.name || '—'}</p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-center gap-4 pb-6 pt-2">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={handleSubmitBulkGrn}
                disabled={bulkGrnMutation.isPending}
              >
                {bulkGrnMutation.isPending ? 'Submitting...' : `Authorize Bulk GRN (${Object.keys(bulkItems).length} items)`}
              </Button>
              <Button size="lg" variant="secondary" className="px-8" onClick={() => setShowBulkGrnDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra Qty Tolerance Confirmation Dialog (>15%) */}
      <Dialog open={showExtraQtyConfirm} onOpenChange={(open) => { if (!open) { setShowExtraQtyConfirm(false); setExtraQtyInfo(null); } }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-amber-600">Extra Quantity Warning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Received quantity exceeds planned balance by <span className="font-bold">{extraQtyInfo?.percent}%</span> (threshold: 15%)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Balance Due:</p>
                  <p className="font-bold">{extraQtyInfo?.balance?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Received Qty:</p>
                  <p className="font-bold text-amber-700">{extraQtyInfo?.received?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This extra quantity requires approval. Do you want to proceed with this GRN?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowExtraQtyConfirm(false); setExtraQtyInfo(null); }}>
              Cancel
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
              setShowExtraQtyConfirm(false);
              setExtraQtyInfo(null);
              doSubmitGrn();
            }}>
              Approve Extra Qty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
