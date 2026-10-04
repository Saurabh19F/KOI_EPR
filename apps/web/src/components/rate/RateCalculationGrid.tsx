'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rateApi, mastersApi, usersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Save, RefreshCw, Loader2, Edit3 } from "lucide-react";
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { roundTo } from '@/lib/calculations';
import './RateCalculationGrid.css';

interface Props {
  analysisId: string;
  analysisNo: string;
  isLocked?: boolean;
  applyAllCurrency?: boolean;
  applyAllHaulage?: boolean;
  globalTargetCurrency?: string;
}

function recalcItem(item: any, currencyRates: Record<string, number>, haulageRates: Record<string, number>, analysis: any): any {
  const updated = { ...item };
  const targetCurr = updated.targetCurrency || 'USD';
  const exchangeRate = currencyRates[targetCurr] || 1;
  const locationUpper = (updated.location || 'DELHI').toUpperCase();
  const unitsPerCase = Number(updated.unitsPerCase || 1);
  const gstPct = Number(updated.gstPercent || 0);

  // Column J: landingCost
  if (!updated.overrides?.landingCost) {
    const activeBuyingPrice = Number(updated.buyingPrice || 0);
    updated.landingCost = activeBuyingPrice;
  }
  const activeBuyingPrice = Number(updated.buyingPrice || updated.landingCost || 0);

  // Column Q: gstAmount
  if (!updated.overrides?.gstAmount) {
    updated.gstAmount = roundTo(activeBuyingPrice * (gstPct / 100), 4);
  }

  // Column R: perPcRateWithoutGst
  if (!updated.overrides?.perPcRateWithoutGst) {
    updated.perPcRateWithoutGst = unitsPerCase > 0 ? roundTo((activeBuyingPrice - updated.gstAmount) / unitsPerCase, 4) : 0;
  }

  // Column S: tax
  if (!updated.overrides?.tax) {
    updated.tax = roundTo(gstPct / 100, 4);
  }

  const otherCost = Number(updated.otherCost || 0);
  const gstCost = Number(updated.gstCost || 0);

  // Column V: totalRatePerBox
  if (!updated.overrides?.totalRatePerBox) {
    updated.totalRatePerBox = roundTo((updated.perPcRateWithoutGst * updated.tax) + updated.perPcRateWithoutGst + otherCost, 4);
  }

  // Column W: rateWithGstCost
  if (!updated.overrides?.rateWithGstCost) {
    updated.rateWithGstCost = roundTo(updated.totalRatePerBox + gstCost, 4);
  }

  const baseFinalPrice = updated.rateWithGstCost / exchangeRate;
  const marginPct = Number(updated.marginPercent || 0);
  const marginFactor = 1 - (Math.min(marginPct, 99.99) / 100);

  // Column X: finalPriceInForeignCurrency
  if (!updated.overrides?.finalPriceInForeignCurrency) {
    updated.finalPriceInForeignCurrency = roundTo(marginFactor > 0 ? baseFinalPrice / marginFactor : baseFinalPrice, 4);
  }

  // Column Y: ratePerCarton
  if (!updated.overrides?.ratePerCarton) {
    updated.ratePerCarton = roundTo(updated.finalPriceInForeignCurrency * unitsPerCase, 4);
  }

  const orderQty = Number(updated.orderQuantity || 0);
  const totalCartons = unitsPerCase > 0 ? Math.ceil(orderQty / unitsPerCase) : 0;
  const cbmPerBox = Number(updated.cbmPerBox || 0);

  // totalCbm
  if (!updated.overrides?.totalCbm) {
    updated.totalCbm = roundTo(totalCartons * cbmPerBox, 4);
  }

  let haulageINR = haulageRates[locationUpper] || (locationUpper === 'MUMBAI' ? 85000 : 195000);
  const defaultLocation = (analysis?.haulageLocation || 'DELHI').toUpperCase();
  if (locationUpper === defaultLocation && Number(analysis?.totalHaulage) > 0) haulageINR = Number(analysis.totalHaulage);
  const shippingTerms = (analysis?.paymentTerms || 'CIF').toUpperCase();
  const freightUSD = Number(analysis?.freightUSD) > 0 ? Number(analysis.freightUSD) : 100;

  // Column AB: selectedHaulage
  if (!updated.overrides?.selectedHaulage) {
    updated.selectedHaulage = shippingTerms === 'FOB'
      ? roundTo(haulageINR / exchangeRate, 2)
      : roundTo((haulageINR / exchangeRate) + freightUSD, 2);
  }

  const containerCapacity = Number(analysis?.containerSize) === 20 ? 28 : 60;

  // Column AA: cbmCostPerBoxInSelectedCurrency
  if (!updated.overrides?.cbmCostPerBoxInSelectedCurrency) {
    updated.cbmCostPerBoxInSelectedCurrency = roundTo((cbmPerBox / containerCapacity) * updated.selectedHaulage, 4);
  }

  // Column AD: finalSellingRate
  if (!updated.overrides?.finalSellingRate) {
    updated.finalSellingRate = roundTo(updated.ratePerCarton + updated.cbmCostPerBoxInSelectedCurrency, 4);
  }

  return updated;
}

