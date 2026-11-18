'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi, qualityApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Search, RefreshCw, ClipboardCheck, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ProductionQCPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('completed');

  const [inspectJob, setInspectJob] = useState<any>(null);
  const [decision, setDecision] = useState<string>('');
  const [qtyApproved, setQtyApproved] = useState('');
  const [qtyRejected, setQtyRejected] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['production-qc-jobs', page, search, statusFilter],
    queryFn: () =>
      productionApi.getJobs({
        page,
        limit: 25,
        search: search || undefined,
        status: statusFilter || undefined,
      }).then((res) => res.data),
  });

  const jobs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const createInspectionMutation = useMutation({
    mutationFn: (data: any) => qualityApi.createInspection(data),
    onSuccess: () => {
      toast.success('QC inspection recorded');
      queryClient.invalidateQueries({ queryKey: ['production-qc-jobs'] });
      closeInspectDialog();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit inspection');
    },
  });

  const openInspectDialog = (job: any) => {
    setInspectJob(job);
    setDecision('');
    setQtyApproved(String(job.finalProducedQty || job.plannedProductionQty || 0));
    setQtyRejected('0');
    setReason('');
    setRemarks('');
  };

  const closeInspectDialog = () => {
    setInspectJob(null);
    setDecision('');
    setQtyApproved('');
    setQtyRejected('');
    setReason('');
    setRemarks('');
  };

  const handleSubmitQC = () => {
    if (!inspectJob || !decision) {
      toast.error('Select approve or reject');
      return;
    }
    const approved = Number(qtyApproved) || 0;
    const rejected = Number(qtyRejected) || 0;

    if (decision === 'rejected' && !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    createInspectionMutation.mutate({
      sourceModule: 'production',
      sourceId: inspectJob.id,
      productId: inspectJob.productId,
      productName: inspectJob.productName,
      warehouseId: inspectJob.warehouseId,
      batchNo: inspectJob.batchNo || undefined,
      inspectedQty: approved + rejected,
      qtyApproved: approved,
      qtyRejected: rejected,
      decision,
      reason: reason || undefined,
      remarks: remarks || undefined,
      inspectedBy: user?.name || user?.email,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <WorkspacePageHeader title="Production QC" description="Quality inspection of finished goods from production">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed Jobs</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="all">All Statuses</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 w-[240px]"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="mb-2 h-10 w-10" />
              <p>No production jobs found for QC</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Produced Qty</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-sm">{job.orderNo || '—'}</TableCell>
                      <TableCell className="text-sm">{job.productName || '—'}</TableCell>
                      <TableCell className="text-sm">{job.batchNo || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{job.finalProducedQty ?? job.plannedProductionQty ?? '—'}</TableCell>
                      <TableCell className="text-sm">{job.warehouseName || '—'}</TableCell>
                      <TableCell>
                        <Badge className={
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {job.status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => openInspectDialog(job)}>
                          <Eye className="h-3 w-3 mr-1" /> Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} jobs)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!inspectJob} onOpenChange={() => closeInspectDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Production QC Inspection</DialogTitle>
          </DialogHeader>
          {inspectJob && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <p><span className="font-medium">Product:</span> {inspectJob.productName}</p>
                <p><span className="font-medium">Order:</span> {inspectJob.orderNo || '—'}</p>
                <p><span className="font-medium">Batch:</span> {inspectJob.batchNo || '—'}</p>
                <p><span className="font-medium">Produced Qty:</span> {inspectJob.finalProducedQty ?? inspectJob.plannedProductionQty}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Qty Approved</Label>
                  <Input type="number" min="0" value={qtyApproved} onChange={(e) => setQtyApproved(e.target.value)} className="bg-yellow-50" />
                </div>
                <div>
                  <Label className="text-sm">Qty Rejected</Label>
                  <Input type="number" min="0" value={qtyRejected} onChange={(e) => setQtyRejected(e.target.value)} className="bg-yellow-50" />
                </div>
              </div>

              <div>
                <Label className="text-sm">Decision</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={decision === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    className={decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setDecision('approved')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    variant={decision === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    className={decision === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setDecision('rejected')}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>

              {decision === 'rejected' && (
                <div>
                  <Label className="text-sm">Rejection Reason <span className="text-red-500">*</span></Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Specify reason for rejection..." className="bg-yellow-50" />
                </div>
              )}

              <div>
                <Label className="text-sm">Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeInspectDialog}>Cancel</Button>
            <Button onClick={handleSubmitQC} disabled={!decision || createInspectionMutation.isPending}>
              {createInspectionMutation.isPending ? 'Submitting...' : 'Submit QC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
