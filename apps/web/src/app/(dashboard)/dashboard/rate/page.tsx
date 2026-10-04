'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Eye,
  Calculator,
  DollarSign,
  CheckCircle,
  XCircle,
  Lock,
  Send,
  RefreshCw,
  History,
  Loader2,
  Settings,
  Save,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

// Import components
import { EnquirySelector } from '@/components/rate/EnquirySelector';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'calculated', label: 'Calculated' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approval_pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'locked', label: 'Locked' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  calculated: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  approval_pending: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  locked: 'bg-emerald-100 text-emerald-700',
};

export default function RateCalculationListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showEnquirySelector, setShowEnquirySelector] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    analysisId: string | null;
  }>({
    open: false,
    action: '',
    title: '',
    analysisId: null,
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [remarks, setRemarks] = useState('');
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const [editRates, setEditRates] = useState<Record<string, number>>({});
  const [editHaulage, setEditHaulage] = useState<Record<string, number>>({});

  const queryStatus = status !== 'all'
    ? status
    : (activeTab === 'pending' ? 'draft,calculated,submitted,approval_pending' : 'approved,rejected,locked');

  // Fetch analyses
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['rate-analysis', { page, search, status: queryStatus, activeTab }],
    queryFn: () =>
      rateApi.getAnalysis({
        page,
        limit: 20,
        status: queryStatus,
        ...(search ? { search } : {}),
      }),
  });

  // Currency rates query
  const { data: currencyRates } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: rateApi.getCurrencyRates,
  });

  // Haulage rates query
  const { data: haulageRates } = useQuery({
    queryKey: ['haulage-rates'],
    queryFn: rateApi.getHaulageRates,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (id: string) => rateApi.submitAnalysis(id),
    onSuccess: () => {
      toast.success('Analysis submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      closeDialog();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to submit'),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      rateApi.approveAnalysis(id, remarks),
    onSuccess: () => {
      toast.success('Analysis approved');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      closeDialog();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to approve'),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rateApi.rejectAnalysis(id, reason),
    onSuccess: () => {
      toast.success('Analysis rejected');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      closeDialog();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to reject'),
  });

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: (id: string) => rateApi.lockAnalysis(id),
    onSuccess: () => {
      toast.success('Analysis locked');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      closeDialog();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to lock'),
  });

  // Create from enquiry mutation
  const createFromEnquiryMutation = useMutation({
    mutationFn: (enquiryData: any) => rateApi.createAnalysis(enquiryData),
    onSuccess: (response) => {
      toast.success('Rate analysis created from enquiry');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis'] });
      setShowEnquirySelector(false);
      // Navigate to the new analysis
      window.location.href = `/dashboard/rate/${response.data?.analysisId || response.data?.id}`;
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to create'),
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      rateApi.updateCurrencyRate(id, { rate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update currency rate'),
  });

  const updateHaulageMutation = useMutation({
    mutationFn: ({ id, ratePerCbm }: { id: string; ratePerCbm: number }) =>
      rateApi.updateHaulageRate(id, { ratePerCbm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['haulage-rates'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update haulage rate'),
  });

  const handleOpenCurrencySettings = () => {
    const rates: Record<string, number> = {};
    (currencyRates?.data || []).forEach((r: any) => {
      rates[r.rateId] = Number(r.rate);
    });
    const haul: Record<string, number> = {};
    (haulageRates?.data || []).forEach((h: any) => {
      haul[h.haulageId] = Number(h.ratePerCbm);
    });
    setEditRates(rates);
    setEditHaulage(haul);
    setShowCurrencySettings(true);
  };

  const handleSaveGlobalRates = async () => {
    try {
      const promises: Promise<any>[] = [];
      for (const [id, rate] of Object.entries(editRates)) {
        const original = (currencyRates?.data || []).find((r: any) => r.rateId === id);
        if (original && Number(original.rate) !== rate) {
          promises.push(updateCurrencyMutation.mutateAsync({ id, rate }));
        }
      }
      for (const [id, ratePerCbm] of Object.entries(editHaulage)) {
        const original = (haulageRates?.data || []).find((h: any) => h.haulageId === id);
        if (original && Number(original.ratePerCbm) !== ratePerCbm) {
          promises.push(updateHaulageMutation.mutateAsync({ id, ratePerCbm }));
        }
      }
      await Promise.all(promises);
      toast.success('Global rates updated — new analyses will use updated rates');
      setShowCurrencySettings(false);
      queryClient.invalidateQueries({ queryKey: ['currency-rates'] });
      queryClient.invalidateQueries({ queryKey: ['haulage-rates'] });
    } catch {
      // individual errors already toasted
    }
  };

  const closeDialog = () => {
    setActionDialog({ open: false, action: '', title: '', analysisId: null });
    setRemarks('');
  };

  const handleEnquirySelect = (enquiry: any) => {
    // Create rate analysis from enquiry
    createFromEnquiryMutation.mutate({
      enquiryOrderId: enquiry.enquiryId || enquiry.id,
      enquiryOrderNo: enquiry.enquiryNo,
      customerId: enquiry.customerId,
      customerName: enquiry.customerName,
      buyerCode: enquiry.buyerCode,
      country: enquiry.country,
      pod: enquiry.pod,
      currencyId: enquiry.currencyId,
      paymentTermsId: enquiry.paymentTermsId,
      portOfLoading: enquiry.portOfLoading,
      items: enquiry.items?.map((item: any) => ({
        enquiryItemId: item.itemId || item.id,
        productCode: item.productCode,
        productName: item.productName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        orderQuantity: Number(item.orderQuantity || item.quantity || 0),
        unitName: item.unitName || item.uom,
        cbmPerBox: Number(item.cbmPerBox || 0),
        unitsPerCase: Number(item.unitsPerCase || 0),
        mrp: Number(item.mrp || 0),
        gstPercentage: Number(item.gstPercentage || item.gstPercent || 0),
      })),
    });
  };

  const getActionButtons = (analysis: any) => {
    const buttons = [];
    switch (analysis.status) {
      case 'draft':
      case 'calculated':
        buttons.push(
          <Button
            key="submit"
            variant="default"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'submit',
                title: 'Submit Analysis',
                analysisId: analysis.analysisId || analysis.id,
              })
            }
          >
            <Send className="h-4 w-4 mr-1" />
            Submit
          </Button>
        );
        break;
      case 'submitted':
        buttons.push(
          <Button
            key="approve"
            variant="default"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'approve',
                title: 'Approve Analysis',
                analysisId: analysis.analysisId || analysis.id,
              })
            }
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
        );
        buttons.push(
          <Button
            key="reject"
            variant="destructive"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'reject',
                title: 'Reject Analysis',
                analysisId: analysis.analysisId || analysis.id,
              })
            }
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        );
        break;
      case 'approved':
        buttons.push(
          <Button
            key="lock"
            variant="default"
            size="sm"
            onClick={() =>
              setActionDialog({
                open: true,
                action: 'lock',
                title: 'Lock Analysis',
                analysisId: analysis.analysisId || analysis.id,
              })
            }
          >
            <Lock className="h-4 w-4 mr-1" />
            Lock
          </Button>
        );
        break;
    }
    return buttons;
  };

  const handleAction = () => {
    if (!actionDialog.analysisId) return;
    switch (actionDialog.action) {
      case 'submit':
        submitMutation.mutate(actionDialog.analysisId);
        break;
      case 'approve':
        approveMutation.mutate({ id: actionDialog.analysisId, remarks });
        break;
      case 'reject':
        rejectMutation.mutate({ id: actionDialog.analysisId, reason: remarks });
        break;
      case 'lock':
        lockMutation.mutate(actionDialog.analysisId);
        break;
    }
  };

  const analyses = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Analysis / Rate Calculation</h1>
          <p className="text-gray-500">Calculate and manage product rates with currency and haulage</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenCurrencySettings}>
            <DollarSign className="h-4 w-4 mr-2" />
            Currency & Haulage
          </Button>
          <Button onClick={() => setShowEnquirySelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New from Enquiry
          </Button>
        </div>
      </div>

      {/* Currency & Haulage Summary - Compact */}
      <div className="flex items-center gap-3 flex-wrap">
        {['GBP', 'USD', 'CAD', 'AUD', 'EUR'].map((code) => {
          const rate = currencyRates?.data?.find((r: any) => r.currencyCode === code);
          const colorMap: Record<string, string> = {
            GBP: 'bg-blue-50 border-blue-200 text-blue-700',
            USD: 'bg-green-50 border-green-200 text-green-700',
            CAD: 'bg-orange-50 border-orange-200 text-orange-700',
            AUD: 'bg-purple-50 border-purple-200 text-purple-700',
            EUR: 'bg-red-50 border-red-200 text-red-700',
          };
          return (
            <div key={code} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${colorMap[code]}`}>
              <span className="text-xs font-bold">{code}</span>
              <span className="text-sm font-mono font-semibold">{Number(rate?.rate || 0).toFixed(2)}</span>
            </div>
          );
        })}
        {(haulageRates?.data || []).map((h: any) => (
          <div key={h.haulageId} className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-yellow-50 border-yellow-200 text-yellow-700">
            <Truck className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{h.location}</span>
            <span className="text-sm font-mono font-semibold">₹{Number(h.ratePerCbm || 0).toLocaleString()}</span>
          </div>
        ))}
        <button
          onClick={handleOpenCurrencySettings}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 text-xs"
        >
          <Settings className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Enquiry No., buyer code, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setPage(1); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>
 
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setPage(1); setStatus('all'); }}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pending Analysis
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Analysis
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Analyses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analysis List ({total})</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : analyses.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enquiry No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Purchase</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis: any) => (
                    <TableRow key={analysis.analysisId || analysis.id}>
                      <TableCell className="font-mono font-medium">{analysis.enquiryOrderNo || analysis.analysisNo}</TableCell>
                      <TableCell>{formatDate(analysis.analysisDate)}</TableCell>
                      <TableCell>{analysis.buyerCode || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{analysis.customerName || '-'}</TableCell>
                      <TableCell>{analysis.currency || 'USD'}</TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{(analysis.totalPurchaseValue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ₹{(analysis.totalSellingValue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {analysis.totalMargin > 0 ? (
                          <Badge className="bg-green-100 text-green-700">{Number(analysis.totalMargin || 0).toFixed(2)}%</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[analysis.status] || 'bg-gray-100'}>
                          {analysis.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {getActionButtons(analysis)}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/rate/${analysis.analysisId || analysis.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No analyses found</p>
              <p className="text-gray-500 mt-1">Create a new analysis from an enquiry</p>
              <Button onClick={() => setShowEnquirySelector(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                New from Enquiry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enquiry Selector Dialog */}
      <EnquirySelector
        open={showEnquirySelector}
        onClose={() => setShowEnquirySelector(false)}
        onSelect={handleEnquirySelect}
      />

      {/* Currency & Haulage Settings Dialog */}
      <Dialog open={showCurrencySettings} onOpenChange={setShowCurrencySettings}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Currency & Haulage Settings
            </DialogTitle>
            <DialogDescription>
              Update global rates here. New analyses will use updated rates. Existing/saved analyses keep their rates unchanged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Currency Rates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Currency Rates (₹ per unit)
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {(currencyRates?.data || []).map((r: any) => {
                  const colorMap: Record<string, string> = {
                    GBP: 'border-blue-200 bg-blue-50',
                    USD: 'border-green-200 bg-green-50',
                    CAD: 'border-orange-200 bg-orange-50',
                    AUD: 'border-purple-200 bg-purple-50',
                    EUR: 'border-red-200 bg-red-50',
                  };
                  const labelColor: Record<string, string> = {
                    GBP: 'text-blue-700',
                    USD: 'text-green-700',
                    CAD: 'text-orange-700',
                    AUD: 'text-purple-700',
                    EUR: 'text-red-700',
                  };
                  return (
                    <div key={r.rateId} className={`rounded-lg border p-3 ${colorMap[r.currencyCode] || 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-xs font-bold text-center mb-2 ${labelColor[r.currencyCode] || 'text-gray-700'}`}>
                        {r.currencyCode}
                      </p>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500">Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm font-mono text-right bg-white"
                          value={editRates[r.rateId] ?? Number(r.rate)}
                          onChange={(e) => setEditRates(prev => ({ ...prev, [r.rateId]: Number(e.target.value) }))}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 text-center">
                        Current: {Number(r.rate).toFixed(4)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Haulage Rates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Haulage Rates (₹)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(haulageRates?.data || []).map((h: any) => (
                  <div key={h.haulageId} className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs font-bold text-yellow-700 text-center mb-2">{h.location}</p>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Rate (₹)</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm font-mono text-right bg-white"
                        value={editHaulage[h.haulageId] ?? Number(h.ratePerCbm)}
                        onChange={(e) => setEditHaulage(prev => ({ ...prev, [h.haulageId]: Number(e.target.value) }))}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                      Current: ₹{Number(h.ratePerCbm).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>Note:</strong> Changing rates here will only affect <strong>new</strong> analyses created after this change.
              Already saved analyses will keep their existing rates.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCurrencySettings(false)}>Cancel</Button>
            <Button onClick={handleSaveGlobalRates} disabled={updateCurrencyMutation.isPending || updateHaulageMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'submit' && 'Submit this analysis for approval'}
              {actionDialog.action === 'approve' && 'Approve this rate analysis'}
              {actionDialog.action === 'reject' && 'Reject this rate analysis'}
              {actionDialog.action === 'lock' && 'Lock rates - this is irreversible'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionDialog.action !== 'lock' && (
              <div>
                <Label>Remarks {actionDialog.action === 'reject' ? '(Required)' : '(Optional)'}</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={actionDialog.action === 'reject' ? 'Rejection reason...' : 'Add remarks...'}
                  rows={3}
                />
              </div>
            )}
            {actionDialog.action === 'lock' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-3">
                  <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Warning: This is irreversible</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Locking will finalize all rates. No further edits will be allowed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleAction}
              variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}
              disabled={
                (actionDialog.action === 'reject' && !remarks.trim()) ||
                submitMutation.isPending ||
                approveMutation.isPending ||
                rejectMutation.isPending ||
                lockMutation.isPending
              }
            >
              {actionDialog.action === 'submit' && <><Send className="h-4 w-4 mr-2" /> Submit</>}
              {actionDialog.action === 'approve' && <><CheckCircle className="h-4 w-4 mr-2" /> Approve</>}
              {actionDialog.action === 'reject' && <><XCircle className="h-4 w-4 mr-2" /> Reject</>}
              {actionDialog.action === 'lock' && <><Lock className="h-4 w-4 mr-2" /> Lock Rates</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}