function detectOverrides(item: any, currencyRates: Record<string, number>, haulageRates: Record<string, number>, analysis: any): Record<string, boolean> {
  const overrides: Record<string, boolean> = {};
  const calculated = recalcItem({ ...item, overrides: {} }, currencyRates, haulageRates, analysis);
  
  const fields = [
    'landingCost', 'gstAmount', 'perPcRateWithoutGst', 'tax', 
    'totalRatePerBox', 'rateWithGstCost', 'finalPriceInForeignCurrency', 
    'ratePerCarton', 'totalCbm', 'selectedHaulage', 
    'cbmCostPerBoxInSelectedCurrency', 'finalSellingRate'
  ];
  
  fields.forEach(f => {
    if (item[f] !== undefined && item[f] !== null && Math.abs(Number(item[f]) - Number(calculated[f])) > 0.001) {
      overrides[f] = true;
    }
  });
  
  return overrides;
}

export function RateCalculationGrid({ analysisId, isLocked, applyAllCurrency, applyAllHaulage, globalTargetCurrency }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const canEdit = !isLocked || isAdmin;
  const { data: analysisRes, isLoading: isAnalysisLoading, refetch } = useQuery({
    queryKey: ["rate-analysis", analysisId],
    queryFn: () => rateApi.getAnalysisById(analysisId),
  });
  const analysis = analysisRes?.data;
  const originalItems = useMemo(() => analysis?.items || analysis?.analysisItems || [], [analysis]);
  const { data: currencyRatesRes } = useQuery({ queryKey: ["currency-rates"], queryFn: () => rateApi.getCurrencyRates() });
  const { data: haulageRatesRes } = useQuery({ queryKey: ["haulage-rates"], queryFn: () => rateApi.getHaulageRates() });
  const { data: usersRes } = useQuery({ queryKey: ["users-list-grid"], queryFn: () => usersApi.getUsers({ limit: 100 }) });
  const { data: productsRes } = useQuery({ queryKey: ["products-list-grid"], queryFn: () => mastersApi.getProducts({ limit: 500 }) });

  const [items, setItems] = useState<any[]>([]);
  const [dirtyItems, setDirtyItems] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const getPurchaserName = (item: any): string => {
    if (item.purchasePersonName && item.purchasePersonName !== 'N/A' && item.purchasePersonName.trim() !== '') {
      return item.purchasePersonName;
    }
    if (item.productPurchasePersonName && item.productPurchasePersonName !== 'N/A' && item.productPurchasePersonName.trim() !== '') {
      return item.productPurchasePersonName;
    }
    if (item.purchasePerson && item.purchasePerson.trim() !== '') {
      return item.purchasePerson;
    }
    
    const rawProdData: any = productsRes?.data;
    const productsList: any[] = Array.isArray(rawProdData?.data) ? rawProdData.data : Array.isArray(rawProdData) ? rawProdData : [];
    
    const rawUserData: any = usersRes?.data;
    const usersList: any[] = Array.isArray(rawUserData?.data) ? rawUserData.data : Array.isArray(rawUserData) ? rawUserData : [];

    const matchedProduct = productsList.find(
      (p: any) => p.sku === item.sku || p.sku === item.productCode || (item.productId && p.productId === item.productId)
    );
    if (matchedProduct) {
      if (matchedProduct.purchasePersonName && matchedProduct.purchasePersonName.trim() !== '') {
        return matchedProduct.purchasePersonName;
      }
      if (matchedProduct.purchasePersonId) {
        const u = usersList.find((usr: any) => usr.userId === matchedProduct.purchasePersonId);
        if (u) return u.name;
      }
    }

    if (item.purchasePersonId) {
      const u = usersList.find((usr: any) => usr.userId === item.purchasePersonId);
      if (u) return u.name;
    }
    if (item.assignedPurchaseUserId) {
      const u = usersList.find((usr: any) => usr.userId === item.assignedPurchaseUserId);
      if (u) return u.name;
    }

    return '';
  };

  const currencyRates = useMemo(() => {
    const list = currencyRatesRes?.data || [];
    const rates: Record<string, number> = { GBP: 126.25, USD: 93.00, CAD: 64.25, AUD: 63.50, EUR: 104.75, INR: 1 };
    list.forEach((r: any) => { rates[r.currencyCode.toUpperCase()] = Number(r.rate || r.baseRate || 1); });
    if (analysis) {
      if (Number(analysis.gbpRate) > 0) rates['GBP'] = Number(analysis.gbpRate) + Number(analysis.gbpMargin || 0);
      if (Number(analysis.usdRate) > 0) rates['USD'] = Number(analysis.usdRate) + Number(analysis.usdMargin || 0);
      if (Number(analysis.cadRate) > 0) rates['CAD'] = Number(analysis.cadRate) + Number(analysis.cadMargin || 0);
      if (Number(analysis.audRate) > 0) rates['AUD'] = Number(analysis.audRate) + Number(analysis.audMargin || 0);
      if (Number(analysis.euroRate) > 0) rates['EUR'] = Number(analysis.euroRate) + Number(analysis.euroMargin || 0);
    }
    return rates;
  }, [currencyRatesRes, analysis]);
  const haulageRates = useMemo(() => {
    const list = haulageRatesRes?.data || [];
    const rates: Record<string, number> = { DELHI: 195000, MUMBAI: 85000 };
    list.forEach((r: any) => { rates[r.location.toUpperCase()] = Number(r.ratePerCbm || 0); });
    return rates;
  }, [haulageRatesRes]);
  useEffect(() => {
    if (originalItems.length > 0 && analysis) {
      const rawProdData: any = productsRes?.data;
      const productsList: any[] = Array.isArray(rawProdData?.data) ? rawProdData.data : Array.isArray(rawProdData) ? rawProdData : [];

      const recalculated = originalItems.map((item: any) => {
        const itemCopy = JSON.parse(JSON.stringify(item));

        // Sync with Product Master if product exists in Master catalog now!
        const matchedProduct = productsList.find(
          (p: any) =>
            (p.productId && p.productId === itemCopy.productId) ||
            (p.sku && p.sku === itemCopy.sku && p.sku !== 'NOT IN MASTER') ||
            (p.productCode && p.productCode === itemCopy.productCode && p.productCode !== 'NOT IN MASTER') ||
            (p.productName && p.productName.toLowerCase().trim() === (itemCopy.productName || '').toLowerCase().trim())
        );

        if (matchedProduct) {
          if (!itemCopy.productId) itemCopy.productId = matchedProduct.productId || matchedProduct.id;
          if (!itemCopy.sku || itemCopy.sku === 'NOT IN MASTER') itemCopy.sku = matchedProduct.sku || matchedProduct.productCode;
          if (!itemCopy.productCode || itemCopy.productCode === 'NOT IN MASTER') itemCopy.productCode = matchedProduct.productCode || matchedProduct.sku;
          if (!itemCopy.categoryName || itemCopy.categoryName === 'NOT IN MASTER') {
            itemCopy.categoryName = matchedProduct.categoryName || matchedProduct.category?.categoryName || (typeof matchedProduct.category === 'string' ? matchedProduct.category : '');
          }
          if (!itemCopy.unitSize || itemCopy.unitSize === 'NOT IN MASTER') {
            itemCopy.unitSize = matchedProduct.unitSize || '';
          }
          if (!itemCopy.brandName || itemCopy.brandName === 'NOT IN MASTER') {
            itemCopy.brandName = matchedProduct.brandName || matchedProduct.brand?.brandName || '';
          }
          if (!itemCopy.brandId && matchedProduct.brandId) {
            itemCopy.brandId = matchedProduct.brandId;
          }
          if ((!itemCopy.unitsPerCase || itemCopy.unitsPerCase === 1) && (matchedProduct.unitsPerCase || matchedProduct.unitPerCarton)) {
            itemCopy.unitsPerCase = matchedProduct.unitsPerCase || matchedProduct.unitPerCarton;
          }
          if (!itemCopy.cbmPerBox && matchedProduct.cbmPerBox) {
            itemCopy.cbmPerBox = matchedProduct.cbmPerBox;
          }
        }

        if (!itemCopy.purchasePersonName || itemCopy.purchasePersonName === 'N/A' || itemCopy.purchasePersonName === '') {
          const resolved = getPurchaserName(itemCopy);
          if (resolved) itemCopy.purchasePersonName = resolved;
        }
        if (applyAllCurrency && globalTargetCurrency) {
          itemCopy.targetCurrency = globalTargetCurrency;
        }
        const overrides = detectOverrides(itemCopy, currencyRates, haulageRates, analysis);
        itemCopy.overrides = overrides;
        return recalcItem(itemCopy, currencyRates, haulageRates, analysis);
      });
      setItems(recalculated);
      setDirtyItems({});
    }
  }, [originalItems, currencyRatesRes, haulageRatesRes, analysis, usersRes, productsRes, applyAllCurrency, globalTargetCurrency, applyAllHaulage]);
  const totalShipmentCBM = useMemo(() => items.reduce((sum, item) => sum + Number(item.totalCbm || 0), 0) || 1, [items]);
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    let item = { ...newItems[index] };
    const numericFields = [
      'buyingPrice', 'gstPercent', 'marginPercent', 'cbmPerBox', 'orderQuantity', 
      'otherCost', 'gstCost', 'unitsPerCase', 'mrp', 'landingCost', 'gstAmount', 
      'perPcRateWithoutGst', 'tax', 'totalRatePerBox', 'rateWithGstCost', 
      'finalPriceInForeignCurrency', 'ratePerCarton', 'totalCbm', 'selectedHaulage', 
      'cbmCostPerBoxInSelectedCurrency', 'finalSellingRate'
    ];
    
    item[field] = numericFields.includes(field) ? (value === '' ? 0 : Number(value)) : value;
    
    // If they edit a field that is usually calculated by formulas, mark it as overridden!
    const formulaFields = [
      'landingCost', 'gstAmount', 'perPcRateWithoutGst', 'tax', 
      'totalRatePerBox', 'rateWithGstCost', 'finalPriceInForeignCurrency', 
      'ratePerCarton', 'totalCbm', 'selectedHaulage', 
      'cbmCostPerBoxInSelectedCurrency', 'finalSellingRate'
    ];
    if (formulaFields.includes(field)) {
      item.overrides = { ...item.overrides, [field]: true };
    }
    
    item = recalcItem(item, currencyRates, haulageRates, analysis);
    newItems[index] = item;
    setItems(newItems);
    if (item.itemId) setDirtyItems(prev => ({ ...prev, [item.itemId]: true }));
  };
  const calculateMutation = useMutation({
    mutationFn: () => rateApi.calculateAnalysis(analysisId),
    onSuccess: () => { toast.success('Calculations completed & synced'); queryClient.invalidateQueries({ queryKey: ['rate-analysis', analysisId] }); },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to calculate'),
  });
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const toNum = (v: any) => v === '' || v === null || v === undefined ? 0 : Number(v);
    const savePromises = items.filter(item => dirtyItems[item.itemId]).map(item => rateApi.updateAnalysisItem(item.itemId, {
      buyingPrice: toNum(item.buyingPrice), gstPercent: toNum(item.gstPercent), marginPercent: toNum(item.marginPercent),
      cbmPerBox: toNum(item.cbmPerBox), orderQuantity: toNum(item.orderQuantity), otherCost: toNum(item.otherCost),
      gstCost: toNum(item.gstCost), unitsPerCase: toNum(item.unitsPerCase), mrp: toNum(item.mrp), location: item.location,
      targetCurrency: item.targetCurrency, remark: item.remark, packingType: item.packingType,
      selectedHaulageLocation: item.location, selectedHaulage: toNum(item.selectedHaulage), totalCbm: toNum(item.totalCbm),
      gstAmount: toNum(item.gstAmount), landingCost: toNum(item.landingCost), perPcRateWithoutGst: toNum(item.perPcRateWithoutGst),
      tax: toNum(item.tax), totalRatePerBox: toNum(item.totalRatePerBox), rateWithGstCost: toNum(item.rateWithGstCost),
      cbmCostPerBoxInSelectedCurrency: toNum(item.cbmCostPerBoxInSelectedCurrency),
      finalSellingRate: toNum(item.finalSellingRate), ratePerCarton: toNum(item.ratePerCarton),
      finalPriceInForeignCurrency: toNum(item.finalPriceInForeignCurrency),
    }));
    try {
      await Promise.all(savePromises);
      toast.success('All changes saved successfully');
      setDirtyItems({});
      refetch();
    } catch { toast.error('Failed to save some changes'); }
    finally { setIsSaving(false); }
  };
  if (isAnalysisLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  const hasDirtyFields = Object.keys(dirtyItems).length > 0;
  const containerLabel = Number(analysis?.containerSize) === 20 ? '20ft (28 CBM)' : '40ft (60 CBM)';
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Container: {containerLabel}</span>
        </div>
        <div className="flex gap-2">
          {!isLocked && hasDirtyFields && (
            <Button className="bg-green-600 hover:bg-green-700 text-white font-medium" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes ({Object.keys(dirtyItems).length})
            </Button>
          )}
          {!isLocked && (
            <Button variant="secondary" onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending}>
              {calculateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh & Sync Backend
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="grid-scroll-container">
          <table className="rate-grid-table border-collapse text-xs font-mono">
            <thead className="sticky top-0 z-20">
              <tr className="divide-x divide-slate-300">
                <th rowSpan={2} className="bg-slate-700 text-white text-center p-2 text-[10px] border-r sticky-col-1 align-middle">#</th>
                <th rowSpan={2} className="bg-slate-700 text-white text-left p-2 text-[10px] sticky-col-2 min-w-[100px] align-middle">SKU</th>
                <th colSpan={5} className="bg-slate-600 text-white text-center p-1 text-[10px] font-semibold">Product Info</th>
                <th colSpan={7} className="bg-teal-600 text-white text-center p-1 text-[10px] font-semibold">Purchase Team (G–M)</th>
                <th colSpan={12} className="bg-amber-500 text-white text-center p-1 text-[10px] font-semibold">Cost Calculations (N–Y)</th>
                <th colSpan={3} className="bg-blue-600 text-white text-center p-1 text-[10px] font-semibold">Haulage (Z–AB)</th>
                <th colSpan={2} className="bg-purple-600 text-white text-center p-1 text-[10px] font-semibold">Final Rate (AD)</th>
              </tr>
              <tr className="text-[9px] divide-x divide-slate-200">
                <th className="bg-slate-100 p-1 text-slate-700 font-semibold min-w-[140px]">Product Name</th>
                <th className="bg-slate-100 p-1 text-slate-700 font-semibold">Category</th>
                <th className="bg-slate-100 p-1 text-slate-700 font-semibold">Unit Size</th>
                <th className="bg-slate-100 p-1 text-slate-700 font-semibold text-right">Units Per Case</th>
                <th className="bg-slate-100 p-1 text-slate-700 font-semibold text-right">Order Quantity</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold">Purchase Person Name</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold text-right">MRP</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold text-right">GST%</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold text-right">Landing Cost</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold">Remark</th>
                <th className="bg-teal-50 p-1 text-teal-800 font-semibold">Unit (Per Kg / Per Pcs)</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold border-b-2 border-green-400">Packing Type</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold">Location</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold text-right border-b-2 border-green-400">Buying Best Landing Rate</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold text-right">GST%</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold text-right">GST Amount</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold text-right">Per Pc Rate Without GST</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold text-right border-b-2 border-green-400">Tax</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold text-right border-b-2 border-green-400">Other Cost</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold text-right border-b-2 border-green-400">GST Cost</th>
                <th className="bg-amber-50 p-1 text-amber-900 font-bold text-right">Total Rate Per Box</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold text-right">Rate With GST Cost</th>
                <th className="bg-green-100 p-1 text-green-800 font-bold border-b-2 border-green-400">Curr.</th>
                <th className="bg-amber-50 p-1 text-amber-900 font-bold text-right">Final Price in Frg. Currency</th>
                <th className="bg-amber-50 p-1 text-amber-800 font-semibold text-right">Rates Per Carton</th>
                <th className="bg-blue-50 p-1 text-blue-800 font-semibold text-right">CBM Per Box</th>
                <th className="bg-blue-50 p-1 text-blue-900 font-bold text-right">CBM Cost/Box</th>
                <th className="bg-blue-50 p-1 text-blue-800 font-semibold text-right">Haulage</th>
                <th className="bg-purple-50 p-1 text-purple-900 font-bold text-right">Final Rate</th>
                <th className="bg-purple-50 p-1 text-blue-900 font-bold text-right">Final (INR)</th>
                <th className="bg-yellow-50 p-1 text-yellow-800 font-bold text-center border-b-2 border-yellow-400">Re-Quote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, index) => {
                const targetCurr = item.targetCurrency || 'USD';
                const exchangeRate = currencyRates[targetCurr] || 1;
                const isDirty = !!dirtyItems[item.itemId];
                return (
                  <tr key={item.itemId || index}
                    className={`rate-grid-row divide-x divide-slate-100 ${isDirty ? 'bg-yellow-50/40' : ''}`}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}>
                    <td className={`p-1 text-center text-slate-400 border-r sticky-col-1-body text-[10px]${hoveredRow === index ? ' sticky-col-hovered' : ''}`}>
                      {isDirty ? <span className="text-yellow-500 font-bold">●</span> : index + 1}
                    </td>
                    <td className={`p-1 font-medium text-slate-700 truncate sticky-col-2-body text-[10px]${hoveredRow === index ? ' sticky-col-hovered' : ''}`}>
                      {item.productCode || item.sku || '-'}
                    </td>
                    <td className="p-1 text-slate-600 truncate text-[10px] max-w-[140px]" title={item.productName}>{item.productName || '-'}</td>
                    <td className="p-1 text-slate-500 text-[10px] whitespace-nowrap">{item.categoryName || '-'}</td>
                    <td className="p-1 text-right text-slate-500 text-[10px]">{item.unitSize || '-'}</td>
                    {/* Units Per Case — from previous activity (read-only) */}
                    <td className="p-1 text-right text-slate-500 font-mono text-[10px]">{item.unitsPerCase || 0}</td>
                    {/* Order Quantity — from previous activity (read-only) */}
                    <td className="p-1 text-right text-slate-500 font-mono text-[10px]">{item.orderQuantity || 0}</td>
                    {/* Purchase Person Name — from previous activity (read-only) */}
                    <td className="p-1 bg-teal-50/30 text-slate-600 font-mono text-[10px] truncate max-w-[100px]">{item.purchasePersonName || getPurchaserName(item) || '-'}</td>
                    {/* MRP — from previous activity (read-only) */}
                    <td className="p-1 text-right bg-teal-50/30 text-slate-600 font-mono text-[10px]">{Number(item.mrp || 0).toFixed(2)}</td>
                    {/* GST% — from previous activity (read-only) */}
                    <td className="p-1 text-right bg-teal-50/30 text-slate-600 font-mono text-[10px]">{item.gstPercent || 0}</td>
                    {/* Landing Cost — from previous activity (read-only) */}
                    <td className="p-1 text-right bg-teal-50/30 text-teal-700 font-mono font-bold text-[10px]">{Number(item.landingCost || 0).toFixed(2)}</td>
                    {/* Remark — from previous activity (read-only) */}
                    <td className="p-1 bg-teal-50/30 text-slate-500 text-[10px] truncate max-w-[100px]" title={item.remark || ''}>{item.remark || '-'}</td>
                    {/* Unit Type — from previous activity (read-only) */}
                    <td className="p-1 text-slate-500 bg-teal-50/30 text-[10px]">{item.unitBasis || 'Per Pcs'}</td>
                    {/* ✏️ Packing Type — EDITABLE */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      <Select value={item.packingType || 'TIN'} onValueChange={(val) => handleItemChange(index, 'packingType', val)} disabled={!canEdit}>
                        <SelectTrigger className="h-6 border-none text-[10px] w-20 p-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{['TIN','POUCH','JAR','BOTTLE','CAN','BOX','BAG','PACKET','CARTON','CASE','PET BOTTLE','DRUM','CASK','GLASS BOTTLE','TUBE','CUP','TRAY'].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    {/* Location — from previous activity (read-only) */}
                    <td className="p-1 bg-amber-50/30 text-slate-600 text-[10px]">{item.location || 'Delhi'}</td>
                    {/* ✏️ Buying Best Landing Rate — EDITABLE */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      <Input type="number" className="h-6 border-none font-mono text-right p-1 text-[10px] font-bold focus:ring-1 w-22 bg-transparent"
                        value={item.buyingPrice || 0} onChange={(e) => handleItemChange(index, 'buyingPrice', e.target.value)} disabled={!canEdit} />
                    </td>
                    {/* GST% (Cost Calc) — display from previous activity */}
                    <td className="p-1 text-right bg-amber-50/30 text-[10px]">{Number(item.gstPercent || 0).toFixed(1)}%</td>
                    {/* GST Amount — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono text-[10px]">{Number(item.gstAmount || 0).toFixed(2)}</td>
                    {/* Per Pc Rate Without GST — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono text-[10px]">{Number(item.perPcRateWithoutGst || 0).toFixed(2)}</td>
                    {/* ✏️ Tax — EDITABLE */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      <Input type="number" className="h-6 border-none font-mono text-right p-1 text-[10px] focus:ring-1 w-18 bg-transparent"
                        value={item.tax || 0} onChange={(e) => handleItemChange(index, 'tax', e.target.value)} disabled={!canEdit} />
                    </td>
                    {/* ✏️ Other Cost — EDITABLE */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      <Input type="number" className="h-6 border-none font-mono text-right p-1 text-[10px] focus:ring-1 w-18 bg-transparent"
                        value={item.otherCost || 0} onChange={(e) => handleItemChange(index, 'otherCost', e.target.value)} disabled={!canEdit} />
                    </td>
                    {/* ✏️ GST Cost — EDITABLE */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      <Input type="number" className="h-6 border-none font-mono text-right p-1 text-[10px] focus:ring-1 w-18 bg-transparent"
                        value={item.gstCost || 0} onChange={(e) => handleItemChange(index, 'gstCost', e.target.value)} disabled={!canEdit} />
                    </td>
                    {/* Total Rate Per Box — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono font-bold text-amber-700 text-[10px]">{Number(item.totalRatePerBox || 0).toFixed(2)}</td>
                    {/* Rate With GST Cost — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono text-[10px]">{Number(item.rateWithGstCost || 0).toFixed(2)}</td>
                    {/* Currency — editable per product or global */}
                    <td className="p-0 bg-green-50/50 border-l border-r border-green-200">
                      {applyAllCurrency ? (
                        <span className="block h-6 px-1 text-[10px] font-mono font-bold text-blue-700 leading-6 text-center">{globalTargetCurrency || 'USD'}</span>
                      ) : (
                        <Select value={item.targetCurrency || 'USD'} onValueChange={(val) => handleItemChange(index, 'targetCurrency', val)} disabled={!canEdit}>
                          <SelectTrigger className="h-6 border-none text-[10px] w-16 p-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{['USD','GBP','EUR','CAD','AUD'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </td>
                    {/* Final Price in Frg. Currency — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono font-bold text-amber-700 text-[10px]">{Number(item.finalPriceInForeignCurrency || 0).toFixed(4)}</td>
                    {/* Rates Per Carton — calculated (read-only) */}
                    <td className="p-1 text-right bg-amber-50/30 font-mono text-[10px]">{Number(item.ratePerCarton || 0).toFixed(2)}</td>
                    {/* CBM Per Box — from previous activity (read-only) */}
                    <td className="p-1 text-right bg-blue-50/30 font-mono text-[10px]">{Number(item.cbmPerBox || 0).toFixed(4)}</td>
                    {/* CBM Cost/Box — calculated (read-only) */}
                    <td className="p-1 text-right bg-blue-50/30 font-mono font-bold text-blue-700 text-[10px]">{Number(item.cbmCostPerBoxInSelectedCurrency || 0).toFixed(4)}</td>
                    {/* Haulage — editable per product or global */}
                    <td className={`p-0 ${applyAllHaulage ? 'bg-blue-50/30' : 'bg-yellow-50'}`}>
                      {applyAllHaulage ? (
                        <span className="block h-6 px-1 text-[10px] font-mono leading-6 text-right">{Number(item.selectedHaulage || 0).toFixed(1)}</span>
                      ) : (
                        <Input type="number" className="h-6 border-none font-mono text-right p-1 text-[10px] focus:ring-1 w-18 bg-transparent"
                          value={item.selectedHaulage || 0} onChange={(e) => handleItemChange(index, 'selectedHaulage', e.target.value)} disabled={!canEdit} />
                      )}
                    </td>
                    {/* Final Rate — calculated (read-only) */}
                    <td className="p-1 text-right bg-purple-50/20 font-mono font-extrabold text-purple-700 text-[10px]">{Number(item.finalSellingRate || 0).toFixed(4)}</td>
                    {/* Final (INR) — calculated (read-only) */}
                    <td className="p-1 text-right font-extrabold text-blue-700 bg-purple-50/20 text-[10px] whitespace-nowrap">₹{Number((item.finalSellingRate || 0) * exchangeRate).toFixed(2)}</td>
                    {/* Re-Quote — checkbox per product */}
                    <td className="p-1 text-center bg-yellow-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-orange-500 cursor-pointer"
                        checked={item.requoteStatus === 'requote_requested' || item.requoteStatus === 'requote_in_progress' || item.requoteStatus === 'requote_completed'}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...newItems[index], requoteStatus: e.target.checked ? 'requote_requested' : 'none' };
                          setItems(newItems);
                        }}
                        disabled={!canEdit}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Calculator className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No items found. Price Analysis items will load once available.</p>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-5 gap-4 text-xs font-mono">
          <div><p className="text-slate-500 font-medium uppercase text-[10px]">Total Items</p><p className="text-lg font-bold text-slate-800">{items.length}</p></div>
          <div><p className="text-slate-500 font-medium uppercase text-[10px]">Total Order Qty</p><p className="text-lg font-bold text-slate-800">{items.reduce((s:number,i:any)=>s+Number(i.orderQuantity||0),0).toLocaleString()}</p></div>
          <div><p className="text-slate-500 font-medium uppercase text-[10px]">Total Shipment CBM</p><p className="text-lg font-bold text-slate-800">{totalShipmentCBM.toFixed(4)} CBM</p></div>
          <div><p className="text-slate-500 font-medium uppercase text-[10px]">Items Ready</p><p className="text-lg font-bold text-green-700">{items.filter((i:any)=>i.finalSellingRate>0).length} / {items.length}</p></div>
          <div><p className="text-slate-500 font-medium uppercase text-[10px]">Unsaved Changes</p><p className={`text-lg font-bold ${hasDirtyFields?'text-yellow-600':'text-slate-400'}`}>{Object.keys(dirtyItems).length} items</p></div>
        </div>
      )}
    </div>
  );
}

export default RateCalculationGrid;
