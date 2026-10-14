'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi, mastersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Save,
  ArrowLeft,
  Calculator,
  Lock,
  Unlock,
  Send,
  CheckCircle,
  XCircle,
  Download,
  History,
  RefreshCw,
  Loader2,
  AlertCircle,
  DollarSign,
  Truck,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

// Import new components
import { RateCalculationGrid } from '@/components/rate/RateCalculationGrid';
import { PurchaseRateEntry } from '@/components/rate/PurchaseRateEntry';
import { VersionHistory } from '@/components/rate/VersionHistory';
import { ExportDialog } from '@/components/rate/ExportDialog';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
  CALCULATED: { color: 'bg-blue-100 text-blue-700', label: 'Calculated' },
  SUBMITTED: { color: 'bg-purple-100 text-purple-700', label: 'Submitted' },
  PENDING_APPROVAL: { color: 'bg-orange-100 text-orange-700', label: 'Pending Approval' },
  APPROVED: { color: 'bg-green-100 text-green-700', label: 'Approved' },
  LOCKED: { color: 'bg-emerald-100 text-emerald-700', label: 'Locked' },
  REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
};

export default function RateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const analysisId = params.id as string;

  // State
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Editable Currency & Haulage Rates States
  const [gbpRate, setGbpRate] = useState<number>(0);
  const [gbpMargin, setGbpMargin] = useState<number>(0);
  const [usdRate, setUsdRate] = useState<number>(0);
  const [usdMargin, setUsdMargin] = useState<number>(0);
  const [cadRate, setCadRate] = useState<number>(0);
  const [cadMargin, setCadMargin] = useState<number>(0);
  const [audRate, setAudRate] = useState<number>(0);
  const [audMargin, setAudMargin] = useState<number>(0);
  const [euroRate, setEuroRate] = useState<number>(0);
  const [euroMargin, setEuroMargin] = useState<number>(0);
  const [haulageLocation, setHaulageLocation] = useState<string>('DELHI');
  const [totalHaulage, setTotalHaulage] = useState<number>(0);
  const [freightUSD, setFreightUSD] = useState<number>(100);

  // Toggle: apply currency/haulage to all items
  const [applyAllCurrency, setApplyAllCurrency] = useState(true);
  const [applyAllHaulage, setApplyAllHaulage] = useState(true);
  const [globalTargetCurrency, setGlobalTargetCurrency] = useState<string>('USD');

  // Fetch analysis data
  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['rate-analysis', analysisId],
    queryFn: () => rateApi.getAnalysisById(analysisId),
  });

  const analysisData = analysis?.data;

  // Sync state once analysis data loaded
  const [hasSynced, setHasSynced] = useState(false);
  if (analysisData && !hasSynced) {
    setGbpRate(Number(analysisData.gbpRate ?? 126.25));
    setGbpMargin(Number(analysisData.gbpMargin ?? 0));
    setUsdRate(Number(analysisData.usdRate ?? 93.00));
    setUsdMargin(Number(analysisData.usdMargin ?? 0));
    setCadRate(Number(analysisData.cadRate ?? 64.25));
    setCadMargin(Number(analysisData.cadMargin ?? 0));
    setAudRate(Number(analysisData.audRate ?? 63.50));
    setAudMargin(Number(analysisData.audMargin ?? 0));
    setEuroRate(Number(analysisData.euroRate ?? 104.75));
    setEuroMargin(Number(analysisData.euroMargin ?? 0));
    setHaulageLocation(analysisData.haulageLocation || 'DELHI');
    setTotalHaulage(Number(analysisData.totalHaulage ?? 185000));
    setFreightUSD(Number(analysisData.freightUSD ?? 100));
    setHasSynced(true);
  }

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

  // Save rates mutation
  const updateRatesMutation = useMutation({
    mutationFn: (data: any) => rateApi.updateAnalysis(analysisId, data),
    onSuccess: () => {
      toast.success('Rates and Haulage settings updated');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      refetch();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update rates'),
  });

  const handleSaveRates = () => {
    updateRatesMutation.mutate({
      gbpRate,
      gbpMargin,
      usdRate,
      usdMargin,
      cadRate,
      cadMargin,
      audRate,
      audMargin,
      euroRate,
      euroMargin,
      haulageLocation,
      totalHaulage,
      freightUSD,
    });
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => rateApi.submitAnalysis(analysisId),
    onSuccess: () => {
      toast.success('Analysis submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to submit'),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => rateApi.approveAnalysis(analysisId, approvalRemarks),
    onSuccess: () => {
      toast.success('Analysis approved');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      setApprovalRemarks('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to approve'),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rateApi.rejectAnalysis(analysisId, reason),
    onSuccess: () => {
      toast.success('Analysis rejected');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      setApprovalRemarks('');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to reject'),
  });

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: () => rateApi.lockAnalysis(analysisId),
    onSuccess: () => {
      toast.success('Analysis locked - rates finalized');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to lock'),
  });

  // Calculate mutation
  const calculateMutation = useMutation({
    mutationFn: () => rateApi.calculateAnalysis(analysisId),
    onSuccess: () => {
      toast.success('Calculation completed');
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to calculate'),
  });

  // Get status config
  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || { color: 'bg-gray-100', label: status };
  };

  // Action buttons based on status
  const getActionButtons = () => {
    const status = analysisData?.status;
    const buttons = [];

    switch (status) {
      case 'draft':
      case 'calculated':
        buttons.push(
          <Button key="calculate" variant="secondary" onClick={() => calculateMutation.mutate()}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate
          </Button>
        );
        buttons.push(
          <Button key="submit" onClick={() => submitMutation.mutate()}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Approval
          </Button>
        );
        break;
      case 'submitted':
        buttons.push(
          <Button key="approve" onClick={() => approveMutation.mutate()}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        );
        buttons.push(
          <Button key="reject" variant="destructive" onClick={() => rejectMutation.mutate(approvalRemarks || 'Rejected')}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        );
        break;
      case 'approved':
        buttons.push(
          <Button key="lock" onClick={() => lockMutation.mutate()}>
            <Lock className="h-4 w-4 mr-2" />
            Lock Rates
          </Button>
        );
        break;
    }

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Analysis not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/rate">Back to List</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(analysisData.status);

  const isLocked = ['submitted', 'approval_pending', 'approved', 'locked'].includes(analysisData.status);

  // Check if dirty in Rates settings
  const isRatesSettingsDirty = 
    gbpRate !== (analysisData.gbpRate ?? 126.25) ||
    gbpMargin !== (analysisData.gbpMargin ?? 0) ||
    usdRate !== (analysisData.usdRate ?? 93.00) ||
    usdMargin !== (analysisData.usdMargin ?? 0) ||
    cadRate !== (analysisData.cadRate ?? 64.25) ||
    cadMargin !== (analysisData.cadMargin ?? 0) ||
    audRate !== (analysisData.audRate ?? 63.50) ||
    audMargin !== (analysisData.audMargin ?? 0) ||
    euroRate !== (analysisData.euroRate ?? 104.75) ||
    euroMargin !== (analysisData.euroMargin ?? 0) ||
    haulageLocation !== (analysisData.haulageLocation || 'DELHI') ||
    totalHaulage !== (analysisData.totalHaulage ?? 185000) ||
    freightUSD !== (analysisData.freightUSD ?? 100);

  const finalGbp = Number(gbpRate) + Number(gbpMargin);
  const finalUsd = Number(usdRate) + Number(usdMargin);
  const finalCad = Number(cadRate) + Number(cadMargin);
  const finalAud = Number(audRate) + Number(audMargin);
  const finalEuro = Number(euroRate) + Number(euroMargin);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/rate">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{analysisData.enquiryOrderNo || analysisData.analysisNo}</h1>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {analysisData.customerName} • {analysisData.buyerCode || 'N/A'} • {analysisData.country}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {getActionButtons()}
        </div>
      </div>

      {/* Analysis Details at the top */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Enquiry No.</p>
              <p className="font-mono font-medium">{analysisData.enquiryOrderNo || analysisData.analysisNo}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{formatDate(analysisData.analysisDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{analysisData.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500">Buyer Code</p>
              <p className="font-mono font-medium">{analysisData.buyerCode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Country</p>
              <p className="font-medium">{analysisData.country}</p>
            </div>
            <div>
              <p className="text-gray-500">POD</p>
              <p className="font-medium">{analysisData.pod || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Currency</p>
              <p className="font-medium">{analysisData.currency || 'USD'}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Terms</p>
              <p className="font-medium">{analysisData.paymentTerms || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency & Haulage Settings - Compact Colored Boxes */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-700">
          <DollarSign className="h-3.5 w-3.5 text-blue-600" /> Currency & Haulage
        </span>
        <div className="flex items-center gap-4">
          {/* Currency Apply-All Toggle */}
          <div className="flex items-center gap-1.5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={applyAllCurrency} onChange={(e) => setApplyAllCurrency(e.target.checked)} className="sr-only peer" disabled={isLocked} />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-[10px] font-medium text-slate-600">Currency {applyAllCurrency ? '(All)' : '(Per Product)'}</span>
          </div>
          {/* Haulage Apply-All Toggle */}
          <div className="flex items-center gap-1.5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={applyAllHaulage} onChange={(e) => setApplyAllHaulage(e.target.checked)} className="sr-only peer" disabled={isLocked} />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-[10px] font-medium text-slate-600">Haulage {applyAllHaulage ? '(All)' : '(Per Product)'}</span>
          </div>
          {isRatesSettingsDirty && (
            <Button size="sm" onClick={handleSaveRates} className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
              <Save className="h-3 w-3" /> Save
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {/* GBP */}
        <div className="rounded-md border border-blue-200 bg-blue-50/60 p-1.5">
          <p className="text-[10px] font-bold text-blue-700 text-center mb-1">GBP</p>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Rate</span>
            <input title="GBP Base Rate" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={gbpRate || 0} onChange={(e) => setGbpRate(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Buf.</span>
            <input title="GBP Buffer" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={gbpMargin || 0} onChange={(e) => setGbpMargin(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-blue-200 pt-0.5 flex justify-between text-[9px] font-bold text-blue-900 font-mono">
            <span>Final</span><span>{finalGbp.toFixed(2)}</span>
          </div>
        </div>

        {/* USD */}
        <div className="rounded-md border border-green-200 bg-green-50/60 p-1.5">
          <p className="text-[10px] font-bold text-green-700 text-center mb-1">USD</p>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Rate</span>
            <input title="USD Base Rate" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={usdRate || 0} onChange={(e) => setUsdRate(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Buf.</span>
            <input title="USD Buffer" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={usdMargin || 0} onChange={(e) => setUsdMargin(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-green-200 pt-0.5 flex justify-between text-[9px] font-bold text-green-900 font-mono">
            <span>Final</span><span>{finalUsd.toFixed(2)}</span>
          </div>
        </div>

        {/* CAD */}
        <div className="rounded-md border border-orange-200 bg-orange-50/60 p-1.5">
          <p className="text-[10px] font-bold text-orange-700 text-center mb-1">CAD</p>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Rate</span>
            <input title="CAD Base Rate" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={cadRate || 0} onChange={(e) => setCadRate(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Buf.</span>
            <input title="CAD Buffer" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={cadMargin || 0} onChange={(e) => setCadMargin(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-orange-200 pt-0.5 flex justify-between text-[9px] font-bold text-orange-900 font-mono">
            <span>Final</span><span>{finalCad.toFixed(2)}</span>
          </div>
        </div>

        {/* AUD */}
        <div className="rounded-md border border-purple-200 bg-purple-50/60 p-1.5">
          <p className="text-[10px] font-bold text-purple-700 text-center mb-1">AUD</p>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Rate</span>
            <input title="AUD Base Rate" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={audRate || 0} onChange={(e) => setAudRate(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Buf.</span>
            <input title="AUD Buffer" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={audMargin || 0} onChange={(e) => setAudMargin(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-purple-200 pt-0.5 flex justify-between text-[9px] font-bold text-purple-900 font-mono">
            <span>Final</span><span>{finalAud.toFixed(2)}</span>
          </div>
        </div>

        {/* EURO */}
        <div className="rounded-md border border-red-200 bg-red-50/60 p-1.5">
          <p className="text-[10px] font-bold text-red-700 text-center mb-1">EURO</p>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Rate</span>
            <input title="EURO Base Rate" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={euroRate || 0} onChange={(e) => setEuroRate(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">Buf.</span>
            <input title="EURO Buffer" type="number" step="0.01" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={euroMargin || 0} onChange={(e) => setEuroMargin(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-red-200 pt-0.5 flex justify-between text-[9px] font-bold text-red-900 font-mono">
            <span>Final</span><span>{finalEuro.toFixed(2)}</span>
          </div>
        </div>

        {/* Haulage */}
        <div className="rounded-md border border-yellow-200 bg-yellow-50/60 p-1.5">
          <p className="text-[10px] font-bold text-yellow-700 text-center mb-1">HAULAGE</p>
          <div className="text-[9px] mb-0.5">
            <select title="Haulage Location" aria-label="Haulage Location" className="w-full h-4 border rounded font-mono bg-white text-[9px]" value={haulageLocation} onChange={(e) => setHaulageLocation(e.target.value)} disabled={isLocked}>
              <option value="DELHI">Delhi</option>
              <option value="MUMBAI">Mumbai</option>
            </select>
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">₹</span>
            <input title="Haulage Rate INR" type="number" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={totalHaulage || 0} onChange={(e) => setTotalHaulage(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-yellow-200 pt-0.5 text-[9px] font-bold text-yellow-800 font-mono text-right">
            ₹{(totalHaulage || 0).toLocaleString()}
          </div>
        </div>

        {/* Freight */}
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-1.5">
          <p className="text-[10px] font-bold text-amber-700 text-center mb-1">FREIGHT</p>
          <div className="text-[9px] mb-0.5">
            <span className="text-slate-500 text-[8px]">{analysisData.paymentTerms || 'CIF'} • {analysisData.country || 'Dest.'}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] mb-0.5">
            <span className="text-slate-500 w-7 shrink-0">$</span>
            <input title="Freight USD" type="number" className="w-full h-4 px-0.5 text-right border rounded font-mono bg-white text-[9px]" value={freightUSD || 100} onChange={(e) => setFreightUSD(Number(e.target.value))} disabled={isLocked} />
          </div>
          <div className="border-t border-amber-200 pt-0.5 text-[9px] font-bold text-amber-800 font-mono text-right">
            ${freightUSD || 100}
          </div>
        </div>
      </div>

      {/* Global Target Currency selector (when Apply All Currency is ON) */}
      {applyAllCurrency && (
        <div className="flex items-center gap-2 mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded-md">
          <span className="text-[10px] font-semibold text-blue-700">Target Currency for All Products:</span>
          <select
            className="h-5 text-[10px] border border-blue-300 rounded px-1 bg-white font-mono font-bold text-blue-800 outline-none cursor-pointer"
            value={globalTargetCurrency}
            onChange={(e) => setGlobalTargetCurrency(e.target.value)}
            disabled={isLocked}
          >
            {['USD', 'GBP', 'EUR', 'CAD', 'AUD'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="text-[9px] text-blue-500 italic">All product rows will use this currency</span>
        </div>
      )}

      {/* Main Rate Calculation Grid */}
      <div className="space-y-4">
        <RateCalculationGrid
          analysisId={analysisId}
          analysisNo={analysisData.enquiryOrderNo || analysisData.analysisNo}
          isLocked={isLocked}
          applyAllCurrency={applyAllCurrency}
          applyAllHaulage={applyAllHaulage}
          globalTargetCurrency={globalTargetCurrency}
        />
      </div>

      {/* Approval Remarks (for admin) */}
      {analysisData.status === 'submitted' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Approval Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Add any remarks for approval/rejection..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => approveMutation.mutate()} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button variant="destructive" onClick={() => rejectMutation.mutate(approvalRemarks)} className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <VersionHistory
            analysisId={analysisId}
            analysisNo={analysisData.enquiryOrderNo || analysisData.analysisNo}
          />
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        analysisId={analysisId}
        analysisNo={analysisData.enquiryOrderNo || analysisData.analysisNo}
      />
    </div>
  );
}