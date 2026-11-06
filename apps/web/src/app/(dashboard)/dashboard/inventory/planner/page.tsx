'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receivingPlanApi, inventoryApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Search,
  RefreshCw,
  Plus,
  X,
  ClipboardList,
  Check,
  XCircle,
  Warehouse as WarehouseIcon,
  Trash2,
  Download,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Settings2,
  GitBranch,
} from 'lucide-react';
import { WorkflowTracker } from '@/components/workflow/workflow-tracker';

interface PlannerItem {
  poId: string;
  poNumber: string;
  productId: string;
  productName: string;
  productCode: string;
  itemDescription: string;
  vendorName: string;
  qty: number;
  plannedQty: number;
  unplannedQty: number;
  uom: string;
  expectedDate: string;
  purchasePerson: string;
  salesPerson: string;
  buyerCode: string;
  location: string;
  orderNo: string;
  poStatus: string;
}

interface AllocationLine {
  warehouseId: string;
  warehouseName: string;
  qty: string;
}

interface TransferRequest {
  transferId: string;
  transferNumber: string;
  transferDate: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  totalQuantity: number;
  status: string;
  requestedByUsername: string;
  requestRemarks: string;
  notes: string;
  items?: any[];
}

type ViewTab = 'pending' | 'allocated' | 'approvals' | 'warehouses' | 'workflow';

