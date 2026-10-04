'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi, filesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  ClipboardCheck,
  ExternalLink,
  Save,
} from 'lucide-react';

type ActivityFilter = 'all' | 'pending_act1' | 'pending_act2' | 'approved' | 'rejected';

function getActivityStatus(po: any): string {
  if (!po.act1ActualDate) return 'pending_act1';
  if (!po.act2Approval) return 'pending_act2';
  if (po.act2Approval === 'Approved') return 'approved';
  return 'rejected';
}

function getActivityStatusLabel(status: string): string {
  switch (status) {
    case 'pending_act1': return 'Pending Accountant';
    case 'pending_act2': return 'Pending Chief Accountant';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  pending_act1: 'bg-yellow-100 text-yellow-800',
  pending_act2: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function formatDate(date: string | Date | null | undefined) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function Activity1Dialog({ po, open, onClose }: { po: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    act1PlannedDate: '', act1ActualDate: '', act1PoLink: '', act1PoNum: '', act1PoDate: '', act1Remarks: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  React.useEffect(() => {
    if (po && open) {
      setForm({
        act1PlannedDate: formatDateForInput(po.act1PlannedDate),
        act1ActualDate: formatDateForInput(po.act1ActualDate),
        act1PoLink: po.act1PoLink || '',
        act1PoNum: po.act1PoNum || '',
        act1PoDate: formatDateForInput(po.act1PoDate),
        act1Remarks: po.act1Remarks || '',
      });
    }
  }, [po, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.updateActivity1(po.orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountant-review'] });
      onClose();
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const presigned = await filesApi.getPresignedUploadUrl({
        fileName: file.name, mimeType: file.type, fileSize: file.size, moduleName: 'accountant-review',
      });
      const { uploadUrl, key } = presigned.data.data;
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const confirmed = await filesApi.confirmUpload({
        storageKey: key, fileName: file.name, mimeType: file.type, fileSize: file.size, moduleName: 'accountant-review', recordId: po?.orderId || '',
      });
      setForm(prev => ({ ...prev, act1PoLink: confirmed.data.data.fileUrl }));
    } catch {
      alert('File upload failed. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = () => {
    const payload: any = {};
    if (form.act1PlannedDate) payload.act1PlannedDate = form.act1PlannedDate;
    if (form.act1ActualDate) payload.act1ActualDate = form.act1ActualDate;
    if (form.act1PoLink) payload.act1PoLink = form.act1PoLink;
    if (form.act1PoNum) payload.act1PoNum = form.act1PoNum;
    if (form.act1PoDate) payload.act1PoDate = form.act1PoDate;
    if (form.act1Remarks) payload.act1Remarks = form.act1Remarks;
    mutation.mutate(payload);
  };

  if (!po) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity-01: Accountant (NASIM)</DialogTitle>
          <DialogDescription>Indent: {po.orderNumber} — {po.vendorName}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-lg p-3 mb-2">
          <div><span className="text-muted-foreground block">SO No.</span><span className="font-medium">{po.soNo || '-'}</span></div>
          <div><span className="text-muted-foreground block">Purchase Person</span><span className="font-medium">{po.purchasePerson || '-'}</span></div>
          <div><span className="text-muted-foreground block">Payment Term</span><span className="font-medium">{po.paymentTermsName || '-'}</span></div>
          <div><span className="text-muted-foreground block">Total Amount</span><span className="font-medium text-green-700">{po.totalAmount || '-'}</span></div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>PO Upload Planned Date</Label>
              <Input className="bg-yellow-50" type="date" value={form.act1PlannedDate} onChange={(e) => setForm(f => ({ ...f, act1PlannedDate: e.target.value }))} />
            </div>
            <div>
              <Label>PO Upload Actual Date</Label>
              <Input className="bg-yellow-50" type="date" value={form.act1ActualDate} onChange={(e) => setForm(f => ({ ...f, act1ActualDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>PO Link (Upload PDF)</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept=".pdf" onChange={handleFileUpload} className="bg-yellow-50" disabled={uploadingFile} />
              {form.act1PoLink && (
                <Button variant="ghost" size="sm" onClick={() => window.open(form.act1PoLink, '_blank')} title="View uploaded PO">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {uploadingFile && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            {form.act1PoLink && <p className="text-xs text-green-600 mt-1">PDF uploaded</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>PO NUM</Label>
              <Input className="bg-yellow-50" value={form.act1PoNum} onChange={(e) => setForm(f => ({ ...f, act1PoNum: e.target.value }))} placeholder="PO number from Tally" />
            </div>
            <div>
              <Label>PO Date</Label>
              <Input className="bg-yellow-50" type="date" value={form.act1PoDate} onChange={(e) => setForm(f => ({ ...f, act1PoDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea className="bg-yellow-50" value={form.act1Remarks} onChange={(e) => setForm(f => ({ ...f, act1Remarks: e.target.value }))} placeholder="Optional remarks" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {mutation.isPending ? 'Saving...' : 'Save Activity-01'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Activity2Dialog({ po, open, onClose }: { po: any; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    act2PlannedDate: '', act2ActualDate: '', act2Approval: '', act2Remarks: '',
  });

  React.useEffect(() => {
    if (po && open) {
      setForm({
        act2PlannedDate: formatDateForInput(po.act2PlannedDate),
        act2ActualDate: formatDateForInput(po.act2ActualDate),
        act2Approval: po.act2Approval || '',
        act2Remarks: po.act2Remarks || '',
      });
    }
  }, [po, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => purchaseOrderApi.updateActivity2(po.orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountant-review'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const payload: any = {};
    if (form.act2PlannedDate) payload.act2PlannedDate = form.act2PlannedDate;
    if (form.act2ActualDate) payload.act2ActualDate = form.act2ActualDate;
    if (form.act2Approval) payload.act2Approval = form.act2Approval;
    if (form.act2Remarks) payload.act2Remarks = form.act2Remarks;
    mutation.mutate(payload);
  };

  if (!po) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Activity-02: Chief Accountant (SMITHA S NAIR)</DialogTitle>
          <DialogDescription>Indent: {po.orderNumber} — {po.vendorName}</DialogDescription>
        </DialogHeader>
        <div className="text-sm bg-slate-50 rounded-lg p-3 mb-2 space-y-2">
          <h4 className="font-semibold text-xs uppercase text-muted-foreground">Activity-01 (Accountant)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Planned:</span> <span className="font-medium">{formatDate(po.act1PlannedDate)}</span></div>
            <div><span className="text-muted-foreground">Actual:</span> <span className="font-medium">{formatDate(po.act1ActualDate)}</span></div>
            <div><span className="text-muted-foreground">PO NUM:</span> <span className="font-medium">{po.act1PoNum || '-'}</span></div>
            <div><span className="text-muted-foreground">PO Date:</span> <span className="font-medium">{formatDate(po.act1PoDate)}</span></div>
          </div>
          {po.act1PoLink && (
            <Button variant="outline" size="sm" onClick={() => window.open(po.act1PoLink, '_blank')}>
              <Eye className="h-4 w-4 mr-1" /> View PO PDF
            </Button>
          )}
          {po.act1Remarks && <div><span className="text-muted-foreground">Remarks:</span> <span>{po.act1Remarks}</span></div>}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Planned Date</Label>
              <Input className="bg-yellow-50" type="date" value={form.act2PlannedDate} onChange={(e) => setForm(f => ({ ...f, act2PlannedDate: e.target.value }))} />
            </div>
            <div>
              <Label>Actual Date</Label>
              <Input className="bg-yellow-50" type="date" value={form.act2ActualDate} onChange={(e) => setForm(f => ({ ...f, act2ActualDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>PO Approval</Label>
            <Select value={form.act2Approval} onValueChange={(v) => setForm(f => ({ ...f, act2Approval: v }))}>
              <SelectTrigger className="bg-yellow-50"><SelectValue placeholder="Select approval status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PO Remarks</Label>
            <Textarea className="bg-yellow-50" value={form.act2Remarks} onChange={(e) => setForm(f => ({ ...f, act2Remarks: e.target.value }))} placeholder="Optional remarks" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !form.act2Approval}>
            <Save className="h-4 w-4 mr-1" />
            {mutation.isPending ? 'Saving...' : 'Save Activity-02'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountantReviewPage() {
  const { user } = useAuthStore();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [act1PO, setAct1PO] = useState<any>(null);
  const [act2PO, setAct2PO] = useState<any>(null);

  const userPermissions = user?.permissions || [];
  const canEditAct1 = userPermissions.includes('ACCOUNTS_VIEW');
  const canEditAct2 = userPermissions.includes('ACCOUNTS_APPROVE');

  const { data, isLoading } = useQuery({
    queryKey: ['accountant-review', page, search, activityFilter],
    queryFn: () => purchaseOrderApi.getAccountantReview({
      page, limit: 20,
      search: search || undefined,
      activityStatus: activityFilter !== 'all' ? activityFilter : undefined,
    }).then((r) => r.data),
  });

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const totalCols = canEditAct2 ? 22 : 18;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> Accountant Review
        </h1>
        <p className="text-sm text-muted-foreground">Indent to Purchase Order — Activity-01 &amp; Activity-02</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Tabs value={activityFilter} onValueChange={(v) => { setActivityFilter(v as ActivityFilter); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending_act1">Pending Act-01</TabsTrigger>
            <TabsTrigger value="pending_act2">Pending Act-02</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{total} records</span>
      </div>

      <div className="border rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-xs border-collapse" style={{ minWidth: '2200px' }}>
          <thead>
            {/* Row 1: Group headers */}
            <tr>
              <th className="border border-gray-300 px-1 py-0.5 text-[10px] text-gray-500 font-normal w-8" rowSpan={3}>
                #
              </th>
              <th colSpan={7} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#2d5016' }}>
                Indent to Purchase Order Sheet 2026-2027
              </th>
              <th colSpan={4} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#1a4d6e' }}>
                Purchase Order Details
              </th>
              <th colSpan={1} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300 bg-red-700">
                Buyer
              </th>
              <th colSpan={6} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#7b68ae' }}>
                Activity-01
              </th>
              {canEditAct2 && (
                <th colSpan={4} className="text-white text-center py-2 px-2 text-sm font-bold border border-gray-300" style={{ backgroundColor: '#4285f4' }}>
                  Activity-02
                </th>
              )}
            </tr>
            {/* Row 2: Person names */}
            <tr>
              <th colSpan={7} className="border border-gray-300 px-2 py-1 text-center text-xs font-normal bg-green-50 text-green-800">
                &nbsp;
              </th>
              <th colSpan={4} className="border border-gray-300 px-2 py-1 text-center text-xs font-normal bg-blue-50 text-blue-800">
                &nbsp;
              </th>
              <th colSpan={1} className="border border-gray-300 px-2 py-1 text-center text-xs font-normal bg-red-50 text-red-800">
                &nbsp;
              </th>
              <th colSpan={6} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium bg-purple-50 text-purple-800">
                NASIM
              </th>
              {canEditAct2 && (
                <th colSpan={4} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium bg-blue-50 text-blue-800">
                  SMITHA S NAIR
                </th>
              )}
            </tr>
            {/* Row 3: Column headers */}
            <tr className="bg-gray-50">
              {/* Indent to PO */}
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Indent No</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Indent Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">SO No</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Vendor Name</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Vendor Mobile</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">Vendor Address</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-green-50">GSTIN/UIN</th>
              {/* PO Details */}
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-sky-50">Purchase Manager</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-sky-50">Payment Term</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-sky-50">Gmail Id</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-sky-50">PDF File</th>
              {/* Buyer */}
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-red-50">Buyer Name</th>
              {/* Activity-01 */}
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">PO Upload Planned Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">PO Upload Actual Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">PO Link</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">PO NUM</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Po Date</th>
              <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-purple-50">Remarks</th>
              {/* Activity-02 */}
              {canEditAct2 && (
                <>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Planned</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Actual</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">Po Approved</th>
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold whitespace-nowrap bg-blue-50">PO Remarks</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={totalCols} className="text-center py-8 text-gray-500 border border-gray-300">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={totalCols} className="text-center py-8 text-gray-500 border border-gray-300">No purchase orders found</td></tr>
            ) : (
              items.map((po: any, idx: number) => {
                const status = getActivityStatus(po);
                const canAct1 = canEditAct1 && status === 'pending_act1';
                const canAct2Row = canEditAct2 && status === 'pending_act2';
                return (
                  <tr key={po.orderId} className="hover:bg-gray-50/80">
                    <td className="border border-gray-200 px-1 py-1.5 text-center text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                    {/* Indent to PO */}
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap font-medium">{po.orderNumber || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{formatDate(po.orderDate)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.soNo || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap max-w-[180px] truncate" title={po.vendorName}>{po.vendorName || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.vendorMobileNo || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 max-w-[180px] truncate" title={po.billingAddress}>{po.billingAddress || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.vendorGstin || '-'}</td>
                    {/* PO Details */}
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.purchasePerson || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.paymentTermsName || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.contactEmail || '-'}</td>
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={async () => {
                        try {
                          const res = await purchaseOrderApi.downloadPdf(po.orderId);
                          const blob = new Blob([res.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch { alert('Failed to load PDF'); }
                      }}>
                        <FileText className="h-3 w-3 mr-0.5" /> View PDF
                      </Button>
                    </td>
                    {/* Buyer */}
                    <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap">{po.salesPersonName || '-'}</td>
                    {/* Activity-01 */}
                    <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)}>
                      {formatDate(po.act1PlannedDate)}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)}>
                      {formatDate(po.act1ActualDate)}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)}>
                      {po.act1PoLink ? (
                        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.stopPropagation(); window.open(po.act1PoLink, '_blank'); }}>
                          <ExternalLink className="h-3 w-3 mr-0.5" /> PDF
                        </Button>
                      ) : canAct1 ? <span className="text-purple-500 text-[10px]">Click to edit</span> : '-'}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)}>
                      {po.act1PoNum || (canAct1 ? <span className="text-purple-500 text-[10px]">Click to edit</span> : '-')}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)}>
                      {formatDate(po.act1PoDate)}
                    </td>
                    <td className={`border border-gray-200 px-2 py-1.5 max-w-[120px] truncate ${canAct1 ? 'bg-yellow-50 cursor-pointer' : 'bg-purple-50/20'}`} onClick={() => canAct1 && setAct1PO(po)} title={po.act1Remarks}>
                      {po.act1Remarks || '-'}
                    </td>
                    {/* Activity-02 */}
                    {canEditAct2 && (
                      <>
                        <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct2Row ? 'bg-yellow-50 cursor-pointer' : 'bg-blue-50/20'}`} onClick={() => canAct2Row && setAct2PO(po)}>
                          {formatDate(po.act2PlannedDate)}
                        </td>
                        <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct2Row ? 'bg-yellow-50 cursor-pointer' : 'bg-blue-50/20'}`} onClick={() => canAct2Row && setAct2PO(po)}>
                          {formatDate(po.act2ActualDate)}
                        </td>
                        <td className={`border border-gray-200 px-2 py-1.5 whitespace-nowrap ${canAct2Row ? 'bg-yellow-50 cursor-pointer' : 'bg-blue-50/20'}`} onClick={() => canAct2Row && setAct2PO(po)}>
                          {po.act2Approval ? (
                            <Badge className={`text-[10px] px-1 py-0 ${po.act2Approval === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {po.act2Approval}
                            </Badge>
                          ) : canAct2Row ? <span className="text-blue-500 text-[10px]">Click to edit</span> : '-'}
                        </td>
                        <td className={`border border-gray-200 px-2 py-1.5 max-w-[120px] truncate ${canAct2Row ? 'bg-yellow-50 cursor-pointer' : 'bg-blue-50/20'}`} onClick={() => canAct2Row && setAct2PO(po)} title={po.act2Remarks}>
                          {po.act2Remarks || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Dialogs */}
      <Activity1Dialog po={act1PO} open={!!act1PO} onClose={() => setAct1PO(null)} />
      <Activity2Dialog po={act2PO} open={!!act2PO} onClose={() => setAct2PO(null)} />
    </div>
  );
}
