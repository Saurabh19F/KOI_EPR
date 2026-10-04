'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
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
import {
  Save,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Calculator,
  Edit2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';

interface PurchaseRateEntryProps {
  analysisId: string;
  items: any[];
  onRatesSaved?: () => void;
}

interface PurchaseRateItem {
  itemId: string;
  lineNo: number;
  productCode: string;
  productName: string;
  orderQuantity: number;
  buyingBestLandingRate: number; // Best landing rate per unit in INR (excl. GST)
  buyingPrice: number;           // Raw buying price in purchase currency
  purchaseCurrency: string;      // USD / GBP / INR …
  freightCost: number;           // Freight cost in INR
  otherCost: number;             // Other costs in INR
  gstPercent: number;            // GST percentage
  location: string;              // Haulage location
  remark: string;
  status: string;                // PENDING | CALCULATED | LOCKED
  [key: string]: any;            // Allow dynamic indexing
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];
const LOCATIONS  = ['DELHI', 'MUMBAI', 'CHENNAI', 'KOLKATA', 'HYDERABAD'];
const GST_OPTIONS = [0, 5, 12, 18, 28];

// ── Row status indicator ──────────────────────────────────────────────────────
function StatusDot({ rate, status }: { rate: number; status: string }) {
  const isLocked = status === 'LOCKED' || status === 'locked';
  if (isLocked) {
    return (
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Locked</span>
      </span>
    );
  }
  if (rate > 0) {
    return (
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
        <span className="text-xs text-yellow-600 font-medium">Entered</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
      <span className="text-xs text-red-500 font-medium font-semibold">Missing</span>
    </span>
  );
}

export function PurchaseRateEntry({ analysisId, items, onRatesSaved }: PurchaseRateEntryProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [rates, setRates] = useState<PurchaseRateItem[]>([]);
  const [dirtyItems, setDirtyItems] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [editDialog, setEditDialog] = useState<{ open: boolean; item: PurchaseRateItem | null }>({
    open: false,
    item: null,
  });
  const [formData, setFormData] = useState<Partial<PurchaseRateItem>>({});
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRate, setBulkRate] = useState('');

  // ── Fetch latest item data ──────────────────────────────────────────────────
  const { data: latestItems, isLoading } = useQuery({
    queryKey: ['purchase-rates', analysisId],
    queryFn: () =>
      rateApi
        .getAnalysisById(analysisId)
        .then((res) => res.data?.analysisItems || res.data?.items || []),
  });

  // ── Map raw item data → PurchaseRateItem ────────────────────────────────────
  const mapItem = (item: any): PurchaseRateItem => ({
    itemId: item.itemId || item.id,
    lineNo: Number(item.lineNo || 1),
    productCode: item.productCode || '',
    productName: item.productName || '',
    orderQuantity: Number(item.orderQuantity || 0),
    buyingBestLandingRate: Number(item.buyingBestLandingRate || 0),
    buyingPrice: Number(item.buyingPrice || 0),
    purchaseCurrency: item.purchaseCurrency || 'USD',
    freightCost: Number(item.freightCost || 0),
    otherCost: Number(item.otherCost || 0),
    gstPercent: Number(item.gstPercent ?? 18),
    location:
      item.bestLandingLocation ||
      item.selectedHaulageLocation ||
      item.location ||
      'DELHI',
    remark: item.remark || '',
    status: item.status || 'PENDING',
  });

  useEffect(() => {
    const source = latestItems?.length ? latestItems : items;
    if (source?.length) {
      setRates(source.map(mapItem));
      setDirtyItems({});
    }
  }, [latestItems, items]);

  // ── handleItemChange ────────────────────────────────────────────────────────
  const handleItemChange = (index: number, field: string, value: any) => {
    const newRates = [...rates];
    const item = { ...newRates[index] };

    if (
      field === 'buyingBestLandingRate' ||
      field === 'gstPercent' ||
      field === 'freightCost' ||
      field === 'otherCost' ||
      field === 'buyingPrice' ||
      field === 'orderQuantity'
    ) {
      item[field] = value === '' ? 0 : Number(value);
    } else {
      item[field] = value;
    }

    newRates[index] = item;
    setRates(newRates);

    if (item.itemId) {
      setDirtyItems((prev) => ({ ...prev, [item.itemId]: true }));
    }
  };

  // ── Save all dirty items mutation ───────────────────────────────────────────
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const savePromises = rates
      .filter((item) => dirtyItems[item.itemId])
      .map((item) =>
        rateApi.updateAnalysisItem(item.itemId, {
          buyingBestLandingRate: item.buyingBestLandingRate,
          buyingPrice: item.buyingPrice,
          purchaseCurrency: item.purchaseCurrency,
          freightCost: item.freightCost,
          otherCost: item.otherCost,
          gstPercent: item.gstPercent,
          location: item.location,
          remark: item.remark,
        })
      );

    try {
      await Promise.all(savePromises);
      toast.success('All purchase rates saved successfully');
      setDirtyItems({});
      queryClient.invalidateQueries({ queryKey: ['purchase-rates', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      onRatesSaved?.();
      // Auto-recalculate immediately
      await rateApi.calculateAnalysis(analysisId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save some changes');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Lock single item mutation ───────────────────────────────────────────────
  const lockMutation = useMutation({
    mutationFn: (itemId: string) =>
      rateApi.updateAnalysisItem(itemId, { status: 'LOCKED' }),
    onSuccess: () => {
      toast.success('Rate locked successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-rates', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      onRatesSaved?.();
      rateApi.calculateAnalysis(analysisId).catch(() => {});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to lock'),
  });

  // ── Unlock single item mutation (Admin only) ────────────────────────────────
  const unlockMutation = useMutation({
    mutationFn: (itemId: string) =>
      rateApi.updateAnalysisItem(itemId, { status: 'PENDING' }),
    onSuccess: () => {
      toast.success('Rate unlocked successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-rates', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      onRatesSaved?.();
      rateApi.calculateAnalysis(analysisId).catch(() => {});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to unlock'),
  });

  // ── Bulk apply mutation ─────────────────────────────────────────────────────
  const bulkApplyMutation = useMutation({
    mutationFn: async (rate: number) => {
      const unlocked = rates.filter(
        (r) => r.status !== 'LOCKED' && r.status !== 'locked'
      );
      await Promise.all(
        unlocked.map((r) =>
          rateApi.updateAnalysisItem(r.itemId, { buyingBestLandingRate: rate })
        )
      );
    },
    onSuccess: () => {
      toast.success('Buying rate applied to all unlocked items');
      queryClient.invalidateQueries({ queryKey: ['purchase-rates', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      setBulkDialogOpen(false);
      setBulkRate('');
      rateApi.calculateAnalysis(analysisId).catch(() => {});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Bulk apply failed'),
  });

  // ── Save detailed dialog edit ───────────────────────────────────────────────
  const saveDialogMutation = useMutation({
    mutationFn: (data: any) => {
      const id = editDialog.item?.itemId;
      if (!id) throw new Error('Item ID missing');
      return rateApi.updateAnalysisItem(id, data);
    },
    onSuccess: () => {
      toast.success('Purchase rate saved');
      queryClient.invalidateQueries({ queryKey: ['purchase-rates', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] });
      setEditDialog({ open: false, item: null });
      onRatesSaved?.();
      rateApi.calculateAnalysis(analysisId).catch(() => {});
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save rate'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleEdit = (item: PurchaseRateItem) => {
    setFormData({ ...item });
    setEditDialog({ open: true, item });
  };

  const handleSaveDialog = () => {
    if (!formData.itemId) return;
    saveDialogMutation.mutate({
      buyingBestLandingRate: formData.buyingBestLandingRate,
      buyingPrice: formData.buyingPrice,
      purchaseCurrency: formData.purchaseCurrency,
      freightCost: formData.freightCost,
      otherCost: formData.otherCost,
      gstPercent: formData.gstPercent,
      location: formData.location,
      remark: formData.remark,
    });
  };

  // ── Computed aggregates ─────────────────────────────────────────────────────
  const lockedCount = useMemo(
    () => rates.filter((r) => r.status === 'LOCKED' || r.status === 'locked').length,
    [rates]
  );

  const missingCount = useMemo(
    () => rates.filter((r) => Number(r.buyingBestLandingRate) === 0).length,
    [rates]
  );

  const totalPurchaseValue = useMemo(
    () =>
      rates.reduce((sum, r) => {
        const rate = Number(r.buyingBestLandingRate);
        const gst  = (rate * Number(r.gstPercent)) / 100;
        return sum + (rate + gst) * Number(r.orderQuantity);
      }, 0),
    [rates]
  );

  // ── Dialog live preview ─────────────────────────────────────────────────────
  const preview = useMemo(() => {
    const rate    = Number(formData.buyingBestLandingRate || 0);
    const qty     = Number(formData.orderQuantity || 0);
    const gstPct  = Number(formData.gstPercent || 0);
    const freight = Number(formData.freightCost || 0);
    const other   = Number(formData.otherCost || 0);
    const gstAmt  = (rate * gstPct) / 100;
    return {
      gstAmt,
      rateWithGst: rate + gstAmt,
      landingCost: rate + freight + other,
      totalValue: (rate + gstAmt) * qty,
    };
  }, [formData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasDirtyFields = Object.keys(dirtyItems).length > 0;

  return (
    <div className="space-y-4">

      {/* ── Top controls ── */}
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
        <div>
          <h3 className="text-base font-bold text-slate-800">Purchase Rates Editor</h3>
          <p className="text-xs text-slate-500">
            Edit rates directly inside the cells. Save changes to trigger calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Copy className="h-3.5 w-3.5" />
            Apply Rate to All
          </Button>

          {hasDirtyFields && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white font-medium h-8 text-xs gap-1.5"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes ({Object.keys(dirtyItems).length})
            </Button>
          )}

          <Badge
            variant="outline"
            className={
              lockedCount > 0 && lockedCount === rates.length
                ? 'bg-green-100 border-green-300 text-green-800 font-semibold h-7'
                : 'bg-amber-100 border-amber-200 text-amber-800 font-semibold h-7'
            }
          >
            <Lock className="h-3 w-3 mr-1" />
            {lockedCount} / {rates.length} Locked
          </Badge>

          <div className="text-right pl-2 border-l">
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wide">Total Purchase Value</p>
            <p className="text-lg font-extrabold text-blue-600 font-mono">
              ₹{totalPurchaseValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Missing rates warning ── */}
      {missingCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{missingCount} item{missingCount > 1 ? 's' : ''} still missing a buying rate.</strong>{' '}
            Analysis cannot be submitted for approval until all buying rates are entered.
          </span>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <Table className="text-xs font-mono">
            <TableHeader className="bg-slate-100 sticky top-0 z-20">
              <TableRow className="divide-x divide-slate-200 border-b">
                <TableHead className="w-16 text-center">Status</TableHead>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead className="min-w-[120px]">Product Code</TableHead>
                <TableHead className="min-w-[150px]">Product Name</TableHead>
                <TableHead className="text-right w-16">Qty</TableHead>
                <TableHead className="text-right w-20">Buying Price (FC)</TableHead>
                <TableHead className="w-16">Currency</TableHead>
                <TableHead className="text-right w-28 font-bold">Buying Rate (₹)</TableHead>
                <TableHead className="w-24">Location</TableHead>
                <TableHead className="w-24">GST Slab</TableHead>
                <TableHead className="text-right w-20">GST Amt (₹)</TableHead>
                <TableHead className="text-right w-20">Freight (₹)</TableHead>
                <TableHead className="text-right w-20">Other Cost (₹)</TableHead>
                <TableHead className="text-right w-24 font-bold text-blue-600">Total incl. GST</TableHead>
                <TableHead className="min-w-[150px]">Remark / Vendor Name</TableHead>
                <TableHead className="w-28 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {rates.map((rate, index) => {
                const r       = Number(rate.buyingBestLandingRate);
                const gstAmt  = (r * Number(rate.gstPercent)) / 100;
                const total   = (r + gstAmt) * Number(rate.orderQuantity);
                const isLocked = rate.status === 'LOCKED' || rate.status === 'locked';
                const canEditRow = !isLocked || isAdmin;

                return (
                  <TableRow
                    key={rate.itemId}
                    className={`divide-x divide-slate-100 hover:bg-slate-50/50 ${
                      isLocked ? 'bg-green-50/20' : r > 0 ? 'bg-yellow-50/10' : ''
                    }`}
                  >
                    <TableCell className="p-1 text-center">
                      <StatusDot rate={r} status={rate.status} />
                    </TableCell>
                    <TableCell className="p-1 text-center text-slate-400">{rate.lineNo}</TableCell>
                    <TableCell className="p-1 font-mono text-slate-700 truncate max-w-[120px]" title={rate.productCode}>{rate.productCode || '-'}</TableCell>
                    <TableCell className="p-1 truncate max-w-[150px]" title={rate.productName}>{rate.productName || '-'}</TableCell>
                    <TableCell className="p-1 text-right text-slate-600 font-semibold">{Number(rate.orderQuantity).toLocaleString()}</TableCell>
                    
                    {/* Buying Price (FC) */}
                    <td className="p-0">
                      <Input
                        type="number"
                        step="0.0001"
                        className="h-7 border-none font-mono text-right p-1 text-xs focus:ring-1 w-20"
                        value={rate.buyingPrice || ''}
                        onChange={(e) => handleItemChange(index, 'buyingPrice', e.target.value)}
                        disabled={!canEditRow}
                        placeholder="0.00"
                      />
                    </td>

                    {/* Purchase Currency */}
                    <td className="p-0">
                      <Select
                        value={rate.purchaseCurrency || 'USD'}
                        onValueChange={(val) => handleItemChange(index, 'purchaseCurrency', val)}
                        disabled={!canEditRow}
                      >
                        <SelectTrigger className="h-7 border-none text-xs w-16 p-1 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Buying Rate (INR) */}
                    <td className="p-0">
                      <Input
                        type="number"
                        step="0.0001"
                        className="h-7 border-none font-mono text-right p-1 text-xs font-bold focus:ring-1 w-28 bg-yellow-50/20"
                        value={rate.buyingBestLandingRate || ''}
                        onChange={(e) => handleItemChange(index, 'buyingBestLandingRate', e.target.value)}
                        disabled={!canEditRow}
                        placeholder="0.00"
                      />
                    </td>

                    {/* Location */}
                    <td className="p-0">
                      <Select
                        value={rate.location || 'DELHI'}
                        onValueChange={(val) => handleItemChange(index, 'location', val)}
                        disabled={!canEditRow}
                      >
                        <SelectTrigger className="h-7 border-none text-xs w-24 p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* GST Slab */}
                    <td className="p-0">
                      <Select
                        value={String(rate.gstPercent ?? 18)}
                        onValueChange={(val) => handleItemChange(index, 'gstPercent', val)}
                        disabled={!canEditRow}
                      >
                        <SelectTrigger className="h-7 border-none text-xs w-24 p-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_OPTIONS.map((g) => (
                            <SelectItem key={g} value={String(g)}>{g}%</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <TableCell className="p-1 text-right text-slate-500 font-mono">
                      {gstAmt > 0 ? `₹${gstAmt.toFixed(2)}` : '₹0.00'}
                    </TableCell>

                    {/* Freight Cost */}
                    <td className="p-0">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 border-none font-mono text-right p-1 text-xs focus:ring-1 w-20"
                        value={rate.freightCost || ''}
                        onChange={(e) => handleItemChange(index, 'freightCost', e.target.value)}
                        disabled={!canEditRow}
                        placeholder="0.00"
                      />
                    </td>

                    {/* Other Cost */}
                    <td className="p-0">
                      <Input
                        type="number"
                        step="0.01"
                        className="h-7 border-none font-mono text-right p-1 text-xs focus:ring-1 w-20"
                        value={rate.otherCost || ''}
                        onChange={(e) => handleItemChange(index, 'otherCost', e.target.value)}
                        disabled={!canEditRow}
                        placeholder="0.00"
                      />
                    </td>

                    <TableCell className="p-1 text-right font-mono font-bold text-blue-600">
                      ₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>

                    {/* Remarks */}
                    <td className="p-0">
                      <Input
                        type="text"
                        className="h-7 border-none font-mono p-1 text-xs focus:ring-1 w-full"
                        value={rate.remark || ''}
                        onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
                        disabled={!canEditRow}
                        placeholder="Vendor / remark..."
                      />
                    </td>

                    <TableCell className="p-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-slate-700"
                          onClick={() => handleEdit(rate)}
                          title="Detailed Calculator"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                        </Button>
                        {!isLocked && r > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-700 hover:text-green-800 hover:bg-green-50"
                            onClick={() => lockMutation.mutate(rate.itemId)}
                            disabled={lockMutation.isPending}
                            title="Lock Rate"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isLocked && isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => unlockMutation.mutate(rate.itemId)}
                            disabled={unlockMutation.isPending}
                            title="Unlock Rate (Admin)"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isLocked && !isAdmin && (
                          <Lock className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {rates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-8 text-slate-400">
                    No items found for this analysis.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Banner ── */}
      {lockedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{lockedCount} rate{lockedCount > 1 ? 's' : ''} locked.</strong>{' '}
            Locked rates cannot be edited by standard users. Admins can unlock them using the unlock button in the grid.
          </span>
        </div>
      )}

      {/* ── Detailed Edit Dialog ── */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => !open && setEditDialog({ open: false, item: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Purchase Rate — Line {formData.lineNo}: {formData.productName}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Buying Price (in Purchase Currency)</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.buyingPrice || ''}
                onChange={(e) =>
                  setFormData({ ...formData, buyingPrice: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.0000"
              />
            </div>

            <div>
              <Label>Purchase Currency</Label>
              <Select
                value={formData.purchaseCurrency || 'USD'}
                onValueChange={(v) => setFormData({ ...formData, purchaseCurrency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Best Landing Rate (INR) *</Label>
              <Input
                type="number"
                step="0.0001"
                value={formData.buyingBestLandingRate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    buyingBestLandingRate: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.0000"
                className="font-mono"
              />
            </div>

            <div>
              <Label>Location *</Label>
              <Select
                value={formData.location || 'DELHI'}
                onValueChange={(v) => setFormData({ ...formData, location: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>GST Slab</Label>
              <Select
                value={String(formData.gstPercent ?? 18)}
                onValueChange={(v) => setFormData({ ...formData, gstPercent: parseFloat(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_OPTIONS.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      {g === 0 ? 'No GST (0%)' : `${g}% GST`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Freight Cost (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.freightCost || ''}
                onChange={(e) =>
                  setFormData({ ...formData, freightCost: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Other Cost (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.otherCost || ''}
                onChange={(e) =>
                  setFormData({ ...formData, otherCost: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Remarks / Vendor Name</Label>
              <Textarea
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="Vendor name, notes..."
                rows={1}
              />
            </div>

            <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-800">Live Calculation Preview</p>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">GST Amount</p>
                  <p className="font-mono font-bold text-blue-900">
                    ₹{preview.gstAmt.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate + GST</p>
                  <p className="font-mono font-bold text-blue-900">
                    ₹{preview.rateWithGst.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Landing Cost (excl. GST)</p>
                  <p className="font-mono font-bold text-blue-900">
                    ₹{preview.landingCost.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-md p-2">
                  <p className="text-xs text-gray-500">Total Purchase Value</p>
                  <p className="font-mono font-bold text-blue-800 text-base">
                    ₹{preview.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, item: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveDialog} disabled={saveDialogMutation.isPending}>
              {saveDialogMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Apply Dialog ── */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Buying Rate to All Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              This will apply the same buying rate (INR) to all{' '}
              <strong>unlocked</strong> items.
            </p>
            <div>
              <Label>Buying Rate (INR) *</Label>
              <Input
                type="number"
                step="0.0001"
                value={bulkRate}
                onChange={(e) => setBulkRate(e.target.value)}
                placeholder="0.0000"
                className="font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && bulkRate)
                    bulkApplyMutation.mutate(parseFloat(bulkRate) || 0);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkApplyMutation.mutate(parseFloat(bulkRate) || 0)}
              disabled={bulkApplyMutation.isPending || !bulkRate}
            >
              {bulkApplyMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Apply to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PurchaseRateEntry;