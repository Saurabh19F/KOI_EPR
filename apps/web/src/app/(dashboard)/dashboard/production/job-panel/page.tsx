'use client';

import { useState, useMemo, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productionApi, inventoryApi, filesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Factory,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  ShoppingCart,
  Package,
  Upload,
  X,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; stageText: string; stepIndex: number }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100', stageText: 'Job Created', stepIndex: 0 },
  PLANNED: { label: 'Planned', color: 'text-green-700', bg: 'bg-green-100', stageText: 'Material Requested', stepIndex: 1 },
  WAITING_FOR_MATERIAL: { label: 'Waiting for Material', color: 'text-orange-700', bg: 'bg-orange-100', stageText: 'Material Dispatched', stepIndex: 2 },
  READY_FOR_PRODUCTION: { label: 'Material Received', color: 'text-green-700', bg: 'bg-green-100', stageText: 'Material Received', stepIndex: 3 },
  IN_PROGRESS: { label: 'In Production', color: 'text-blue-700', bg: 'bg-blue-100', stageText: 'Production In Progress', stepIndex: 4 },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100', stageText: 'Production Completed', stepIndex: 5 },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100', stageText: 'Job Cancelled', stepIndex: -1 },
};

const PRODUCTION_STEPS = ['Assigned', 'Request', 'Dispatch', 'Receive', 'Ready', 'Done'];

function getWarehouseShort(name: string): string {
  if (!name) return '-';
  const match = name.match(/W\d+|Warehouse\s*(\d+)/i);
  if (match) return match[0].startsWith('W') ? match[0] : `W${match[1]}`;
  return name.length > 6 ? name.substring(0, 6) : name;
}

const ITEMS_PER_PAGE = 10;

