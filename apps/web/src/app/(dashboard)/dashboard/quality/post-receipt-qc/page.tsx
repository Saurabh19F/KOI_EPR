'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualityApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, RefreshCw, Clock, AlertTriangle, CheckCircle, ClipboardCheck, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function getUrgency(dateRequested: string): { label: string; className: string } {
  const requested = new Date(dateRequested);
  const now = new Date();
  const elapsed = now.getTime() - requested.getTime();
  const hoursLeft = (TWO_DAYS_MS - elapsed) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return { label: 'Overdue', className: 'bg-red-100 text-red-800' };
  if (hoursLeft <= 12) return { label: `${Math.round(hoursLeft)}h left`, className: 'bg-orange-100 text-orange-800' };
  if (hoursLeft <= 24) return { label: `${Math.round(hoursLeft)}h left`, className: 'bg-amber-100 text-amber-800' };
  return { label: `${Math.round(hoursLeft)}h left`, className: 'bg-green-100 text-green-800' };
}

export default function PostReceiptQCPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const [inspectDialog, setInspectDialog] = useState<any>(null);
  const [decision, setDecision] = useState<string>('');
  const [qtyApproved, setQtyApproved] = useState<string>('');
  const [qtyRejected, setQtyRejected] = useState<string>('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['post-receipt-qc', page, search, statusFilter],
    queryFn: () =>
      qualityApi.getInspections({
        page,
        limit: 25,
        search: search || undefined,
        status: statusFilter || undefined,
      }).then((res) => res.data),
  });

  const inspections = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      qualityApi.updateInspection(id, data),
    onSuccess: () => {
      toast.success('Inspection updated');
      queryClient.invalidateQueries({ queryKey: ['post-receipt-qc'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update inspection');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => qualityApi.completeInspection(id),
    onSuccess: () => {
      toast.success('Inspection completed successfully');
      queryClient.invalidateQueries({ queryKey: ['post-receipt-qc'] });
      setInspectDialog(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to complete inspection');
    },
  });

  const openInspectDialog = (insp: any) => {
    setInspectDialog(insp);
    setDecision(insp.decision || '');
    setQtyApproved(String(Number(insp.qtyApproved || 0)));
    setQtyRejected(String(Number(insp.qtyRejected || 0)));
    setReason(insp.reason || '');
    setRemarks(insp.remarks || '');
  };

  const handleQuickDecision = (type: 'approve' | 'reject') => {
    if (!inspectDialog) return;
    const qty = Number(inspectDialog.qtyToInspect);
    if (type === 'approve') {
      setDecision('approved');
      setQtyApproved(String(qty));
      setQtyRejected('0');
    } else {
      setDecision('rejected');
      setQtyApproved('0');
      setQtyRejected(String(qty));
    }
  };

  const handleSaveAndComplete = async () => {
    if (!inspectDialog) return;
    const approved = Number(qtyApproved) || 0;
    const rejected = Number(qtyRejected) || 0;

    if (!decision) {
      toast.error('Please select a decision');
      return;
    }
    if (approved + rejected === 0) {
      toast.error('Enter approved or rejected quantity');
      return;
    }

    try {
      await qualityApi.updateInspection(inspectDialog.qcId, {
        decision,
        qtyApproved: approved,
        qtyRejected: rejected,
        reason: reason || undefined,
        remarks: remarks || undefined,
        inspectionDate: new Date().toISOString(),
        checkedBy: user?.name || user?.email || '',
        checkedByUserId: user?.userId || '',
      });

      await completeMutation.mutateAsync(inspectDialog.qcId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save inspection');
    }
  };

  const handleSaveDraft = async () => {
    if (!inspectDialog) return;
    const approved = Number(qtyApproved) || 0;
    const rejected = Number(qtyRejected) || 0;

    updateMutation.mutate({
      id: inspectDialog.qcId,
      data: {
        decision: decision || undefined,
        qtyApproved: approved,
        qtyRejected: rejected,
        reason: reason || undefined,
        remarks: remarks || undefined,
        inspectionDate: new Date().toISOString(),
        checkedBy: user?.name || user?.email || '',
        checkedByUserId: user?.userId || '',
      },
    });
    setInspectDialog(null);
  };

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let pending = 0;
    for (const insp of inspections) {
      if (insp.status === 'pending' || insp.status === 'in_progress') {
        pending++;
        const elapsed = Date.now() - new Date(insp.dateRequested).getTime();
        if (elapsed >= TWO_DAYS_MS) overdue++;
        else if (elapsed >= TWO_DAYS_MS - 12 * 60 * 60 * 1000) dueSoon++;
      }
    }
    return { overdue, dueSoon, pending };
  }, [inspections]);

  return (
    <div className="space-y-6">
      <WorkspacePageHeader title="Post-Receipt QC" description="All GRN items arrive here for quality inspection — Accept or Reject each item">
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </WorkspacePageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><ClipboardCheck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Inspections</p>
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
                <p className="text-sm text-muted-foreground">Pending Inspection</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue (&gt;48h)</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Qty to Inspect</p>
                <p className="text-2xl font-bold">
                  {inspections.reduce((sum: number, i: any) => sum + Number(i.qtyToInspect || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>GRN Quality Inspections</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search product or QC#..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[220px]"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {['pending', 'in_progress', 'completed', 'cancelled', ''].map((s) => (
                  <Button
                    key={s || 'all'}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                  >
                    {s ? s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="mb-2 h-10 w-10" />
              <p>No inspections found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>QC #</TableHead>
                      <TableHead>GRN #</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead className="text-right">Qty to Inspect</TableHead>
                      <TableHead className="text-right text-green-700">Approved</TableHead>
                      <TableHead className="text-right text-red-700">Rejected</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((insp: any) => {
                      const urgency = (insp.status === 'pending' || insp.status === 'in_progress')
                        ? getUrgency(insp.dateRequested)
                        : null;
                      const isPending = insp.status === 'pending' || insp.status === 'in_progress';
                      return (
                        <TableRow key={insp.qcId} className={isPending ? 'bg-yellow-50/50' : ''}>
                          <TableCell className="font-medium text-xs whitespace-nowrap">{insp.qcNumber}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{insp.grnNumber || '—'}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{insp.productName || '—'}</div>
                            {insp.sku && <div className="text-xs text-muted-foreground">SKU: {insp.sku}</div>}
                          </TableCell>
                          <TableCell className="text-xs">{insp.warehouseName || '—'}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {insp.dateRequested ? new Date(insp.dateRequested).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            {urgency ? (
                              <Badge className={`text-xs ${urgency.className}`}>{urgency.label}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">{Number(insp.qtyToInspect || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm text-green-600 font-medium">{Number(insp.qtyApproved || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm text-red-600 font-medium">{Number(insp.qtyRejected || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            {insp.decision ? (
                              <Badge variant={
                                insp.decision === 'approved' ? 'default' :
                                insp.decision === 'rejected' ? 'destructive' :
                                'secondary'
                              } className="text-xs">
                                {insp.decision === 'approved' ? 'Accepted' :
                                 insp.decision === 'rejected' ? 'Rejected' :
                                 insp.decision === 'partially_approved' ? 'Partial' :
                                 insp.decision}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              insp.status === 'completed' ? 'default' :
                              insp.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            } className="text-xs">
                              {insp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isPending ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openInspectDialog(insp)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Inspect
                              </Button>
                            ) : insp.status === 'completed' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openInspectDialog(insp)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {inspections.length} of {total} inspections
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

      {/* Inspection Dialog */}
      <Dialog open={!!inspectDialog} onOpenChange={(open) => { if (!open) setInspectDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {inspectDialog?.status === 'completed' ? 'Inspection Details' : 'Quality Inspection'}
            </DialogTitle>
          </DialogHeader>

          {inspectDialog && (
            <div className="space-y-4">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <span className="text-muted-foreground">QC #:</span>{' '}
                  <span className="font-medium">{inspectDialog.qcNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GRN #:</span>{' '}
                  <span className="font-medium">{inspectDialog.grnNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Product:</span>{' '}
                  <span className="font-medium">{inspectDialog.productName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Warehouse:</span>{' '}
                  <span className="font-medium">{inspectDialog.warehouseName}</span>
                </div>
                {inspectDialog.sku && (
                  <div>
                    <span className="text-muted-foreground">SKU:</span>{' '}
                    <span className="font-medium">{inspectDialog.sku}</span>
                  </div>
                )}
                {inspectDialog.batchNumber && (
                  <div>
                    <span className="text-muted-foreground">Batch:</span>{' '}
                    <span className="font-medium">{inspectDialog.batchNumber}</span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">Qty to Inspect:</span>{' '}
                  <span className="text-lg font-bold">{Number(inspectDialog.qtyToInspect).toLocaleString()}</span>
                </div>
              </div>

              {inspectDialog.status !== 'completed' && inspectDialog.status !== 'cancelled' ? (
                <>
                  {/* Quick Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleQuickDecision('approve')}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Accept All ({Number(inspectDialog.qtyToInspect).toLocaleString()})
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => handleQuickDecision('reject')}
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject All ({Number(inspectDialog.qtyToInspect).toLocaleString()})
                    </Button>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">or set partial quantities below</div>

                  {/* Decision */}
                  <div>
                    <Label>Decision</Label>
                    <Select value={decision} onValueChange={setDecision}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="partially_approved">Partially Accepted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantities */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-green-700">Accepted Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        max={Number(inspectDialog.qtyToInspect)}
                        value={qtyApproved}
                        onChange={(e) => {
                          setQtyApproved(e.target.value);
                          const approved = Number(e.target.value) || 0;
                          const total = Number(inspectDialog.qtyToInspect);
                          setQtyRejected(String(Math.max(0, total - approved)));
                          if (approved === total) setDecision('approved');
                          else if (approved === 0) setDecision('rejected');
                          else setDecision('partially_approved');
                        }}
                        style={{ backgroundColor: '#fcfeff' }}
                      />
                    </div>
                    <div>
                      <Label className="text-red-700">Rejected Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        max={Number(inspectDialog.qtyToInspect)}
                        value={qtyRejected}
                        onChange={(e) => {
                          setQtyRejected(e.target.value);
                          const rejected = Number(e.target.value) || 0;
                          const total = Number(inspectDialog.qtyToInspect);
                          setQtyApproved(String(Math.max(0, total - rejected)));
                          if (rejected === total) setDecision('rejected');
                          else if (rejected === 0) setDecision('approved');
                          else setDecision('partially_approved');
                        }}
                        style={{ backgroundColor: '#fcfeff' }}
                      />
                    </div>
                  </div>

                  {/* Reason (required for reject) */}
                  {(decision === 'rejected' || decision === 'partially_approved') && (
                    <div>
                      <Label>Reason for Rejection *</Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <Label>Remarks</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                /* View mode for completed inspections */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Decision:</span>{' '}
                      <Badge variant={
                        inspectDialog.decision === 'approved' ? 'default' :
                        inspectDialog.decision === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {inspectDialog.decision === 'approved' ? 'Accepted' :
                         inspectDialog.decision === 'rejected' ? 'Rejected' :
                         inspectDialog.decision === 'partially_approved' ? 'Partial' :
                         inspectDialog.decision || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Checked By:</span>{' '}
                      <span className="font-medium">{inspectDialog.checkedBy || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approved Qty:</span>{' '}
                      <span className="font-medium text-green-600">{Number(inspectDialog.qtyApproved || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rejected Qty:</span>{' '}
                      <span className="font-medium text-red-600">{Number(inspectDialog.qtyRejected || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {inspectDialog.reason && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Reason:</span>{' '}
                      <span>{inspectDialog.reason}</span>
                    </div>
                  )}
                  {inspectDialog.remarks && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Remarks:</span>{' '}
                      <span>{inspectDialog.remarks}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {inspectDialog && inspectDialog.status !== 'completed' && inspectDialog.status !== 'cancelled' && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button
                onClick={handleSaveAndComplete}
                disabled={!decision || completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {completeMutation.isPending ? 'Submitting...' : 'Submit & Complete'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
