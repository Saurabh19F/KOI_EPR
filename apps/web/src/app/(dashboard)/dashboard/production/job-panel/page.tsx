'use client';

import { useState, useMemo, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productionApi, inventoryApi } from '@/lib/api';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  PLANNED: { label: 'Planned', color: 'text-green-700', bg: 'bg-green-100' },
  WAITING_FOR_MATERIAL: { label: 'Waiting for Material', color: 'text-orange-700', bg: 'bg-orange-100' },
  READY_FOR_PRODUCTION: { label: 'Material Received', color: 'text-green-700', bg: 'bg-green-100' },
  IN_PROGRESS: { label: 'In Production', color: 'text-blue-700', bg: 'bg-blue-100' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100' },
};

function getWarehouseShort(name: string): string {
  if (!name) return '-';
  const match = name.match(/W\d+|Warehouse\s*(\d+)/i);
  if (match) return match[0].startsWith('W') ? match[0] : `W${match[1]}`;
  return name.length > 6 ? name.substring(0, 6) : name;
}

const ITEMS_PER_PAGE = 10;

export default function ProductionJobPanelPage() {
  const { user } = useAuthStore();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [closingJob, setClosingJob] = useState<any>(null);
  const [closingRemarks, setClosingRemarks] = useState('');
  const [closingQty, setClosingQty] = useState('');
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
    try {
      await productionApi.closeJob(closingJob.jobId, {
        finalProducedQty: closingQty ? Number(closingQty) : closingJob.plannedProductionQty,
        remarks: closingRemarks || undefined,
      });
      toast.success(`Job ${closingJob.jobNumber} marked as completed`);
      setClosingJob(null);
      setClosingRemarks('');
      setClosingQty('');
      refetchJobs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close job');
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Order-Wise Production Control
            </p>
            <h1 className="text-xl font-bold">Production Job & Closing Panel</h1>
          </div>
          <span className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase">
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
                <TableHead className="text-center text-[11px] font-bold uppercase">
                  Material Lines
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
                const totalUsed = closures.reduce(
                  (sum: number, c: any) => sum + (c.usedQty || 0),
                  0,
                );
                const stage = STAGE_CONFIG[job.status] || {
                  label: job.status,
                  color: 'text-gray-600',
                  bg: 'bg-gray-100',
                };
                const materialCount = closures.length;

                return (
                  <Fragment key={job.jobId}>
                    <TableRow className="hover:bg-slate-50">
                      <TableCell className="w-[30px] pr-0">
                        {(materialCount > 0 || merges.length > 0) && (
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

                      <TableCell>
                        <div className="text-sm font-semibold text-blue-600">
                          {job.jobNumber || '-'}
                        </div>
                        {job.orderNo && (
                          <div className="text-[10px] text-muted-foreground">
                            Order: {job.orderNo}
                          </div>
                        )}
                        {job.partyName && (
                          <div className="text-[10px] text-muted-foreground">
                            Buyer: {job.partyName}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
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

                      <TableCell className="text-center">
                        <span className="text-lg font-bold">
                          {job.plannedProductionQty || job.orderQty || '-'}
                        </span>
                        <div className="text-[10px] text-muted-foreground">{job.uom || ''}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        {materialCount > 0 ? (
                          <button
                            onClick={() => toggleExpand(job.jobId)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                          >
                            <Package className="h-3 w-3" />
                            {materialCount} material{materialCount !== 1 ? 's' : ''}
                          </button>
                        ) : merges.length > 0 ? (
                          <button
                            onClick={() => toggleExpand(job.jobId)}
                            className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-200"
                          >
                            {merges.length} merge{merges.length !== 1 ? 's' : ''}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="text-lg font-bold text-green-600">
                          {totalReceived || '-'}
                        </span>
                        {totalUsed > 0 && (
                          <div className="text-[10px] text-muted-foreground">Used {totalUsed}</div>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stage.color} ${stage.bg}`}
                        >
                          {stage.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {(job.status === 'IN_PROGRESS' ||
                            job.status === 'READY_FOR_PRODUCTION') && (
                            <button
                              onClick={() => {
                                setClosingJob(job);
                                setClosingQty(String(job.plannedProductionQty || ''));
                              }}
                              className="rounded bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-green-700"
                            >
                              Complete Production
                            </button>
                          )}
                          {(job.status === 'PLANNED' || job.status === 'DRAFT') && (
                            <button
                              onClick={() => handleStartProduction(job)}
                              className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-blue-700"
                            >
                              Start Production
                            </button>
                          )}
                          {(job.status === 'WAITING_FOR_MATERIAL' ||
                            job.status === 'PLANNED' ||
                            job.status === 'IN_PROGRESS') && (
                            <button className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700">
                              + More Material
                            </button>
                          )}
                          {job.status === 'COMPLETED' && (
                            <span className="text-[10px] font-medium text-green-600">Done</span>
                          )}
                          {job.status === 'CANCELLED' && (
                            <span className="text-[10px] font-medium text-red-500">Cancelled</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Material Lines */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-slate-50/50 p-0">
                          <div className="px-6 py-2">
                            {closures.length > 0 && (
                              <div className="mb-2">
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Material Lines (Received / Used / Returned)
                                </div>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b text-[10px] font-semibold text-slate-500">
                                      <th className="py-1 text-left">Material</th>
                                      <th className="py-1 text-left">Source WH</th>
                                      <th className="py-1 text-center">Received</th>
                                      <th className="py-1 text-center">Used</th>
                                      <th className="py-1 text-center">Returned</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {closures.map((c: any, idx: number) => (
                                      <tr
                                        key={c.closureId || idx}
                                        className="border-b border-dashed last:border-0"
                                      >
                                        <td className="py-1">
                                          <span className="font-medium">
                                            {c.materialName || '-'}
                                          </span>
                                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                                            {c.materialId || ''}
                                          </span>
                                        </td>
                                        <td className="py-1">
                                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                            {getWarehouseShort(c.sourceWarehouseName)}
                                          </span>
                                        </td>
                                        <td className="py-1 text-center font-semibold text-green-600">
                                          {c.receivedQty || 0}
                                        </td>
                                        <td className="py-1 text-center font-semibold text-blue-600">
                                          {c.usedQty || 0}
                                        </td>
                                        <td className="py-1 text-center font-semibold text-orange-600">
                                          {c.returnedQty || 0}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {merges.length > 0 && (
                              <div>
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
                                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                                            {m.mergedItemId || ''}
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
                            )}

                            {closures.length === 0 && merges.length === 0 && (
                              <div className="py-2 text-center text-xs text-muted-foreground">
                                No material data available
                              </div>
                            )}
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

      {/* Complete Production Dialog */}
      <Dialog
        open={!!closingJob}
        onOpenChange={(open) => {
          if (!open) {
            setClosingJob(null);
            setClosingRemarks('');
            setClosingQty('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Production</DialogTitle>
            <DialogDescription>
              Close production job {closingJob?.jobNumber} and record final output.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <strong>Product:</strong> {closingJob?.productName}
              </div>
              <div>
                <strong>Planned Qty:</strong>{' '}
                {closingJob?.plannedProductionQty || closingJob?.orderQty} {closingJob?.uom}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Final Produced Quantity</Label>
              <Input
                type="number"
                value={closingQty}
                onChange={(e) => setClosingQty(e.target.value)}
                placeholder="Enter final quantity"
                className="bg-yellow-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Closing Remarks</Label>
              <Textarea
                value={closingRemarks}
                onChange={(e) => setClosingRemarks(e.target.value)}
                placeholder="Optional closing remarks..."
                className="bg-yellow-50"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setClosingJob(null);
                setClosingRemarks('');
                setClosingQty('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCompleteProduction} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Complete Production
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