export default function PlannerPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ViewTab>('pending');
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [allocateItem, setAllocateItem] = useState<PlannerItem | null>(null);
  const [allocations, setAllocations] = useState<AllocationLine[]>([{ warehouseId: '', warehouseName: '', qty: '' }]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkWarehouseId, setBulkWarehouseId] = useState('');
  const [bulkAllocationsMap, setBulkAllocationsMap] = useState<Record<string, AllocationLine[]>>({});
  const [rejectDialogTransferId, setRejectDialogTransferId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseCode, setNewWarehouseCode] = useState('');
  const [newWarehouseAddress, setNewWarehouseAddress] = useState('');

  // Filter states (dropdowns use '__all__' as the "no filter" sentinel since shadcn Select needs a truthy value)
  const [filterPoId, setFilterPoId] = useState('__all__');
  const [filterOrderNo, setFilterOrderNo] = useState('');
  const [filterProductCode, setFilterProductCode] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterVendorName, setFilterVendorName] = useState('__all__');
  const [filterExpectedDate, setFilterExpectedDate] = useState('');
  const [filtersApplied, setFiltersApplied] = useState(false);

  const queryClient = useQueryClient();

  const { data: plannerData, isLoading, refetch } = useQuery({
    queryKey: ['planner-data', search, page],
    queryFn: () => receivingPlanApi.getPlannerData({ search: search || undefined, page, limit: 100 }).then((res) => res.data),
  });

  const { data: warehousesData, refetch: refetchWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses().then((res) => res.data),
  });

  const { data: pendingTransfersData, refetch: refetchTransfers } = useQuery({
    queryKey: ['pending-transfers'],
    queryFn: () => inventoryApi.getTransfers({ status: 'pending', limit: 100 }).then((res) => res.data),
    enabled: tab === 'approvals',
  });

  const warehouses: any[] = Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.data || [];
  const pendingTransfers: TransferRequest[] = Array.isArray(pendingTransfersData)
    ? pendingTransfersData
    : (pendingTransfersData as any)?.data || [];

  // ---- Mutations ----

  const allocateMutation = useMutation({
    mutationFn: (data: any) => receivingPlanApi.allocateToWarehouses(data),
    onSuccess: () => {
      toast.success('Allocation saved successfully');
      queryClient.invalidateQueries({ queryKey: ['planner-data'] });
      handleCloseAllocate();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Allocation failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const bulkAllocateMutation = useMutation({
    mutationFn: (data: any) => receivingPlanApi.bulkAllocate(data),
    onSuccess: (res) => {
      const result = res.data;
      toast.success(`Bulk allocation complete: ${result.completed} items allocated`);
      queryClient.invalidateQueries({ queryKey: ['planner-data'] });
      setShowBulkDialog(false);
      setSelectedItems(new Set());
      setBulkWarehouseId('');
      setBulkAllocationsMap({});
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Bulk allocation failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (transferId: string) => inventoryApi.approveTransfer(transferId),
    onSuccess: () => {
      toast.success('Transfer approved');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Approve failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ transferId, reason }: { transferId: string; reason?: string }) =>
      inventoryApi.rejectTransfer(transferId, reason),
    onSuccess: () => {
      toast.success('Transfer rejected');
      setRejectDialogTransferId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Reject failed';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const addWarehouseMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.createWarehouse(data),
    onSuccess: () => {
      toast.success('Warehouse added');
      setShowAddWarehouse(false);
      setNewWarehouseName('');
      setNewWarehouseCode('');
      setNewWarehouseAddress('');
      refetchWarehouses();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to add warehouse';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Warehouse deleted');
      refetchWarehouses();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete warehouse';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // ---- Computed data ----

  const allItems: PlannerItem[] = plannerData?.pendingPOs || [];
  const pendingItems = useMemo(() => allItems.filter((i) => i.unplannedQty > 0), [allItems]);
  const allocatedItems = useMemo(() => allItems.filter((i) => i.plannedQty > 0), [allItems]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    const source = tab === 'pending' ? pendingItems : allocatedItems;
    if (!filtersApplied) return source;

    return source.filter((item) => {
      const poFilter = filterPoId !== '__all__' ? filterPoId : '';
      const vendorFilter = filterVendorName !== '__all__' ? filterVendorName : '';
      if (poFilter && !item.poNumber.toLowerCase().includes(poFilter.toLowerCase())) return false;
      if (filterOrderNo && !item.orderNo?.toLowerCase().includes(filterOrderNo.toLowerCase())) return false;
      if (filterProductCode && !item.productCode?.toLowerCase().includes(filterProductCode.toLowerCase())) return false;
      if (filterItemName && !(item.itemDescription || item.productName).toLowerCase().includes(filterItemName.toLowerCase())) return false;
      if (vendorFilter && !item.vendorName?.toLowerCase().includes(vendorFilter.toLowerCase())) return false;
      if (filterExpectedDate && item.expectedDate) {
        const itemDate = new Date(item.expectedDate).toISOString().split('T')[0];
        if (itemDate !== filterExpectedDate) return false;
      } else if (filterExpectedDate && !item.expectedDate) {
        return false;
      }
      return true;
    });
  }, [tab, pendingItems, allocatedItems, filtersApplied, filterPoId, filterOrderNo, filterProductCode, filterItemName, filterVendorName, filterExpectedDate]);

  const displayItems = filteredItems;

  const unplannedOrderCount = plannerData?.unplannedOrderCount || 0;
  const plannedAllocationCount = plannerData?.plannedAllocationCount || 0;

  const itemKey = (item: PlannerItem) => `${item.poId}___${item.productId}`;

  // ---- Filter unique values for dropdowns ----
  const filterOptions = useMemo(() => {
    const source = tab === 'pending' ? pendingItems : allocatedItems;
    const poIds = [...new Set(source.map((i) => i.poNumber).filter(Boolean))].sort();
    const orderNos = [...new Set(source.map((i) => i.orderNo).filter(Boolean))].sort();
    const productCodes = [...new Set(source.map((i) => i.productCode).filter(Boolean))].sort();
    const itemNames = [...new Set(source.map((i) => i.itemDescription || i.productName).filter(Boolean))].sort();
    const vendorNames = [...new Set(source.map((i) => i.vendorName).filter(Boolean))].sort();
    return { poIds, orderNos, productCodes, itemNames, vendorNames };
  }, [tab, pendingItems, allocatedItems]);

  // ---- Filter handlers ----

  const handleApplyFilters = () => {
    setFiltersApplied(true);
  };

  const handleResetFilters = () => {
    setFilterPoId('__all__');
    setFilterOrderNo('');
    setFilterProductCode('');
    setFilterItemName('');
    setFilterVendorName('__all__');
    setFilterExpectedDate('');
    setFiltersApplied(false);
  };

  // ---- Download handlers ----

  const handleDownloadExcel = useCallback(() => {
    if (displayItems.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'PO ID', 'Sales Order No', 'Product Code', 'Product Detail', 'UOM',
      'Buyer Code', 'Sales Person', 'Purchaser', 'Vendor', 'Expected Date',
      'Location', 'Qty', 'Planned Qty', 'Unplanned Qty', 'Last Edit Status',
    ];

    const rows = displayItems.map((item) => [
      item.poNumber,
      item.orderNo || '',
      item.productCode || '',
      item.itemDescription || item.productName,
      item.uom || '',
      item.buyerCode || '',
      item.salesPerson || '',
      item.purchasePerson || '',
      item.vendorName || '',
      item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : '',
      item.location || '',
      item.qty,
      item.plannedQty,
      item.unplannedQty,
      item.poStatus || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => {
          const str = String(cell);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      )
      .join('\n');

    const BOM = '﻿';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Planner_${tab === 'pending' ? 'Pending' : 'Allocated'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Excel (CSV) downloaded');
  }, [displayItems, tab]);

  const handleDownloadPdf = useCallback(async () => {
    if (displayItems.length === 0) {
      toast.error('No data to export');
      return;
    }

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const headers = [
      'PO ID', 'Order No', 'Product Code', 'Item Name', 'Vendor',
      'Expected Date', 'Qty', 'Planned', 'Unplanned', 'Status',
    ];

    const rows = displayItems.map((item) => [
      esc(item.poNumber),
      esc(item.orderNo || ''),
      esc(item.productCode || ''),
      esc((item.itemDescription || item.productName).slice(0, 30)),
      esc((item.vendorName || '').slice(0, 20)),
      item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : '',
      String(item.qty),
      String(item.plannedQty),
      String(item.unplannedQty),
      esc(item.poStatus || ''),
    ]);

    const title = tab === 'pending' ? 'Pending Allocations' : 'Allocated Items';
    const generated = new Date().toLocaleString();
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planner Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #2563eb; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #2563eb; color: #fcfeff; padding: 6px 4px; text-align: left; }
        td { border-bottom: 1px solid #fcfeff; padding: 5px 4px; }
        tr:nth-child(even) { background: #fcfeff; }
      </style></head><body>
      <h1>Planner Purchase Orders - ${esc(title)}</h1>
      <h2>Generated: ${esc(generated)}</h2>
      <table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>`;

    rows.forEach((row) => {
      html += `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
    });
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      });
    } else {
      URL.revokeObjectURL(url);
    }
    toast.success('PDF print dialog opened');
  }, [displayItems, tab]);

  // ---- Selection handlers ----

  const toggleSelect = (item: PlannerItem) => {
    const key = itemKey(item);
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === pendingItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingItems.map(itemKey)));
    }
  };

  // ---- Allocation handlers ----

  const handleOpenAllocate = (item: PlannerItem) => {
    setAllocateItem(item);
    setAllocations([{ warehouseId: '', warehouseName: '', qty: '' }]);
  };

  const handleCloseAllocate = () => {
    setAllocateItem(null);
    setAllocations([{ warehouseId: '', warehouseName: '', qty: '' }]);
  };

  const addAllocationLine = () => {
    setAllocations((prev) => [...prev, { warehouseId: '', warehouseName: '', qty: '' }]);
  };

  const removeAllocationLine = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: keyof AllocationLine, value: string) => {
    setAllocations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'warehouseId') {
        const wh = warehouses.find((w: any) => w.id === value);
        next[index].warehouseName = wh?.name || '';
      }
      return next;
    });
  };

  const allocatedTotal = allocations.reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

  const handleSubmitAllocate = () => {
    if (!allocateItem) return;
    const validAllocations = allocations.filter((a) => a.warehouseId && Number(a.qty) > 0);
    if (validAllocations.length === 0) {
      toast.error('Add at least one warehouse allocation with qty > 0');
      return;
    }
    const total = validAllocations.reduce((s, a) => s + Number(a.qty), 0);
    if (total > allocateItem.unplannedQty) {
      toast.error(`Total allocation (${total}) exceeds unplanned qty (${allocateItem.unplannedQty})`);
      return;
    }
    allocateMutation.mutate({
      poId: allocateItem.poId,
      poNumber: allocateItem.poNumber,
      productId: allocateItem.productId,
      productName: allocateItem.productName,
      allocations: validAllocations.map((a) => ({
        warehouseId: a.warehouseId,
        warehouseName: a.warehouseName,
        qty: Number(a.qty),
      })),
    });
  };

  const handleOpenBulkAllocate = () => {
    if (selectedItems.size === 0) {
      toast.error('Select at least one item');
      return;
    }
    setBulkWarehouseId('');
    const initMap: Record<string, AllocationLine[]> = {};
    pendingItems
      .filter((item) => selectedItems.has(itemKey(item)) && item.unplannedQty > 0)
      .forEach((item) => {
        initMap[itemKey(item)] = [{ warehouseId: '', warehouseName: '', qty: String(item.unplannedQty) }];
      });
    setBulkAllocationsMap(initMap);
    setShowBulkDialog(true);
  };

  const handleApplyWarehouseToAll = (warehouseId: string) => {
    setBulkWarehouseId(warehouseId);
    if (!warehouseId) return;
    const wh = warehouses.find((w: any) => w.id === warehouseId);
    if (!wh) return;
    setBulkAllocationsMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = next[key].map((line) => ({ ...line, warehouseId: wh.id, warehouseName: wh.name }));
      });
      return next;
    });
  };

  const updateBulkAllocation = (itemKey: string, index: number, field: keyof AllocationLine, value: string) => {
    setBulkAllocationsMap((prev) => {
      const next = { ...prev };
      const lines = [...(next[itemKey] || [])];
      lines[index] = { ...lines[index], [field]: value };
      if (field === 'warehouseId') {
        const wh = warehouses.find((w: any) => w.id === value);
        lines[index].warehouseName = wh?.name || '';
      }
      next[itemKey] = lines;
      return next;
    });
  };

  const addBulkAllocationLine = (key: string) => {
    setBulkAllocationsMap((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { warehouseId: '', warehouseName: '', qty: '' }],
    }));
  };

  const removeBulkAllocationLine = (key: string, index: number) => {
    setBulkAllocationsMap((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index),
    }));
  };

  const getBulkAllocatedTotal = (key: string) =>
    (bulkAllocationsMap[key] || []).reduce((sum, a) => sum + (Number(a.qty) || 0), 0);

  const handleSubmitBulkAllocate = () => {
    const selectedPending = pendingItems.filter(
      (item) => selectedItems.has(itemKey(item)) && item.unplannedQty > 0
    );

    const plans = selectedPending
      .map((item) => {
        const key = itemKey(item);
        const lines = (bulkAllocationsMap[key] || []).filter((a) => a.warehouseId && Number(a.qty) > 0);
        if (lines.length === 0) return null;
        const total = lines.reduce((s, a) => s + Number(a.qty), 0);
        if (total > item.unplannedQty) {
          toast.error(`${item.poNumber}: allocation (${total}) exceeds unplanned qty (${item.unplannedQty})`);
          return null;
        }
        return {
          poId: item.poId,
          poNumber: item.poNumber,
          productId: item.productId,
          productName: item.productName,
          allocations: lines.map((a) => ({
            warehouseId: a.warehouseId,
            warehouseName: a.warehouseName,
            qty: Number(a.qty),
          })),
        };
      })
      .filter(Boolean);

    if (plans.length === 0) {
      toast.error('No valid allocations to submit');
      return;
    }
    bulkAllocateMutation.mutate({ plans });
  };

  // ---- Warehouse handlers ----

  const handleAddWarehouse = () => {
    if (!newWarehouseName.trim()) {
      toast.error('Warehouse name is required');
      return;
    }
    addWarehouseMutation.mutate({
      name: newWarehouseName.trim(),
      code: newWarehouseCode.trim() || undefined,
      address: newWarehouseAddress.trim() || undefined,
    });
  };

  // ---- Status badge helper ----
  const statusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
    if (s === 'planned' || s === 'fully_planned') return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Planned</Badge>;
    if (s === 'partially_planned') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Partial</Badge>;
    if (s === 'pending') return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Pending</Badge>;
    return <Badge variant="outline">{status || '—'}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* ---- Header Row ---- */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Planner Purchase Orders</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleDownloadPdf}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Download className="mr-1 h-4 w-4" /> Download PDF
          </Button>
          <Button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Download Excel
          </Button>
          {tab === 'pending' && selectedItems.size > 0 && (
            <Button onClick={handleOpenBulkAllocate} size="sm">
              <ClipboardList className="mr-1 h-4 w-4" />
              Bulk Allocate ({selectedItems.size})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (tab === 'approvals' || tab === 'warehouses') {
                setTab('pending');
              } else {
                setTab('approvals');
              }
            }}
          >
            <Settings2 className="mr-1 h-4 w-4" />
            Planning Console
          </Button>
        </div>
      </div>

      {/* ---- Tab Buttons ---- */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={tab === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('pending'); setPage(1); handleResetFilters(); }}
        >
          Pending for Allocate ({unplannedOrderCount})
        </Button>
        <Button
          variant={tab === 'allocated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('allocated'); setPage(1); handleResetFilters(); }}
        >
          Allocated ({plannedAllocationCount})
        </Button>
        <Button
          variant={tab === 'approvals' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('approvals'); refetchTransfers(); }}
        >
          Pending Approvals
        </Button>
        <Button
          variant={tab === 'warehouses' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setTab('warehouses'); refetchWarehouses(); }}
        >
          <WarehouseIcon className="mr-1 h-4 w-4" />
          Warehouses
        </Button>
        <Button
          variant={tab === 'workflow' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('workflow')}
        >
          <GitBranch className="mr-1 h-4 w-4" />
          Workflow Tracker
        </Button>
      </div>

      {/* === PENDING / ALLOCATED TAB === */}
      {(tab === 'pending' || tab === 'allocated') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{tab === 'pending' ? 'Pending Allocations' : 'Allocated Items'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ---- Filter Bar (GAS-style) ---- */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">PO ID</Label>
                  <Select value={filterPoId} onValueChange={setFilterPoId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {filterOptions.poIds.map((po) => (
                        <SelectItem key={po} value={po}>{po}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Order No</Label>
                  <Input
                    placeholder="All"
                    value={filterOrderNo}
                    onChange={(e) => setFilterOrderNo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Product Code</Label>
                  <Input
                    placeholder="All"
                    value={filterProductCode}
                    onChange={(e) => setFilterProductCode(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Item Name</Label>
                  <Input
                    placeholder="All"
                    value={filterItemName}
                    onChange={(e) => setFilterItemName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Vendor Name</Label>
                  <Select value={filterVendorName} onValueChange={setFilterVendorName}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {filterOptions.vendorNames.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Expected Date</Label>
                  <Input
                    type="date"
                    value={filterExpectedDate}
                    onChange={(e) => setFilterExpectedDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleApplyFilters}>
                  <Filter className="mr-1 h-3 w-3" /> Filter
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleResetFilters}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Reset
                </Button>
                <div className="flex max-w-full flex-wrap items-center gap-2 sm:ml-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search ledger..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-7 h-7 w-[180px] text-xs"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => refetch()}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ---- Table ---- */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardList className="mb-2 h-10 w-10" />
                <p>{tab === 'pending' ? 'No pending items to allocate' : 'No allocated items'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tab === 'pending' && (
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={selectedItems.size === pendingItems.length && pendingItems.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Purchase PO</TableHead>
                      <TableHead>Sales Order No</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Detail</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Buyer Code</TableHead>
                      <TableHead>Sales Person</TableHead>
                      <TableHead>Purchaser</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Expected Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Unplanned Qty</TableHead>
                      <TableHead>Last Edit Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.map((item) => {
                      const key = itemKey(item);
                      return (
                        <TableRow key={key}>
                          {tab === 'pending' && (
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.has(key)}
                                onCheckedChange={() => toggleSelect(item)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-primary">{item.poNumber}</TableCell>
                          <TableCell>{item.orderNo || '—'}</TableCell>
                          <TableCell className="text-xs font-mono">{item.productCode || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.itemDescription || item.productName}</TableCell>
                          <TableCell>{item.uom || '—'}</TableCell>
                          <TableCell>{item.buyerCode || '—'}</TableCell>
                          <TableCell>{item.salesPerson || '—'}</TableCell>
                          <TableCell>{item.purchasePerson || '—'}</TableCell>
                          <TableCell>{item.vendorName || '—'}</TableCell>
                          <TableCell>{item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>{item.location || '—'}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">{item.unplannedQty}</TableCell>
                          <TableCell>{statusBadge(item.poStatus)}</TableCell>
                          <TableCell>
                            {item.unplannedQty > 0 && (
                              <Button size="sm" onClick={() => handleOpenAllocate(item)}>
                                Allocate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === PENDING APPROVALS TAB === */}
      {tab === 'approvals' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Transfer Approvals</CardTitle>
              <Button variant="outline" size="icon" onClick={() => refetchTransfers()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Check className="mb-2 h-10 w-10" />
                <p>No pending transfer requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>From Warehouse</TableHead>
                      <TableHead>To Warehouse</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.map((t) => (
                      <TableRow key={t.transferId}>
                        <TableCell className="font-medium text-primary">{t.transferNumber}</TableCell>
                        <TableCell>{t.transferDate ? new Date(t.transferDate).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{t.sourceWarehouseName}</TableCell>
                        <TableCell>{t.destinationWarehouseName}</TableCell>
                        <TableCell className="text-right font-bold">{Number(t.totalQuantity)}</TableCell>
                        <TableCell>{t.requestedByUsername || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{t.requestRemarks || t.notes || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveMutation.mutate(t.transferId)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="mr-1 h-3 w-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => { setRejectDialogTransferId(t.transferId); setRejectReason(''); }}
                            >
                              <XCircle className="mr-1 h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === WAREHOUSES TAB === */}
      {tab === 'warehouses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Warehouse Management</CardTitle>
              <Button onClick={() => setShowAddWarehouse(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Warehouse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <WarehouseIcon className="mb-2 h-10 w-10" />
                <p>No warehouses configured</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {warehouses.map((wh: any) => (
                      <TableRow key={wh.id}>
                        <TableCell className="font-medium">{wh.name}</TableCell>
                        <TableCell className="text-xs font-mono">{wh.code || '—'}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{wh.address || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={wh.isActive !== false ? 'default' : 'secondary'}>
                            {wh.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (window.confirm(`Delete warehouse "${wh.name}"?`)) {
                                deleteWarehouseMutation.mutate(wh.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === WORKFLOW TRACKER TAB === */}
      {tab === 'workflow' && <WorkflowTracker />}

      {/* Single Item Allocation Dialog */}
      <Dialog open={!!allocateItem} onOpenChange={(open) => { if (!open) handleCloseAllocate(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan Item Warehouse Receiving</DialogTitle>
          </DialogHeader>
          {allocateItem && (
            <>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-muted-foreground">PO Number:</span>
                    <p className="font-semibold text-primary">{allocateItem.poNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order No:</span>
                    <p className="font-semibold">{allocateItem.orderNo || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unique Product Code:</span>
                    <p className="font-semibold text-xs">{allocateItem.productCode || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-muted-foreground">UOM:</span>
                    <p className="font-semibold text-primary">{allocateItem.uom || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buyer Code:</span>
                    <p className="font-semibold">{allocateItem.buyerCode || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <p className="font-semibold">{allocateItem.vendorName}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Item Description:</span>
                  <p className="font-semibold">{allocateItem.itemDescription || allocateItem.productName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 text-center">
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Total Required</p>
                  <p className="text-2xl font-bold text-red-600">{allocateItem.qty}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Allocated Qty</p>
                  <p className="text-2xl font-bold text-green-600">{allocateItem.plannedQty + allocatedTotal}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground font-semibold">Unplanned Qty</p>
                  <p className="text-2xl font-bold text-primary">{allocateItem.unplannedQty - allocatedTotal}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold uppercase text-sm">Warehouse Allocations:</p>
                  <Button size="sm" variant="default" onClick={addAllocationLine}>
                    <Plus className="mr-1 h-3 w-3" /> Add Line
                  </Button>
                </div>
                {allocations.map((alloc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={alloc.warehouseId}
                      onValueChange={(v) => updateAllocation(idx, 'warehouseId', v)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select WH" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh: any) => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Allocated Qty"
                      value={alloc.qty}
                      onChange={(e) => updateAllocation(idx, 'qty', e.target.value)}
                      className="w-[150px]"
                    />
                    {allocations.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removeAllocationLine(idx)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                {allocatedTotal > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Allocating: <strong>{allocatedTotal}</strong> of {allocateItem.unplannedQty} unplanned
                    {allocatedTotal > allocateItem.unplannedQty && (
                      <span className="text-red-600 ml-2">(exceeds unplanned qty!)</span>
                    )}
                  </p>
                )}
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAllocate}>Cancel</Button>
            <Button
              onClick={handleSubmitAllocate}
              disabled={allocateMutation.isPending}
            >
              {allocateMutation.isPending ? 'Assigning...' : 'Assign Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Allocate Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={(open) => { if (!open) setShowBulkDialog(false); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Bulk Plan Item Warehouse Receiving</DialogTitle>
          </DialogHeader>

          <div className="rounded-lg border p-4 flex items-center gap-4">
            <Label className="whitespace-nowrap font-semibold">Apply one warehouse to all:</Label>
            <Select value={bulkWarehouseId} onValueChange={handleApplyWarehouseToAll}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose warehouse (optional)" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pendingItems
            .filter((item) => selectedItems.has(itemKey(item)) && item.unplannedQty > 0)
            .map((item, idx, arr) => {
              const key = itemKey(item);
              const lines = bulkAllocationsMap[key] || [];
              const bulkTotal = getBulkAllocatedTotal(key);
              return (
                <div key={key} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Item {idx + 1} of {arr.length}</p>
                    {item.unplannedQty - bulkTotal > 0 && (
                      <Badge variant="destructive">Pending: {item.unplannedQty - bulkTotal}</Badge>
                    )}
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-muted-foreground">PO Number:</span>
                        <p className="font-semibold text-primary">{item.poNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Order No:</span>
                        <p className="font-semibold">{item.orderNo || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unique Product Code:</span>
                        <p className="font-semibold text-xs">{item.productCode || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-muted-foreground">UOM:</span>
                        <p className="font-semibold text-primary">{item.uom || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Buyer Code:</span>
                        <p className="font-semibold">{item.buyerCode || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vendor:</span>
                        <p className="font-semibold">{item.vendorName}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground">Item Description:</span>
                      <p className="font-semibold">{item.itemDescription || item.productName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 rounded-lg border p-3 text-center">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Total Required</p>
                      <p className="text-xl font-bold text-red-600">{item.qty}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Allocated Qty</p>
                      <p className="text-xl font-bold text-green-600">{item.plannedQty + bulkTotal}</p>
                      <p className="text-xs text-muted-foreground">Already planned: {item.plannedQty}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">Unplanned Qty</p>
                      <p className="text-xl font-bold text-primary">{item.unplannedQty - bulkTotal}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold uppercase text-xs">Warehouse Allocations:</p>
                      <Button size="sm" variant="default" onClick={() => addBulkAllocationLine(key)}>
                        <Plus className="mr-1 h-3 w-3" /> Add Line
                      </Button>
                    </div>
                    {lines.map((alloc, lineIdx) => (
                      <div key={lineIdx} className="flex items-center gap-2">
                        <Select
                          value={alloc.warehouseId}
                          onValueChange={(v) => updateBulkAllocation(key, lineIdx, 'warehouseId', v)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select WH" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((wh: any) => (
                              <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={alloc.qty}
                          onChange={(e) => updateBulkAllocation(key, lineIdx, 'qty', e.target.value)}
                          className="w-[150px]"
                        />
                        {lines.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removeBulkAllocationLine(key, lineIdx)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          <DialogFooter>
            <Button
              onClick={handleSubmitBulkAllocate}
              disabled={bulkAllocateMutation.isPending}
            >
              {bulkAllocateMutation.isPending
                ? 'Assigning...'
                : `Assign Plan (${Object.keys(bulkAllocationsMap).length})`}
            </Button>
            <Button variant="secondary" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Transfer Dialog */}
      <Dialog open={!!rejectDialogTransferId} onOpenChange={(open) => { if (!open) setRejectDialogTransferId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Transfer Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Reason for rejection (optional)</Label>
            <Input
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogTransferId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectDialogTransferId) {
                  rejectMutation.mutate({ transferId: rejectDialogTransferId, reason: rejectReason || undefined });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Warehouse Dialog */}
      <Dialog open={showAddWarehouse} onOpenChange={(open) => { if (!open) setShowAddWarehouse(false); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add New Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Warehouse Name *</Label>
              <Input
                placeholder="e.g. Main Warehouse"
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="e.g. WH-001"
                value={newWarehouseCode}
                onChange={(e) => setNewWarehouseCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Warehouse address"
                value={newWarehouseAddress}
                onChange={(e) => setNewWarehouseAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWarehouse(false)}>Cancel</Button>
            <Button
              onClick={handleAddWarehouse}
              disabled={addWarehouseMutation.isPending}
            >
              {addWarehouseMutation.isPending ? 'Adding...' : 'Add Warehouse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
