'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi, inventoryApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, RefreshCw, PackageCheck, Plus, ArrowLeftRight } from 'lucide-react';

const EMPTY_FORM = {
  productionJobId: '',
  requestId: '',
  orderNo: '',
  finalProductId: '',
  finalProductName: '',
  materialId: '',
  materialName: '',
  sourceWarehouseId: '',
  sourceWarehouseName: '',
  productionWarehouseId: '',
  productionWarehouseName: '',
  receivedQty: '',
  usedQty: '',
  returnedQty: '',
  remarks: '',
};

export default function MaterialClosurePage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehouses?.data || [];

  const { data: jobs } = useQuery({
    queryKey: ['production-jobs-list'],
    queryFn: () => productionApi.getJobs({ limit: 200 }),
  });
  const jobList: any[] = (jobs?.data as any)?.data || (jobs?.data as any) || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['material-closures', page, search],
    queryFn: () =>
      productionApi.getMaterialClosures({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const closures = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data: any) => productionApi.createMaterialClosure(data),
    onSuccess: () => {
      toast.success('Material closure created');
      queryClient.invalidateQueries({ queryKey: ['material-closures'] });
      setShowCreateDialog(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create closure');
    },
  });

  const handleCreate = () => {
    if (!form.productionJobId || !form.materialId || !form.materialName) {
      toast.error('Production job, material ID and name are required');
      return;
    }
    const received = Number(form.receivedQty);
    const used = Number(form.usedQty);
    const returned = Number(form.returnedQty || 0);
    if (received < 0 || used < 0 || returned < 0) {
      toast.error('Quantities cannot be negative');
      return;
    }
    if (used + returned > received) {
      toast.error('Used + Returned cannot exceed Received');
      return;
    }
    const srcWh = warehouseList.find((w: any) => w.id === form.sourceWarehouseId);
    const prodWh = warehouseList.find((w: any) => w.id === form.productionWarehouseId);
    createMutation.mutate({
      productionJobId: form.productionJobId,
      requestId: form.requestId || undefined,
      orderNo: form.orderNo || undefined,
      finalProductId: form.finalProductId || undefined,
      finalProductName: form.finalProductName || undefined,
      materialId: form.materialId,
      materialName: form.materialName,
      sourceWarehouseId: form.sourceWarehouseId,
      sourceWarehouseName: srcWh?.name || undefined,
      productionWarehouseId: form.productionWarehouseId,
      productionWarehouseName: prodWh?.name || undefined,
      receivedQty: received,
      usedQty: used,
      returnedQty: returned || undefined,
      remarks: form.remarks || undefined,
    });
  };

  const handleJobSelect = (jobId: string) => {
    const job = jobList.find((j: any) => (j.productionJobId || j.id) === jobId);
    setForm((f) => ({
      ...f,
      productionJobId: jobId,
      orderNo: job?.orderNo || '',
      finalProductId: job?.productId || job?.finalProductId || '',
      finalProductName: job?.productName || job?.finalProductName || '',
      productionWarehouseId: job?.warehouseId || '',
    }));
  };

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Production Material Closure" description="Per-material received/used/returned reconciliation on job close">
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Closure
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><PackageCheck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Closures</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Material Closures</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search closures..."
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
          ) : closures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowLeftRight className="mb-2 h-10 w-10" />
              <p>No material closures found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Closure #</TableHead>
                      <TableHead>Job / Order</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Source WH</TableHead>
                      <TableHead>Production WH</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead className="text-right">Returned</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closures.map((c: any) => {
                      const received = Number(c.receivedQty || 0);
                      const used = Number(c.usedQty || 0);
                      const returned = Number(c.returnedQty || 0);
                      const variance = received - used - returned;
                      return (
                        <TableRow key={c.closureId}>
                          <TableCell className="font-medium whitespace-nowrap">{c.closureNumber}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-xs">{c.orderNo || '—'}</div>
                            <div className="text-xs text-muted-foreground">{c.finalProductName || c.finalProductId || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{c.materialName}</div>
                            <div className="text-xs text-muted-foreground">{c.materialId}</div>
                          </TableCell>
                          <TableCell className="text-xs">{c.sourceWarehouseName || c.sourceWarehouseId || '—'}</TableCell>
                          <TableCell className="text-xs">{c.productionWarehouseName || c.productionWarehouseId || '—'}</TableCell>
                          <TableCell className="text-right">{received.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{used.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{returned.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {variance === 0 ? (
                              <Badge variant="default" className="text-xs">Balanced</Badge>
                            ) : variance > 0 ? (
                              <Badge variant="secondary" className="text-xs text-amber-700">+{variance.toLocaleString()}</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">{variance.toLocaleString()}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs">{c.remarks || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {closures.length} of {total} closures
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

      {/* Create Material Closure Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Material Closure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-semibold">Production Job *</Label>
              <Select value={form.productionJobId} onValueChange={handleJobSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a production job" />
                </SelectTrigger>
                <SelectContent>
                  {jobList.map((j: any) => (
                    <SelectItem key={j.productionJobId || j.id} value={j.productionJobId || j.id}>
                      {j.productionNumber || j.orderNo || j.productionJobId || j.id} — {j.productName || j.productId || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Material ID *</Label>
                <Input value={form.materialId} onChange={(e) => setForm(f => ({ ...f, materialId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Material Name *</Label>
                <Input value={form.materialName} onChange={(e) => setForm(f => ({ ...f, materialName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Source Warehouse *</Label>
                <Select value={form.sourceWarehouseId} onValueChange={(v) => setForm(f => ({ ...f, sourceWarehouseId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Production Warehouse *</Label>
                <Select value={form.productionWarehouseId} onValueChange={(v) => setForm(f => ({ ...f, productionWarehouseId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Received Qty *</Label>
                <Input type="number" min={0} value={form.receivedQty} onChange={(e) => setForm(f => ({ ...f, receivedQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Used Qty *</Label>
                <Input type="number" min={0} value={form.usedQty} onChange={(e) => setForm(f => ({ ...f, usedQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Returned Qty</Label>
                <Input type="number" min={0} value={form.returnedQty} onChange={(e) => setForm(f => ({ ...f, returnedQty: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Remarks</Label>
              <Input value={form.remarks} onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Closure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
