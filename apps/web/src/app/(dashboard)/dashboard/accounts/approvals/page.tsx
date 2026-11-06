'use client';

import { WorkspacePageHeader } from '@/components/workspace-page-header';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
} from 'lucide-react';

type StatusFilter = 'ledger_uploaded' | 'approved' | 'rejected' | 'all';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  ledger_uploaded: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number | string | null | undefined) {
  if (!amount) return '-';
  return Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function ApproveDialog({ entry, open, onClose }: { entry: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if (open) setRemarks('');
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => accountsApi.approveLedger(entry.ledgerEntryId, { chiefAccountantRemarks: remarks || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-ledger'] });
      onClose();
    },
  });

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" /> Approve Ledger Entry
          </DialogTitle>
          <DialogDescription>
            PO: {entry.orderNumber} — {entry.vendorName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-3 mb-2">
          <div><span className="text-muted-foreground block">Ledger No.</span><span className="font-medium">{entry.ledgerNumber || '-'}</span></div>
          <div><span className="text-muted-foreground block">Ledger Date</span><span className="font-medium">{formatDate(entry.ledgerDate)}</span></div>
          <div><span className="text-muted-foreground block">PO Amount</span><span className="font-medium text-green-700">{formatCurrency(entry.poAmount)}</span></div>
          <div><span className="text-muted-foreground block">Ledger Amount</span><span className="font-medium text-green-700">{formatCurrency(entry.ledgerAmount)}</span></div>
          <div><span className="text-muted-foreground block">Account Head</span><span className="font-medium">{entry.accountHeadName || '-'}</span></div>
          <div><span className="text-muted-foreground block">Accountant</span><span className="font-medium">{entry.accountantName || '-'}</span></div>
          {entry.accountantRemarks && (
            <div className="col-span-2"><span className="text-muted-foreground block">Accountant Remarks</span><span className="font-medium">{entry.accountantRemarks}</span></div>
          )}
        </div>
        {entry.ledgerPdfUrl && (
          <Button variant="outline" size="sm" className="w-fit" onClick={() => window.open(entry.ledgerPdfUrl, '_blank')}>
            <Eye className="h-4 w-4 mr-1" /> View Ledger PDF
          </Button>
        )}
        <div>
          <Label>Chief Accountant Remarks (optional)</Label>
          <Textarea className="bg-yellow-50" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional approval remarks" rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            <CheckCircle className="h-4 w-4 mr-1" />
            {mutation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ entry, open, onClose }: { entry: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  React.useEffect(() => {
    if (open) { setReason(''); setRemarks(''); }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => accountsApi.rejectLedger(entry.ledgerEntryId, { rejectionReason: reason, chiefAccountantRemarks: remarks || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals-ledger'] });
      onClose();
    },
  });

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" /> Reject Ledger Entry
          </DialogTitle>
          <DialogDescription>
            PO: {entry.orderNumber} — {entry.vendorName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-3 mb-2">
          <div><span className="text-muted-foreground block">Ledger No.</span><span className="font-medium">{entry.ledgerNumber || '-'}</span></div>
          <div><span className="text-muted-foreground block">Ledger Date</span><span className="font-medium">{formatDate(entry.ledgerDate)}</span></div>
          <div><span className="text-muted-foreground block">PO Amount</span><span className="font-medium text-green-700">{formatCurrency(entry.poAmount)}</span></div>
          <div><span className="text-muted-foreground block">Ledger Amount</span><span className="font-medium text-green-700">{formatCurrency(entry.ledgerAmount)}</span></div>
        </div>
        <div>
          <Label>Rejection Reason <span className="text-red-500">*</span></Label>
          <Textarea className="bg-yellow-50" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" rows={2} />
        </div>
        <div>
          <Label>Chief Accountant Remarks (optional)</Label>
          <Textarea className="bg-yellow-50" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" rows={2} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending || !reason.trim()}>
            <XCircle className="h-4 w-4 mr-1" />
            {mutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountsApprovalsPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ledger_uploaded');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [approveEntry, setApproveEntry] = useState<any>(null);
  const [rejectEntry, setRejectEntry] = useState<any>(null);

  const userPermissions = user?.permissions || [];
  const canApprove = userPermissions.includes('ACCOUNTS_APPROVE');

  const { data, isLoading } = useQuery({
    queryKey: ['approvals-ledger', page, search, statusFilter],
    queryFn: () => accountsApi.getLedgerEntries({
      page,
      limit: 20,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }).then((r) => r.data),
  });

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="p-4 space-y-4">
      <WorkspacePageHeader title={<><ShieldCheck className="h-6 w-6" /> Ledger Approvals</>} description="Chief Accountant — Review and approve/reject ledger entries" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="ledger_uploaded">Pending Approval</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO, vendor, ledger..." className="pl-9 h-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{total} records</span>
      </div>

      <div className="border rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-xs border-collapse" style={{ minWidth: '1400px' }}>
          <thead>
            <tr>
              <th colSpan={5} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#2563eb' }}>
                Purchase Order Details
              </th>
              <th colSpan={5} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#2563eb' }}>
                Ledger Entry (Accountant)
              </th>
              <th colSpan={3} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#2563eb' }}>
                Chief Accountant Approval
              </th>
              <th className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300 bg-gray-700">
                Actions
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">#</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">PO Number</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">PO Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Vendor</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">PO Amount</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Ledger No</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Ledger Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Ledger Amount</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Account Head</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Accountant</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Status</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Approved/Rejected</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Remarks</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-semibold whitespace-nowrap bg-gray-100">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={14} className="text-center py-8 text-gray-500 border border-gray-300">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={14} className="text-center py-8 text-gray-500 border border-gray-300">No ledger entries found</td></tr>
            ) : (
              items.map((entry: any, idx: number) => {
                const statusInfo = STATUS_BADGE[entry.status] || STATUS_BADGE.pending;
                const isPending = entry.status === 'ledger_uploaded';
                return (
                  <tr key={entry.ledgerEntryId} className="hover:bg-gray-50/80">
                    <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap font-medium">{entry.orderNumber || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{formatDate(entry.poDate)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap max-w-[180px] truncate" title={entry.vendorName}>{entry.vendorName || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap text-right">{formatCurrency(entry.poAmount)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-purple-50/20 font-medium">{entry.ledgerNumber || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-purple-50/20">{formatDate(entry.ledgerDate)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-purple-50/20 text-right">{formatCurrency(entry.ledgerAmount)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-purple-50/20">{entry.accountHeadName || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-purple-50/20">{entry.accountantName || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-blue-50/20">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusInfo.className}`}>{statusInfo.label}</Badge>
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap bg-blue-50/20">
                      {entry.approvedAt ? formatDate(entry.approvedAt) : entry.rejectedAt ? formatDate(entry.rejectedAt) : '-'}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 max-w-[150px] truncate bg-blue-50/20" title={entry.chiefAccountantRemarks || entry.rejectionReason}>
                      {entry.rejectionReason || entry.chiefAccountantRemarks || '-'}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap text-center">
                      {isPending && canApprove ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-green-700 hover:bg-green-50" onClick={() => setApproveEntry(entry)}>
                            <CheckCircle className="h-3 w-3 mr-0.5" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-red-700 hover:bg-red-50" onClick={() => setRejectEntry(entry)}>
                            <XCircle className="h-3 w-3 mr-0.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[10px]">
                          {entry.chiefAccountantName || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} records)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ApproveDialog entry={approveEntry} open={!!approveEntry} onClose={() => setApproveEntry(null)} />
      <RejectDialog entry={rejectEntry} open={!!rejectEntry} onClose={() => setRejectEntry(null)} />
    </div>
  );
}
