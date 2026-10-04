'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  DollarSign,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  calculated: 'bg-indigo-100 text-indigo-700',
  approval_pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  locked: 'bg-purple-100 text-purple-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'approval_pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'locked', label: 'Locked' },
];

export default function PriceApprovalPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('approval_pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    analysis: any | null;
  }>({ open: false, action: 'approve', analysis: null });
  const [remarks, setRemarks] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['price-approval', { page, status: statusFilter, search }],
    queryFn: () =>
      rateApi.getAnalysis({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      rateApi.approveAnalysis(id, remarks),
    onSuccess: () => {
      toast.success('Price analysis approved');
      setActionDialog({ open: false, action: 'approve', analysis: null });
      setRemarks('');
      queryClient.invalidateQueries({ queryKey: ['price-approval'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      rateApi.rejectAnalysis(id, remarks),
    onSuccess: () => {
      toast.success('Price analysis rejected');
      setActionDialog({ open: false, action: 'reject', analysis: null });
      setRemarks('');
      queryClient.invalidateQueries({ queryKey: ['price-approval'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    },
  });

  const analyses = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Stats from all analyses
  const allData = data?.data?.data || [];
  const stats = {
    pending: allData.filter((a: any) => a.status === 'approval_pending').length,
    approved: allData.filter((a: any) => a.status === 'approved').length,
    rejected: allData.filter((a: any) => a.status === 'rejected').length,
    total: allData.length,
  };

  const openAction = (action: 'approve' | 'reject', analysis: any) => {
    setRemarks('');
    setActionDialog({ open: true, action, analysis });
  };

  const handleAction = () => {
    if (!actionDialog.analysis) return;
    const id = actionDialog.analysis.analysisId;
    if (actionDialog.action === 'approve') {
      approveMutation.mutate({ id, remarks });
    } else {
      if (!remarks.trim()) {
        toast.error('Rejection remarks are required');
        return;
      }
      rejectMutation.mutate({ id, remarks });
    }
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Approval Tool</h1>
        <p className="text-gray-500">Review and approve/reject price analyses submitted for approval</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Approval</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <XCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Analyses</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search analysis, customer..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('approval_pending'); setPage(1); }}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <FileCheck className="h-4 w-4 inline mr-2" />
            Price Analyses ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No price analyses found</h3>
              <p className="text-gray-500 mt-1">
                {statusFilter === 'approval_pending'
                  ? 'No analyses are pending approval right now'
                  : 'Try adjusting the filters'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analysis No.</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Enquiry</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Grand Total</TableHead>
                      <TableHead>Margin %</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((a: any) => (
                      <TableRow key={a.analysisId}>
                        <TableCell className="font-mono text-sm font-medium">
                          <Link href={`/dashboard/rate/${a.analysisId}`} className="text-blue-600 hover:underline">
                            {a.analysisNo || '-'}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{a.customerName || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{a.enquiryOrderNo || '-'}</TableCell>
                        <TableCell>{a.country || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {a.grandTotal ? `₹${Number(a.grandTotal).toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {a.marginPercent != null ? (
                            <span className={`font-medium ${Number(a.marginPercent) >= 15 ? 'text-green-600' : Number(a.marginPercent) >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                              {Number(a.marginPercent).toFixed(1)}%
                              {Number(a.marginPercent) < 5 && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{a.analysisDate ? formatDate(a.analysisDate) : a.createdAt ? formatDate(a.createdAt) : '-'}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}>
                            {(a.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(a.status === 'approval_pending' || a.status === 'submitted' || a.status === 'calculated') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => openAction('approve', a)}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openAction('reject', a)}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/dashboard/rate/${a.analysisId}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: actionDialog.action, analysis: open ? actionDialog.analysis : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? (
                <span className="flex items-center gap-2 text-green-700">
                  <ThumbsUp className="h-5 w-5" /> Approve Price Analysis
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-700">
                  <ThumbsDown className="h-5 w-5" /> Reject Price Analysis
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve'
                ? `Approve analysis ${actionDialog.analysis?.analysisNo} for ${actionDialog.analysis?.customerName || 'this customer'}?`
                : `Reject analysis ${actionDialog.analysis?.analysisNo}? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {actionDialog.analysis && (
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Analysis:</span>
                  <span className="font-medium">{actionDialog.analysis.analysisNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span>{actionDialog.analysis.customerName || '-'}</span>
                </div>
                {actionDialog.analysis.grandTotal && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total:</span>
                    <span className="font-medium">₹{Number(actionDialog.analysis.grandTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {actionDialog.analysis.marginPercent != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margin:</span>
                    <span className={`font-medium ${Number(actionDialog.analysis.marginPercent) >= 15 ? 'text-green-600' : 'text-amber-600'}`}>
                      {Number(actionDialog.analysis.marginPercent).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="remarks">
                Remarks {actionDialog.action === 'reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="remarks"
                placeholder={actionDialog.action === 'approve' ? 'Optional remarks...' : 'Reason for rejection (required)'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: 'approve', analysis: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={isPending}
              className={actionDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