export default function ProductionJobPanelPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [closingJob, setClosingJob] = useState<any>(null);
  const [closingRemarks, setClosingRemarks] = useState('');
  const [closingQty, setClosingQty] = useState('');
  const [closingBatchNo, setClosingBatchNo] = useState('');
  const [closingMfgDate, setClosingMfgDate] = useState('');
  const [closingShelfLife, setClosingShelfLife] = useState('');
  const [closingExpiryDate, setClosingExpiryDate] = useState('');
  const [closingCartonCount, setClosingCartonCount] = useState('');
  const [closingUpc, setClosingUpc] = useState('');
  const [closingTotalPieces, setClosingTotalPieces] = useState('');
  const [closingActualCbm, setClosingActualCbm] = useState('');
  const [closingNetWeight, setClosingNetWeight] = useState('');
  const [closingGrossWeight, setClosingGrossWeight] = useState('');
  const [closingWasteSort, setClosingWasteSort] = useState('');
  const [closingWasteHusk, setClosingWasteHusk] = useState('');
  const [closingWasteDamaged, setClosingWasteDamaged] = useState('');
  const [closingWasteOther, setClosingWasteOther] = useState('');
  const [closingPhotos, setClosingPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [closingSubmitting, setClosingSubmitting] = useState(false);
  const [detailJob, setDetailJob] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehousesData?.data || [];

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['production-jobs-panel', warehouseId],
    queryFn: () => productionApi.getJobs({ limit: 500, warehouseId }).then(res => res.data),
  });

  const { data: closuresData } = useQuery({
    queryKey: ['production-closures-panel'],
    queryFn: () => productionApi.getMaterialClosures({ limit: 500 }).then(res => res.data),
  });

  const { data: mergesData } = useQuery({
    queryKey: ['production-merges-panel'],
    queryFn: () => productionApi.getMergeDetails({ limit: 500 }).then(res => res.data),
  });

  const allJobs: any[] = jobsData?.data || [];
  const allClosures: any[] = closuresData?.data || [];
  const allMerges: any[] = mergesData?.data || [];

  const closuresByJob = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of allClosures) {
      if (!map[c.productionJobId]) map[c.productionJobId] = [];
      map[c.productionJobId].push(c);
    }
    return map;
  }, [allClosures]);

  const mergesByJob = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const m of allMerges) {
      if (!map[m.productionJobId]) map[m.productionJobId] = [];
      map[m.productionJobId].push(m);
    }
    return map;
  }, [allMerges]);

  const filteredJobs = useMemo(() => {
    let filtered = allJobs;
    if (statusFilter !== '__all__') {
      filtered = filtered.filter((j: any) => j.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (j: any) =>
          j.jobNumber?.toLowerCase().includes(q) ||
          j.productName?.toLowerCase().includes(q) ||
          j.orderNo?.toLowerCase().includes(q) ||
          j.partyName?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [allJobs, statusFilter, search]);

  const stats = useMemo(() => {
    const totalJobs = allJobs.length;
    const inProgress = allJobs.filter(
      (j: any) =>
        j.status === 'IN_PROGRESS' ||
        j.status === 'WAITING_FOR_MATERIAL' ||
        j.status === 'READY_FOR_PRODUCTION',
    ).length;
    const completed = allJobs.filter((j: any) => j.status === 'COMPLETED').length;
    const salesOrders = new Set(allJobs.map((j: any) => j.orderNo).filter(Boolean)).size;
    return { totalJobs, inProgress, completed, salesOrders };
  }, [allJobs]);

  const activeWarehouse = useMemo(() => {
    const wh = warehouseList.find((w: any) => w.id === warehouseId);
    return wh ? getWarehouseShort(wh.name) : 'N/A';
  }, [warehouseList, warehouseId]);

  const closingWasteTotal = useMemo(() => {
    return (Number(closingWasteSort) || 0) +
      (Number(closingWasteHusk) || 0) +
      (Number(closingWasteDamaged) || 0) +
      (Number(closingWasteOther) || 0);
  }, [closingWasteSort, closingWasteHusk, closingWasteDamaged, closingWasteOther]);

  const handleMfgDateChange = useCallback((date: string) => {
    setClosingMfgDate(date);
    if (date && closingShelfLife) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + Number(closingShelfLife));
      setClosingExpiryDate(d.toISOString().split('T')[0]);
    }
  }, [closingShelfLife]);

  const handleShelfLifeChange = useCallback((months: string) => {
    setClosingShelfLife(months);
    if (closingMfgDate && months) {
      const d = new Date(closingMfgDate);
      d.setMonth(d.getMonth() + Number(months));
      setClosingExpiryDate(d.toISOString().split('T')[0]);
    }
  }, [closingMfgDate]);

  const handleCartonCalc = useCallback((cartons: string, upc: string) => {
    setClosingCartonCount(cartons);
    setClosingUpc(upc);
    const c = Number(cartons) || 0;
    const u = Number(upc) || 0;
    if (c > 0 && u > 0) {
      setClosingTotalPieces(String(c * u));
    }
  }, []);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !closingJob) return;
    if (closingPhotos.length >= 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    setUploadingPhoto(true);
    try {
      const presigned = await filesApi.getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName: 'production-evidence',
      });
      const { uploadUrl, key } = presigned.data.data;
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await filesApi.confirmUpload({
        storageKey: key,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName: 'production-evidence',
        recordId: closingJob.jobId,
      });
      setClosingPhotos(prev => [...prev, key]);
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }, [closingJob, closingPhotos.length]);

  const resetClosingForm = useCallback(() => {
    setClosingJob(null);
    setClosingRemarks('');
    setClosingQty('');
    setClosingBatchNo('');
    setClosingMfgDate('');
    setClosingShelfLife('');
    setClosingExpiryDate('');
    setClosingCartonCount('');
    setClosingUpc('');
    setClosingTotalPieces('');
    setClosingActualCbm('');
    setClosingNetWeight('');
    setClosingGrossWeight('');
    setClosingWasteSort('');
    setClosingWasteHusk('');
    setClosingWasteDamaged('');
    setClosingWasteOther('');
    setClosingPhotos([]);
    setClosingSubmitting(false);
  }, []);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const toggleExpand = (jobId: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const handleCompleteProduction = async () => {
    if (!closingJob) return;
    if (!closingBatchNo.trim()) { toast.error('Batch number is required'); return; }
    if (!closingMfgDate) { toast.error('MFG date is required'); return; }
    if (!closingShelfLife || Number(closingShelfLife) < 1) { toast.error('Shelf life must be at least 1 month'); return; }
    if (!closingActualCbm) { toast.error('Actual CBM is required'); return; }
    if (closingPhotos.length < 1) { toast.error('At least 1 evidence photo is required'); return; }
    if (closingPhotos.length > 5) { toast.error('Maximum 5 evidence photos'); return; }

    setClosingSubmitting(true);
    try {
      await productionApi.closeJob(closingJob.jobId, {
        finalProducedQty: closingQty ? Number(closingQty) : closingJob.plannedProductionQty,
        batchNo: closingBatchNo.trim(),
        mfgDate: closingMfgDate,
        expiryDate: closingExpiryDate || undefined,
        shelfLifeMonths: Number(closingShelfLife),
        cartonCount: closingCartonCount ? Number(closingCartonCount) : undefined,
        totalPieces: closingTotalPieces ? Number(closingTotalPieces) : undefined,
        actualCbm: Number(closingActualCbm),
        netWeight: closingNetWeight ? Number(closingNetWeight) : undefined,
        grossWeight: closingGrossWeight ? Number(closingGrossWeight) : undefined,
        wasteQty: closingWasteTotal > 0 ? closingWasteTotal : undefined,
        wasteBreakdown: closingWasteTotal > 0 ? {
          sort: Number(closingWasteSort) || 0,
          husk: Number(closingWasteHusk) || 0,
          damaged: Number(closingWasteDamaged) || 0,
          other: Number(closingWasteOther) || 0,
        } : undefined,
        evidencePhotos: closingPhotos,
        remarks: closingRemarks || undefined,
      });
      toast.success(`Job ${closingJob.jobNumber} marked as completed`);
      resetClosingForm();
      refetchJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close job');
    } finally {
      setClosingSubmitting(false);
    }
  };

  const handleStartProduction = async (job: any) => {
    try {
      await productionApi.startJob(job.jobId);
      toast.success(`Job ${job.jobNumber} started`);
      refetchJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start job');
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Production Job & Closing Panel', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          'Job No',
          'Order No',
          'Product',
          'Planned Qty',
          'UOM',
          'Party',
          'Warehouse',
          'Status',
          'Start Date',
          'Material Summary',
        ],
      ],
      body: filteredJobs.map((j: any) => {
        const closures = closuresByJob[j.jobId] || [];
        const materialSummary =
          closures
            .map((c: any) => `${c.materialName}: Recd ${c.receivedQty || 0}`)
            .join('; ') || '-';
        return [
          j.jobNumber || '-',
          j.orderNo || '-',
          j.productName || '-',
          j.plannedProductionQty || j.orderQty || '-',
          j.uom || '-',
          j.partyName || '-',
          j.warehouseName || '-',
          STAGE_CONFIG[j.status]?.label || j.status,
          j.startDate ? new Date(j.startDate).toLocaleDateString() : '-',
          materialSummary,
        ];
      }),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save('production-job-panel.pdf');
    toast.success('PDF downloaded');
  };

  const handleDownloadExcel = () => {
    const headers = [
      'Job No',
      'Order No',
      'Product Name',
      'Product ID',
      'Planned Qty',
      'Produced Qty',
      'UOM',
      'Party Name',
      'Warehouse',
      'Status',
      'Start Date',
      'Closing Date',
      'Remarks',
    ];
    const rows = filteredJobs.map((j: any) => [
      j.jobNumber,
      j.orderNo,
      j.productName,
      j.productId,
      j.plannedProductionQty || j.orderQty,
      j.finalProducedQty || '',
      j.uom,
      j.partyName,
      j.warehouseName,
      STAGE_CONFIG[j.status]?.label || j.status,
      j.startDate ? new Date(j.startDate).toLocaleDateString() : '',
      j.closingDate ? new Date(j.closingDate).toLocaleDateString() : '',
      j.remarks || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'production-job-panel.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel file downloaded');
  };

  return (
    <div className="space-y-4">
      {/* Dark Navy Header */}
      <div className="rounded-lg bg-slate-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-200">
              Order-Wise Production Control
            </p>
            <h1 className="text-xl font-bold">Production Job & Closing Panel</h1>
          </div>
          <span className="rounded bg-emerald-800 px-3 py-1 text-xs font-semibold uppercase">
            Active Production Warehouse {activeWarehouse}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded bg-blue-100 p-1.5">
              <Factory className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded bg-orange-100 p-1.5">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded bg-green-100 p-1.5">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded bg-purple-100 p-1.5">
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sales Orders</p>
              <p className="text-xl font-bold text-purple-600">{stats.salesOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, orders, products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Stages</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PLANNED">Planned</SelectItem>
            <SelectItem value="WAITING_FOR_MATERIAL">Waiting for Material</SelectItem>
            <SelectItem value="READY_FOR_PRODUCTION">Material Received</SelectItem>
            <SelectItem value="IN_PROGRESS">In Production</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Excel
        </Button>
        <span className="rounded bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Automatic Assignment View
        </span>
      </div>

      {/* Section Label */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Production Order Control
        </h2>
        <span className="text-xs text-muted-foreground">({filteredJobs.length} jobs)</span>
      </div>

      {/* Main Table */}
      {jobsLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Loading production jobs...
        </div>
      ) : paginatedJobs.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          No production jobs found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[30px]" />
                <TableHead className="text-[11px] font-bold uppercase">
                  Order / Production ID
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Assigned Product</TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Assigned Qty
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase">
                  Material Lines (REQ / DISP / RECD)
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Total Received
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Production Stage
                </TableHead>
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Next Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedJobs.map((job: any) => {
                const isExpanded = expandedJobs.has(job.jobId);
                const closures = closuresByJob[job.jobId] || [];
                const merges = mergesByJob[job.jobId] || [];
                const totalReceived = closures.reduce(
                  (sum: number, c: any) => sum + (c.receivedQty || 0),
                  0,
                );
                const totalDispatched = closures.reduce(
                  (sum: number, c: any) => sum + (c.usedQty || 0),
                  0,
                );
                const stage = STAGE_CONFIG[job.status?.toUpperCase()] || STAGE_CONFIG[job.status] || {
                  label: job.status,
                  color: 'text-gray-600',
                  bg: 'bg-gray-100',
                  stageText: job.status,
                  stepIndex: -1,
                };
                const materialCount = closures.length;

                return (
                  <Fragment key={job.jobId}>
                    <TableRow className="align-top hover:bg-slate-50">
                      <TableCell className="w-[30px] pr-0 pt-4">
                        {merges.length > 0 && (
                          <button
                            onClick={() => toggleExpand(job.jobId)}
                            className="p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </TableCell>

                      {/* Order / Production ID */}
                      <TableCell className="pt-4">
                        <div className="text-sm font-bold text-blue-600">
                          {job.orderNo || '-'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {job.jobNumber || '-'}
                        </div>
                        {job.startDate && (
                          <div className="text-[10px] text-muted-foreground">
                            End Date: {new Date(job.closingDate || job.startDate).toLocaleDateString('en-CA')}
                          </div>
                        )}
                        {job.partyName && (
                          <div className="text-[10px] text-muted-foreground">
                            Buyer: {job.partyName}
                          </div>
                        )}
                      </TableCell>

                      {/* Assigned Product */}
                      <TableCell className="pt-4">
                        <div className="text-sm font-semibold">{job.productName || '-'}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {job.productId || ''}
                        </div>
                        {job.orderQty && (
                          <div className="text-[10px] text-muted-foreground">
                            Order: {job.orderQty} {job.uom || ''}
                          </div>
                        )}
                      </TableCell>

                      {/* Assigned Qty */}
                      <TableCell className="pt-4 text-center">
                        <span className="text-lg font-bold">
                          {job.plannedProductionQty || job.orderQty || '-'}
                        </span>
                      </TableCell>

                      {/* Material Lines (REQ / DISP / RECD) - shown inline */}
                      <TableCell className="min-w-[280px] pt-3">
                        {materialCount > 0 ? (
                          <div className="space-y-3">
                            {closures.map((c: any, idx: number) => (
                              <div key={c.closureId || idx} className="border-b border-dashed pb-2 last:border-0 last:pb-0">
                                <div className="text-xs font-medium">
                                  PACK-MANUAL:{c.materialName || '-'}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {getWarehouseShort(c.sourceWarehouseName || 'W1')}
                                </div>
                                <div className="mt-1 flex items-end gap-4">
                                  <div>
                                    <div className="text-[9px] font-medium uppercase text-muted-foreground">Requested</div>
                                    <div className="text-sm font-bold text-green-600">{c.receivedQty || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-medium uppercase text-muted-foreground">Issued</div>
                                    <div className="text-sm font-bold text-purple-600">{c.usedQty || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-medium uppercase text-muted-foreground">Received</div>
                                    <div className="text-sm font-bold text-green-600">{c.receivedQty || 0}</div>
                                  </div>
                                </div>
                                <div className="text-[10px] font-medium text-green-600">Received</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No materials</span>
                        )}
                      </TableCell>

                      {/* Total Received */}
                      <TableCell className="pt-4 text-center">
                        <div className="text-xl font-bold text-green-600">
                          {totalReceived || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Disp {totalDispatched} / Req {totalReceived}
                        </div>
                      </TableCell>

                      {/* Production Stage with progress bar */}
                      <TableCell className="min-w-[200px] pt-4 text-center">
                        <div className="text-xs font-semibold">{stage.stageText}</div>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${stage.color} border-current`}
                        >
                          {stage.label}
                        </span>
                        <div className="mt-2 flex items-center justify-center gap-0.5 text-[8px] text-muted-foreground">
                          {PRODUCTION_STEPS.map((step, i) => (
                            <Fragment key={step}>
                              <span className={i <= stage.stepIndex ? 'font-semibold text-slate-700' : ''}>
                                {step}
                              </span>
                              {i < PRODUCTION_STEPS.length - 1 && (
                                <span className="mx-0.5">→</span>
                              )}
                            </Fragment>
                          ))}
                        </div>
                      </TableCell>

                      {/* Next Action - View Details button */}
                      <TableCell className="pt-4 text-center">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-slate-900 text-xs hover:bg-slate-800"
                          onClick={() => setDetailJob(job)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Merge Details */}
                    {isExpanded && merges.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-slate-50/50 p-0">
                          <div className="px-6 py-2">
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Production Output (Merge Details)
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b text-[10px] font-semibold text-slate-500">
                                  <th className="py-1 text-left">Merged Item</th>
                                  <th className="py-1 text-center">Qty</th>
                                  <th className="py-1 text-left">Work Details</th>
                                  <th className="py-1 text-left">Entered By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {merges.map((m: any, idx: number) => (
                                  <tr
                                    key={m.mergeId || idx}
                                    className="border-b border-dashed last:border-0"
                                  >
                                    <td className="py-1">
                                      <span className="font-medium">
                                        {m.mergedItemName || '-'}
                                      </span>
                                    </td>
                                    <td className="py-1 text-center font-semibold text-purple-600">
                                      {m.mergedQty || 0} {m.uom || ''}
                                    </td>
                                    <td className="py-1 text-muted-foreground">
                                      {m.workDetails || '-'}
                                    </td>
                                    <td className="py-1 text-muted-foreground">
                                      {m.enteredBy || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length}{' '}
            entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[32px]"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Complete Production Dialog — Full Closing Form */}
      <Dialog open={!!closingJob} onOpenChange={(open) => { if (!open) resetClosingForm(); }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" /> Production Closing — {closingJob?.jobNumber}
            </DialogTitle>
            <DialogDescription>
              Record final output, billing, batch, weight, waste and evidence photos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Job Summary */}
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div><span className="text-xs font-medium uppercase text-muted-foreground">Product</span><div className="font-semibold">{closingJob?.productName}</div></div>
              <div><span className="text-xs font-medium uppercase text-muted-foreground">Planned Qty</span><div className="font-semibold">{closingJob?.plannedProductionQty || closingJob?.orderQty} {closingJob?.uom}</div></div>
              <div><span className="text-xs font-medium uppercase text-muted-foreground">UPC (Unit/Carton)</span><div className="font-semibold">{closingJob?.unitPerCarton || '-'}</div></div>
            </div>

            {/* Section: Final Output */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Final Output</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Final Produced Quantity *</Label>
                  <Input type="number" value={closingQty} onChange={(e) => setClosingQty(e.target.value)} placeholder="Produced qty" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Batch Number *</Label>
                  <Input value={closingBatchNo} onChange={(e) => setClosingBatchNo(e.target.value)} placeholder="e.g. BATCH-2026-001" className="bg-yellow-50" />
                </div>
              </div>
            </div>

            {/* Section: Billing — CTN × UPC = PCS */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Billing (Carton Calculation)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Carton Count (CTN)</Label>
                  <Input type="number" value={closingCartonCount} onChange={(e) => handleCartonCalc(e.target.value, closingUpc)} placeholder="No. of cartons" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Unit Per Carton (UPC)</Label>
                  <Input type="number" value={closingUpc} onChange={(e) => handleCartonCalc(closingCartonCount, e.target.value)} placeholder="Units per carton" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Total Pieces (PCS)</Label>
                  <Input type="number" value={closingTotalPieces} readOnly className="bg-slate-100 font-semibold" placeholder="Auto: CTN × UPC" />
                </div>
              </div>
            </div>

            {/* Section: Dates & Shelf Life */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Manufacturing Dates</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>MFG Date *</Label>
                  <Input type="date" value={closingMfgDate} onChange={(e) => handleMfgDateChange(e.target.value)} className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Shelf Life (Months) *</Label>
                  <Input type="number" min="1" value={closingShelfLife} onChange={(e) => handleShelfLifeChange(e.target.value)} placeholder="e.g. 12" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={closingExpiryDate} readOnly className="bg-slate-100 font-semibold" />
                </div>
              </div>
            </div>

            {/* Section: CBM & Weight */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">CBM & Weight</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Actual CBM *</Label>
                  <Input type="number" step="0.0001" value={closingActualCbm} onChange={(e) => setClosingActualCbm(e.target.value)} placeholder="Cubic meters" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Net Weight (kg)</Label>
                  <Input type="number" step="0.001" value={closingNetWeight} onChange={(e) => setClosingNetWeight(e.target.value)} placeholder="Net weight" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Gross Weight (kg)</Label>
                  <Input type="number" step="0.001" value={closingGrossWeight} onChange={(e) => setClosingGrossWeight(e.target.value)} placeholder="Gross weight" className="bg-yellow-50" />
                </div>
              </div>
            </div>

            {/* Section: Waste Breakdown */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Waste Breakdown</h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label>Sort</Label>
                  <Input type="number" value={closingWasteSort} onChange={(e) => setClosingWasteSort(e.target.value)} placeholder="0" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Husk</Label>
                  <Input type="number" value={closingWasteHusk} onChange={(e) => setClosingWasteHusk(e.target.value)} placeholder="0" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Damaged</Label>
                  <Input type="number" value={closingWasteDamaged} onChange={(e) => setClosingWasteDamaged(e.target.value)} placeholder="0" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Other</Label>
                  <Input type="number" value={closingWasteOther} onChange={(e) => setClosingWasteOther(e.target.value)} placeholder="0" className="bg-yellow-50" />
                </div>
                <div className="space-y-1">
                  <Label>Total Waste</Label>
                  <Input type="number" value={closingWasteTotal} readOnly className="bg-slate-100 font-semibold" />
                </div>
              </div>
            </div>

            {/* Section: Material Reconciliation (read-only from closures) */}
            {closingJob && (() => {
              const jobClosures = closuresByJob[closingJob.jobId] || [];
              if (jobClosures.length === 0) return null;
              return (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Material Reconciliation</h4>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                          <th className="px-3 py-2 text-left">Material</th>
                          <th className="px-3 py-2 text-center">Received</th>
                          <th className="px-3 py-2 text-center">Used</th>
                          <th className="px-3 py-2 text-center">Returned</th>
                          <th className="px-3 py-2 text-center">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobClosures.map((c: any, idx: number) => {
                          const received = Number(c.receivedQty) || 0;
                          const used = Number(c.usedQty) || 0;
                          const returned = Number(c.returnedQty) || 0;
                          const variance = received - used - returned;
                          return (
                            <tr key={c.closureId || idx} className="border-b last:border-0">
                              <td className="px-3 py-2 font-medium">{c.materialName || '-'}</td>
                              <td className="px-3 py-2 text-center font-semibold text-green-600">{received}</td>
                              <td className="px-3 py-2 text-center font-semibold text-purple-600">{used}</td>
                              <td className="px-3 py-2 text-center font-semibold text-orange-600">{returned}</td>
                              <td className="px-3 py-2 text-center">
                                {variance === 0 ? (
                                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">OK</span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 text-xs font-semibold text-red-600">
                                    <AlertTriangle className="h-3 w-3" /> {variance > 0 ? '+' : ''}{variance}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Section: Evidence Photos */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                Evidence Photos * <span className="font-normal normal-case text-muted-foreground">({closingPhotos.length}/5 — material-ready images)</span>
              </h4>
              <div className="flex flex-wrap gap-3">
                {closingPhotos.map((key, idx) => (
                  <div key={key} className="relative h-20 w-20 rounded-lg border bg-slate-100 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-slate-400" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[9px] text-white rounded-b-lg">Photo {idx + 1}</span>
                    <button onClick={() => setClosingPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {closingPhotos.length < 5 && (
                  <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-yellow-50 hover:border-slate-400">
                    {uploadingPhoto ? (
                      <span className="text-[10px] text-muted-foreground">Uploading...</span>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="text-[9px] text-muted-foreground">Add Photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label>Closing Remarks</Label>
              <Textarea value={closingRemarks} onChange={(e) => setClosingRemarks(e.target.value)} placeholder="Optional closing remarks..." className="bg-yellow-50" rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetClosingForm} disabled={closingSubmitting}>Cancel</Button>
            <Button onClick={handleCompleteProduction} className="bg-green-600 hover:bg-green-700" disabled={closingSubmitting || uploadingPhoto}>
              <CheckCircle className="mr-1.5 h-4 w-4" /> {closingSubmitting ? 'Submitting...' : 'Complete Production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Closing Details Dialog */}
      <Dialog
        open={!!detailJob}
        onOpenChange={(open) => {
          if (!open) setDetailJob(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Factory className="h-5 w-5" />
              Production Closing Details
            </DialogTitle>
            <DialogDescription>
              Complete production information for {detailJob?.jobNumber}
            </DialogDescription>
          </DialogHeader>

          {detailJob && (() => {
            const djClosures = closuresByJob[detailJob.jobId] || [];
            const djMerges = mergesByJob[detailJob.jobId] || [];
            const djStage = STAGE_CONFIG[detailJob.status?.toUpperCase()] || STAGE_CONFIG[detailJob.status] || { label: detailJob.status, color: 'text-gray-600', bg: 'bg-gray-100' };

            return (
              <div className="space-y-5">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border bg-slate-50 p-4 text-sm">
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Production ID</span>
                    <div className="font-semibold">{detailJob.jobNumber || '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Order No</span>
                    <div className="font-semibold text-blue-600">{detailJob.orderNo || '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Status</span>
                    <div>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${djStage.color} ${djStage.bg}`}>
                        {djStage.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Product</span>
                    <div className="font-semibold">{detailJob.productName || '-'}</div>
                    <div className="text-[10px] text-muted-foreground">{detailJob.productId || ''}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Planned Qty</span>
                    <div className="font-semibold">{detailJob.plannedProductionQty || detailJob.orderQty || '-'} {detailJob.uom || ''}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Final Produced Qty</span>
                    <div className="font-semibold text-green-600">{detailJob.finalProducedQty || '0'} {detailJob.uom || ''}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Started Date</span>
                    <div className="font-semibold">
                      {detailJob.startDate ? new Date(detailJob.startDate).toLocaleDateString('en-IN') : '-'}
                    </div>
                    {detailJob.startedBy && (
                      <div className="text-[10px] text-muted-foreground">By: {detailJob.startedBy}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Closing Date</span>
                    <div className="font-semibold">
                      {detailJob.closingDate ? new Date(detailJob.closingDate).toLocaleDateString('en-IN') : '-'}
                    </div>
                    {detailJob.closedBy && (
                      <div className="text-[10px] text-muted-foreground">By: {detailJob.closedBy}</div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Buyer / Party</span>
                    <div className="font-semibold">{detailJob.partyName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground">Warehouse</span>
                    <div className="font-semibold">{detailJob.warehouseName || '-'}</div>
                  </div>
                  {detailJob.remarks && (
                    <div className="col-span-2">
                      <span className="text-xs font-medium uppercase text-muted-foreground">Remarks</span>
                      <div className="text-sm">{detailJob.remarks}</div>
                    </div>
                  )}
                  {detailJob.processDetails && (
                    <div className="col-span-2">
                      <span className="text-xs font-medium uppercase text-muted-foreground">Process Details</span>
                      <div className="text-sm">{detailJob.processDetails}</div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  {(detailJob.status?.toUpperCase() === 'DRAFT' || detailJob.status?.toUpperCase() === 'PLANNED') && (
                    <Button
                      size="sm"
                      className="bg-indigo-700 hover:bg-indigo-800"
                      onClick={() => {
                        setDetailJob(null);
                        router.push(`/dashboard/production/create-material-request?jobId=${detailJob.jobId}`);
                      }}
                    >
                      <Package className="mr-1.5 h-4 w-4" /> Request Material
                    </Button>
                  )}
                  {(detailJob.status?.toUpperCase() === 'IN_PROGRESS' || detailJob.status?.toUpperCase() === 'READY_FOR_PRODUCTION') && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setDetailJob(null);
                        setClosingJob(detailJob);
                        setClosingQty(String(detailJob.plannedProductionQty || ''));
                        if (detailJob.unitPerCarton) setClosingUpc(detailJob.unitPerCarton);
                      }}
                    >
                      <CheckCircle className="mr-1.5 h-4 w-4" /> Complete Production
                    </Button>
                  )}
                </div>

                {/* Material Closure Table */}
                <div>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-600">
                    Material Closure ({djClosures.length})
                  </h3>
                  {djClosures.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                            <th className="px-3 py-2 text-left">Material</th>
                            <th className="px-3 py-2 text-left">Source Warehouse</th>
                            <th className="px-3 py-2 text-center">Received Qty</th>
                            <th className="px-3 py-2 text-center">Used / Final Qty</th>
                            <th className="px-3 py-2 text-center">Returned Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {djClosures.map((c: any, idx: number) => (
                            <tr key={c.closureId || idx} className="border-b last:border-0">
                              <td className="px-3 py-2">
                                <div className="font-medium">{c.materialName || '-'}</div>
                                <div className="text-[10px] text-muted-foreground">PACK-MANUAL</div>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{c.sourceWarehouseName || '-'}</td>
                              <td className="px-3 py-2 text-center font-semibold text-green-600">{c.receivedQty || 0}</td>
                              <td className="px-3 py-2 text-center font-semibold text-purple-600">{c.usedQty || 0}</td>
                              <td className="px-3 py-2 text-center font-semibold text-orange-600">{c.returnedQty || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-slate-50 p-4 text-center text-sm text-muted-foreground">
                      No material closure records
                    </div>
                  )}
                </div>

                {/* Merge Details if any */}
                {djMerges.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-600">
                      Production Output ({djMerges.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                            <th className="px-3 py-2 text-left">Merged Item</th>
                            <th className="px-3 py-2 text-center">Qty</th>
                            <th className="px-3 py-2 text-left">Work Details</th>
                            <th className="px-3 py-2 text-left">Entered By</th>
                            <th className="px-3 py-2 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {djMerges.map((m: any, idx: number) => (
                            <tr key={m.mergeId || idx} className="border-b last:border-0">
                              <td className="px-3 py-2 font-medium">{m.mergedItemName || '-'}</td>
                              <td className="px-3 py-2 text-center font-semibold text-purple-600">{m.mergedQty || 0} {m.uom || ''}</td>
                              <td className="px-3 py-2 text-muted-foreground">{m.workDetails || '-'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{m.enteredBy || '-'}</td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {m.entryDate ? new Date(m.entryDate).toLocaleDateString('en-IN') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailJob(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
