'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productionApi, mastersApi, inventoryApi, inventoryTrackingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ArrowLeft, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  'Morning (6 AM - 10 AM)',
  'Mid Morning (10 AM - 12 PM)',
  'Afternoon (12 PM - 3 PM)',
  'Evening (3 PM - 6 PM)',
  'Night (6 PM - 9 PM)',
];

interface MaterialStage {
  id: number;
  label: string;
  sublabel: string;
  purpose: string;
  showCategory: boolean;
  categoryId: string;
  sourceWarehouseId: string;
  materialId: string;
  materialName: string;
  requiredQty: string;
}

const PVT_LABEL_STAGES: MaterialStage[] = [
  { id: 1, label: 'Material', sublabel: 'Select a material', purpose: 'Material', showCategory: false, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
  { id: 2, label: 'Primary Pack', sublabel: 'Optional material', purpose: 'Primary Pack', showCategory: true, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
  { id: 3, label: 'Secondary Pack', sublabel: 'Optional material', purpose: 'Secondary Pack', showCategory: true, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
  { id: 4, label: 'Outer Pack', sublabel: 'Optional material', purpose: 'Outer Pack', showCategory: true, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
];

const PRIMARY_PACK_CATEGORIES = [
  'Plain Pouch',
  'Branded Pouch Print',
  'LD/PP/Other',
  'Jar Plain',
  'Branded Jar',
  'Cap/Seal',
  'Other',
];

const SECONDARY_PACK_CATEGORIES = [
  'Label',
  'Tray',
  'Lamination Tray',
  'Tape',
  'Other',
];

const OUTER_PACK_CATEGORIES = [
  'Tray',
  'Carton Plain',
  'Branded Carton',
];

const EXTRA_STAGE_PURPOSES = [
  'Material',
  'Primary Pack',
  'Secondary Pack',
  'Outer Pack',
  'Labeling',
  'Printing',
  'Reprinted',
  'Repacking',
];

const STAGE_CATEGORIES: Record<string, string[]> = {
  'Primary Pack': PRIMARY_PACK_CATEGORIES,
  'Secondary Pack': SECONDARY_PACK_CATEGORIES,
  'Outer Pack': OUTER_PACK_CATEGORIES,
};

const FMCG_STAGES: MaterialStage[] = [
  { id: 1, label: 'Labelling', sublabel: 'Optional material', purpose: 'Labelling', showCategory: false, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
  { id: 2, label: 'Printing', sublabel: 'Optional material', purpose: 'Printing', showCategory: false, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
  { id: 3, label: 'Repacking', sublabel: 'Optional material', purpose: 'Repacking', showCategory: false, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
];

function getWarehouseShort(name: string): string {
  if (!name) return '';
  const match = name.match(/W\d+|Warehouse\s*(\d+)/i);
  if (match) return match[0].startsWith('W') ? match[0] : `W${match[1]}`;
  return name.length > 6 ? name.substring(0, 6) : name;
}

export default function CreateMaterialRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { user } = useAuthStore();
  const warehouseId = user?.warehouseId;

  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [warehouseRemarks, setWarehouseRemarks] = useState('');
  const [productionRemarks, setProductionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [extraStages, setExtraStages] = useState<MaterialStage[]>([]);
  const [stages, setStages] = useState<MaterialStage[]>(PVT_LABEL_STAGES.map(s => ({ ...s })));

  const { data: jobData } = useQuery({
    queryKey: ['production-job', jobId],
    queryFn: () => productionApi.getJob(jobId!).then(r => r.data),
    enabled: !!jobId,
  });

  const job = jobData?.data || jobData;

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehousesData?.data || [];

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => mastersApi.getCategories(),
  });
  const categories: any[] = categoriesData?.data || [];

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => mastersApi.getProducts({ limit: 1000 }).then(r => r.data),
  });
  const allProducts: any[] = productsData?.data || [];

  const productSearchTerm = useMemo(() => {
    if (!job?.productName) return '';
    const words = job.productName.split(/[\s*x]+/).filter((w: string) => w.length > 2 && !/^\d+g?$/i.test(w));
    return words[0] || '';
  }, [job]);

  const { data: searchedProductData } = useQuery({
    queryKey: ['product-search', productSearchTerm],
    queryFn: () => mastersApi.getProducts({ limit: 10, search: productSearchTerm }).then(r => r.data),
    enabled: !!productSearchTerm,
  });
  const searchedProducts: any[] = searchedProductData?.data || [];

  const productionWarehouse = useMemo(() => {
    return warehouseList.find((w: any) => w.id === (job?.warehouseId || warehouseId));
  }, [warehouseList, job, warehouseId]);

  const matchedProduct = useMemo(() => {
    if (!job?.productId) return null;
    const pool = [...allProducts, ...searchedProducts];
    const byId = pool.find((pr: any) => pr.productId === job.productId || pr.id === job.productId);
    if (byId) return byId;
    if (!job.productName) return null;
    const jobName = job.productName.toLowerCase().trim();
    const byExactName = pool.find((pr: any) => pr.productName?.toLowerCase().trim() === jobName);
    if (byExactName) return byExactName;
    const keywords = jobName.split(/[\s*x]+/).filter((w: string) => w.length > 2 && !/^\d+g?$/i.test(w));
    if (keywords.length > 0) {
      return pool.find((pr: any) => {
        const pn = (pr.productName || '').toLowerCase();
        return keywords.every((kw: string) => pn.includes(kw));
      }) || null;
    }
    return null;
  }, [allProducts, searchedProducts, job]);

  const skuType = useMemo(() => {
    const sku = (matchedProduct?.sku || '').toUpperCase();
    if (sku.includes('-PVT-')) return 'Pvt Label';
    if (sku.includes('-BR-')) return 'FMCG';
    if (sku && !sku.includes('-PVT-')) return 'FMCG';
    if (!job?.productName) return '';
    const name = job.productName.toUpperCase();
    if (name.includes('PVT') || name.includes('PRIVATE')) return 'Pvt Label';
    return 'FMCG';
  }, [matchedProduct, job]);

  const brand = useMemo(() => {
    if (!matchedProduct) return '';
    if (matchedProduct.brand?.brandName) return matchedProduct.brand.brandName;
    const sku = matchedProduct.sku || '';
    const parts = sku.split('-');
    if (parts.length >= 3) {
      const afterPrefix = sku.replace(/^KOI-(PVT|BR)?-?/i, '').replace(/-D\d+$/, '');
      const nameSegments = afterPrefix.split('-').filter(Boolean);
      if (nameSegments.length > 0) return nameSegments[0];
    }
    return '';
  }, [matchedProduct]);

  useEffect(() => {
    const isFmcg = skuType === 'FMCG';
    const template = isFmcg ? FMCG_STAGES : PVT_LABEL_STAGES;
    setStages(template.map(s => ({ ...s })));
    setExtraStages([]);
  }, [skuType]);

  const updateStage = (idx: number, field: keyof MaterialStage, value: string) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addExtraStage = () => {
    const nextId = stages.length + extraStages.length + 1;
    setExtraStages(prev => [
      ...prev,
      { id: nextId, label: `Extra Material ${prev.length + 1}`, sublabel: 'Additional material', purpose: '', showCategory: false, categoryId: '', sourceWarehouseId: '', materialId: '', materialName: '', requiredQty: '' },
    ]);
  };

  const updateExtraStage = (idx: number, field: keyof MaterialStage, value: string) => {
    setExtraStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeExtraStage = (idx: number) => {
    setExtraStages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!job || !warehouseId) {
      toast.error('Missing production job or warehouse context');
      return;
    }
    if (!requiredDate) {
      toast.error('Please select material required date');
      return;
    }
    if (!timeSlot) {
      toast.error('Please select a time slot');
      return;
    }

    const allStages = [...stages, ...extraStages];
    const validStages = allStages.filter(s => s.materialId && s.sourceWarehouseId && Number(s.requiredQty) > 0);

    if (validStages.length === 0) {
      toast.error('Please add at least one material with source warehouse and quantity');
      return;
    }

    setSubmitting(true);

    try {
      const sourceGroups: Record<string, { sourceWarehouseId: string; sourceWarehouseName: string; items: { productId: string; productName: string; qty: number }[] }> = {};

      for (const s of validStages) {
        const wh = warehouseList.find((w: any) => w.id === s.sourceWarehouseId);
        if (!sourceGroups[s.sourceWarehouseId]) {
          sourceGroups[s.sourceWarehouseId] = {
            sourceWarehouseId: s.sourceWarehouseId,
            sourceWarehouseName: wh?.name || s.sourceWarehouseId,
            items: [],
          };
        }
        sourceGroups[s.sourceWarehouseId].items.push({
          productId: s.materialId,
          productName: s.materialName,
          qty: Number(s.requiredQty),
        });
      }

      const remarks = [
        warehouseRemarks && `WH Remarks: ${warehouseRemarks}`,
        productionRemarks && `Production Remarks: ${productionRemarks}`,
        `Required Date: ${requiredDate}`,
        `Time Slot: ${timeSlot}`,
      ].filter(Boolean).join(' | ');

      for (const group of Object.values(sourceGroups)) {
        await inventoryTrackingApi.requestMaterial(warehouseId, {
          sourceWarehouseId: group.sourceWarehouseId,
          sourceWarehouseName: group.sourceWarehouseName,
          orderNo: job.orderNo,
          requestType: 'material_request',
          productionId: job.jobId,
          remarks,
          items: group.items,
        });
      }

      toast.success('Material request sent successfully!');
      router.push('/dashboard/production/job-panel');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send material request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!jobId) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No production job selected.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/production/job-panel')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Job Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create Material Request</h1>
      </div>

      {/* Purple Production Plan Header */}
      {job && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-700 via-purple-700 to-purple-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-200">
                Assigned Production Plan
              </p>
              <h2 className="mt-1 text-lg font-bold leading-tight">
                {job.productName || '-'}
              </h2>
              <p className="mt-0.5 text-xs text-purple-200">
                {job.productId || ''}
              </p>
            </div>
            <div className="rounded-lg border border-purple-400/40 bg-purple-800/50 px-4 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                Assigned Quantity
              </p>
              <p className="text-xl font-bold">
                {job.plannedProductionQty || job.orderQty || '-'} X {(job.uom || '').replace('CTN', '').trim() || 'UNIT'}
              </p>
              <p className="text-xs font-semibold text-purple-200">
                CTN {job.unitPerCarton || '-'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-lg bg-purple-900/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-purple-300">Sales Order</p>
              <p className="text-sm font-bold">{job.orderNo || '-'}</p>
            </div>
            <div className="flex-1 rounded-lg bg-purple-900/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-purple-300">Production ID</p>
              <p className="text-sm font-bold">{job.jobNumber || '-'}</p>
            </div>
            <div className="flex-1 rounded-lg bg-purple-900/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-purple-300">Production Warehouse</p>
              <p className="text-sm font-bold">{getWarehouseShort(productionWarehouse?.name || job.warehouseName || '') || 'W1'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Material Required Date & Time Slot */}
      <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50/50 p-5">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Material Required Date *
            </Label>
            <Input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="mt-1.5 bg-white"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Time Slot *
            </Label>
            <SearchableSelect
              value={timeSlot}
              onValueChange={setTimeSlot}
              options={TIME_SLOTS.map((s) => ({ value: s, label: s }))}
              placeholder="Select Time Slot"
              className="mt-1.5 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Required Materials Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Required Materials (Stage wise)</h2>
        <Button
          variant="default"
          size="sm"
          className="bg-indigo-700 hover:bg-indigo-800"
          onClick={addExtraStage}
        >
          + Add Extra Material
        </Button>
      </div>

      {/* SKU Type & Brand */}
      {(skuType || brand) && (
        <div className="flex items-center gap-4 text-sm">
          {skuType && (
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-slate-500">SKU Type:</span>
              <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                {skuType} <span className="text-indigo-200">(AUTO)</span>
              </span>
            </div>
          )}
          {brand && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500">Brand</span>
              <span className="rounded border bg-white px-3 py-0.5 text-sm">{brand}</span>
            </div>
          )}
        </div>
      )}

      {/* Material Stages */}
      {stages.map((stage, idx) => (
        <div key={stage.id} className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {stage.id}
            </span>
            <div>
              <h3 className="font-bold">{stage.label}</h3>
              <p className="text-xs text-muted-foreground">{stage.sublabel}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`grid gap-4 ${stage.showCategory ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Stage / Purpose</Label>
                <div className="mt-1 rounded border bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
                  {stage.purpose}
                </div>
              </div>
              {stage.showCategory && (
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">Category *</Label>
                  <SearchableSelect
                    value={stage.categoryId}
                    onValueChange={(v) => updateStage(idx, 'categoryId', v)}
                    options={(STAGE_CATEGORIES[stage.purpose] || []).map((cat) => ({ value: cat, label: cat }))}
                    placeholder="Select Category"
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Source Warehouse *</Label>
                <SearchableSelect
                  value={stage.sourceWarehouseId}
                  onValueChange={(v) => updateStage(idx, 'sourceWarehouseId', v)}
                  options={warehouseList.map((wh: any) => ({ value: wh.id, label: wh.name }))}
                  placeholder="Select Source WH"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_200px] gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Material / Item</Label>
                <Input
                  className="mt-1"
                  placeholder={stage.showCategory ? 'Enter packing material name' : 'Search material...'}
                  value={stage.materialName}
                  onChange={(e) => {
                    updateStage(idx, 'materialName', e.target.value);
                    updateStage(idx, 'materialId', e.target.value);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Required Qty</Label>
                <Input
                  type="number"
                  value={stage.requiredQty}
                  onChange={(e) => updateStage(idx, 'requiredQty', e.target.value)}
                  placeholder="Enter Qty"
                  className="mt-1 bg-yellow-50"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Extra Stages */}
      {extraStages.map((stage, idx) => (
        <div key={`extra-${idx}`} className="relative rounded-xl border bg-white p-5 shadow-sm">
          <button
            onClick={() => removeExtraStage(idx)}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
              {stages.length + idx + 1}
            </span>
            <div>
              <h3 className="font-bold">{stage.label}</h3>
              <p className="text-xs text-muted-foreground">{stage.sublabel}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`grid gap-4 ${STAGE_CATEGORIES[stage.purpose] ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Stage / Purpose</Label>
                <SearchableSelect
                  value={stage.purpose}
                  onValueChange={(v) => {
                    updateExtraStage(idx, 'purpose', v);
                    updateExtraStage(idx, 'label', v);
                    updateExtraStage(idx, 'categoryId', '');
                  }}
                  options={EXTRA_STAGE_PURPOSES.map((p) => ({ value: p, label: p }))}
                  placeholder="Select Stage"
                  className="mt-1"
                />
              </div>
              {STAGE_CATEGORIES[stage.purpose] && (
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">Category *</Label>
                  <SearchableSelect
                    value={stage.categoryId}
                    onValueChange={(v) => updateExtraStage(idx, 'categoryId', v)}
                    options={STAGE_CATEGORIES[stage.purpose].map((cat) => ({ value: cat, label: cat }))}
                    placeholder="Select Category"
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Source Warehouse *</Label>
                <SearchableSelect
                  value={stage.sourceWarehouseId}
                  onValueChange={(v) => updateExtraStage(idx, 'sourceWarehouseId', v)}
                  options={warehouseList.map((wh: any) => ({ value: wh.id, label: wh.name }))}
                  placeholder="Select Source WH"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_200px] gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Material / Item</Label>
                <Input
                  className="mt-1"
                  placeholder="Search material..."
                  value={stage.materialName}
                  onChange={(e) => {
                    updateExtraStage(idx, 'materialName', e.target.value);
                    updateExtraStage(idx, 'materialId', e.target.value);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Required Qty</Label>
                <Input
                  type="number"
                  value={stage.requiredQty}
                  onChange={(e) => updateExtraStage(idx, 'requiredQty', e.target.value)}
                  placeholder="Enter Qty"
                  className="mt-1 bg-yellow-50"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Remarks */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Warehouse Request Remarks
            </Label>
            <Textarea
              value={warehouseRemarks}
              onChange={(e) => setWarehouseRemarks(e.target.value)}
              placeholder="Optional request remarks"
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Production Job Remarks
            </Label>
            <Textarea
              value={productionRemarks}
              onChange={(e) => setProductionRemarks(e.target.value)}
              placeholder="Optional production remarks"
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <Button
          size="lg"
          className="bg-emerald-600 px-8 hover:bg-emerald-700"
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? 'Sending...' : 'Send Material Request'}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="px-8"
          onClick={() => router.push('/dashboard/production/job-panel')}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
