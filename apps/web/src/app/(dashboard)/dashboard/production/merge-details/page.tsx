'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Search, RefreshCw, Plus, Merge, Package } from 'lucide-react';

const EMPTY_FORM = {
  productionJobId: '',
  orderNo: '',
  finalProductId: '',
  finalProductName: '',
  mergedItemId: '',
  mergedItemName: '',
  mergedQty: '',
  uom: '',
  workDetails: '',
  entryDate: new Date().toISOString().split('T')[0],
  remarks: '',
};

export default function MergeDetailsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ['production-jobs-list'],
    queryFn: () => productionApi.getJobs({ limit: 200 }),
  });
  const jobList: any[] = (jobs?.data as any)?.data || (jobs?.data as any) || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['merge-details', page, search],
    queryFn: () =>
      productionApi.getMergeDetails({
        page,
        limit: 20,
        search: search || undefined,
      }).then((res) => res.data),
  });

  const mergeDetails = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data: any) => productionApi.createMergeDetail(data),
    onSuccess: () => {
      toast.success('Merge detail created');
      queryClient.invalidateQueries({ queryKey: ['merge-details'] });
      setShowCreateDialog(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create merge detail');
    },
  });

  const handleCreate = () => {
    if (!form.productionJobId || !form.mergedItemId || !form.mergedItemName) {
      toast.error('Production job, merged item ID and name are required');
      return;
    }
    const qty = Number(form.mergedQty);
    if (!qty || qty <= 0) {
      toast.error('Merged quantity must be greater than zero');
      return;
    }
    createMutation.mutate({
      productionJobId: form.productionJobId,
      orderNo: form.orderNo || undefined,
      finalProductId: form.finalProductId || undefined,
      finalProductName: form.finalProductName || undefined,
      mergedItemId: form.mergedItemId,
      mergedItemName: form.mergedItemName,
      mergedQty: qty,
      uom: form.uom || undefined,
      workDetails: form.workDetails || undefined,
      entryDate: form.entryDate || undefined,
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
    }));
  };

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Production Merge Details" description="Track merged items, quantities, and work details per production job">
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Merge Detail
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2"><Merge className="h-5 w-5 text-indigo-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Merge Records</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Package className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Merged Qty</p>
                <p className="text-2xl font-bold">
                  {mergeDetails.reduce((sum: number, m: any) => sum + Number(m.mergedQty || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Merge Details</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search merge details..."
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
          ) : mergeDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Merge className="mb-2 h-10 w-10" />
              <p>No merge details found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merge #</TableHead>
                      <TableHead>Job / Order</TableHead>
                      <TableHead>Final Product</TableHead>
                      <TableHead>Merged Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Work Details</TableHead>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergeDetails.map((m: any) => (
                      <TableRow key={m.mergeId}>
                        <TableCell className="font-medium whitespace-nowrap">{m.mergeNumber}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-xs">{m.orderNo || '—'}</div>
                          <div className="text-xs text-muted-foreground">{m.productionJobId?.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{m.finalProductName || m.finalProductId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{m.mergedItemName}</div>
                          <div className="text-xs text-muted-foreground">{m.mergedItemId}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(m.mergedQty || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs">{m.uom || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{m.workDetails || '—'}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {m.entryDate ? new Date(m.entryDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs">{m.remarks || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {mergeDetails.length} of {total} records
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

      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Merge Detail</DialogTitle>
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
                <Label className="font-semibold">Merged Item ID *</Label>
                <Input value={form.mergedItemId} onChange={(e) => setForm(f => ({ ...f, mergedItemId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Merged Item Name *</Label>
                <Input value={form.mergedItemName} onChange={(e) => setForm(f => ({ ...f, mergedItemName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">Merged Qty *</Label>
                <Input type="number" min={0} value={form.mergedQty} onChange={(e) => setForm(f => ({ ...f, mergedQty: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">UOM</Label>
                <Input value={form.uom} onChange={(e) => setForm(f => ({ ...f, uom: e.target.value }))} placeholder="e.g. KG, PCS" />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Entry Date</Label>
                <Input type="date" value={form.entryDate} onChange={(e) => setForm(f => ({ ...f, entryDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Work Details</Label>
              <Input value={form.workDetails} onChange={(e) => setForm(f => ({ ...f, workDetails: e.target.value }))} placeholder="Describe the merge work performed" />
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
              {createMutation.isPending ? 'Creating...' : 'Create Merge Detail'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
