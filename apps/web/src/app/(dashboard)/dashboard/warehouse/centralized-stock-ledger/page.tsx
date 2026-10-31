'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileDown, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOW_STOCK_THRESHOLD = 10;

export default function CentralizedStockLedgerPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [filterProductId, setFilterProductId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPo, setFilterPo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ productId: '', category: '', po: '' });

  const [requestDialog, setRequestDialog] = useState(false);
  const [requestItem, setRequestItem] = useState<any>(null);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [requestQty, setRequestQty] = useState('');

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['centralized-stock-ledger'],
    queryFn: () => inventoryApi.getStock({ limit: 5000 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const allStock: any[] = stockData?.data?.data || stockData?.data || [];
  const warehouseList: any[] = warehousesData?.data || [];

  const grouped = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of allStock) {
      const key = item.productId || item.sku || item.stockId;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          category: item.category || 'Raw',
          uom: item.uom || '',
          poOrderNo: item.poOrderNo || '',
          locations: [] as { warehouse: string; bin: string; qty: number }[],
          warehouseStock: {} as Record<string, number>,
          warehouseIdStock: {} as Record<string, number>,
          totalStock: 0,
        });
      }
      const group = map.get(key)!;
      const whName = warehouseList.find((w: any) => w.id === item.warehouseId)?.name || item.warehouseId || '';
      const qty = Math.round(Number(item.currentStock || 0));
      const bin = item.binLocation || 'Inward-Staging';

      if (!group.poOrderNo && item.poOrderNo) group.poOrderNo = item.poOrderNo;

      group.warehouseStock[whName] = (group.warehouseStock[whName] || 0) + qty;
      if (item.warehouseId) {
        group.warehouseIdStock[item.warehouseId] = (group.warehouseIdStock[item.warehouseId] || 0) + qty;
      }
      group.totalStock += qty;
      group.locations.push({ warehouse: whName, bin, qty });
    }
    return Array.from(map.values());
  }, [allStock, warehouseList]);

  const whNames = useMemo(() => {
    const names = new Set<string>();
    for (const g of grouped) {
      for (const wh of Object.keys(g.warehouseStock)) names.add(wh);
    }
    return Array.from(names).sort();
  }, [grouped]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const g of grouped) cats.add(g.category);
    return Array.from(cats).sort();
  }, [grouped]);

  const productIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of grouped) ids.add(g.sku || g.productId);
    return Array.from(ids).sort();
  }, [grouped]);

  const poNumbers = useMemo(() => {
    const pos = new Set<string>();
    for (const g of grouped) {
      if (g.poOrderNo) pos.add(g.poOrderNo);
    }
    return Array.from(pos).sort();
  }, [grouped]);

  const filtered = useMemo(() => {
    let result = grouped;
    if (appliedFilters.productId) {
      result = result.filter((item) => (item.sku || item.productId) === appliedFilters.productId);
    }
    if (appliedFilters.category) {
      result = result.filter((item) => item.category === appliedFilters.category);
    }
    if (appliedFilters.po) {
      result = result.filter((item) => item.poOrderNo === appliedFilters.po);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.sku?.toLowerCase().includes(s) ||
          item.productName?.toLowerCase().includes(s) ||
          item.poOrderNo?.toLowerCase().includes(s) ||
          item.category?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [grouped, search, appliedFilters]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / entriesPerPage);
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const applyFilters = () => {
    setAppliedFilters({ productId: filterProductId, category: filterCategory, po: filterPo });
    setPage(1);
  };

  const resetFilters = () => {
    setFilterProductId('');
    setFilterCategory('');
    setFilterPo('');
    setAppliedFilters({ productId: '', category: '', po: '' });
    setPage(1);
  };

  const formatLocations = (locations: { warehouse: string; bin: string; qty: number }[]) => {
    const byWh = new Map<string, string[]>();
    for (const loc of locations) {
      if (!byWh.has(loc.warehouse)) byWh.set(loc.warehouse, []);
      byWh.get(loc.warehouse)!.push(`${loc.bin} (${loc.qty.toLocaleString()})`);
    }
    return Array.from(byWh.entries())
      .map(([wh, bins]) => `${wh}: [${bins.join(', ')}]`)
      .join(' | ');
  };

  const requestMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.transferStock(data),
    onSuccess: () => {
      toast.success('Transfer request created successfully');
      queryClient.invalidateQueries({ queryKey: ['centralized-stock-ledger'] });
      setRequestDialog(false);
      setRequestItem(null);
      setFromWarehouseId('');
      setToWarehouseId('');
      setRequestQty('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create request');
    },
  });

  const openRequestDialog = (item: any) => {
    setRequestItem(item);
    setFromWarehouseId('');
    setToWarehouseId('');
    setRequestQty('');
    setRequestDialog(true);
  };

  const handleRequest = () => {
    if (!requestItem || !fromWarehouseId || !toWarehouseId || !requestQty) {
      toast.error('Please fill all required fields');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error('Source and destination warehouse must be different');
      return;
    }
    const qty = Number(requestQty);
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    const srcWh = warehouseList.find((w: any) => w.id === fromWarehouseId);
    const destWh = warehouseList.find((w: any) => w.id === toWarehouseId);
    requestMutation.mutate({
      sourceWarehouseId: fromWarehouseId,
      destinationWarehouseId: toWarehouseId,
      sourceWarehouseName: srcWh?.name || fromWarehouseId,
      destinationWarehouseName: destWh?.name || toWarehouseId,
      requestType: 'transfer',
      items: [{
        productId: requestItem.productId || requestItem.sku,
        productName: requestItem.productName,
        sku: requestItem.sku,
        quantity: qty,
        uom: requestItem.uom || 'Per Kg',
      }],
    });
  };

  const sourceAvailableQty = useMemo(() => {
    if (!requestItem || !fromWarehouseId) return 0;
    return requestItem.warehouseIdStock?.[fromWarehouseId] || 0;
  }, [requestItem, fromWarehouseId]);

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Centralized Stock Ledger', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = ['Product ID', 'Product Name', 'Category', 'UOM', 'PO / Order No', ...whNames.map(w => `${w} Stock`), 'Total Stock'];
    const body = filtered.map((item) => [
      item.sku || item.productId || '',
      item.productName || '',
      item.category || '',
      item.uom || '',
      item.poOrderNo || '',
      ...whNames.map(wh => String(item.warehouseStock[wh] || 0)),
      String(item.totalStock),
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [245, 158, 11] },
    });
    doc.save('centralized-stock-ledger.pdf');
    toast.success('PDF downloaded');
  };

  const downloadExcel = () => {
    const headers = ['Product ID', 'Product Name', 'Category', 'UOM', 'PO / Order No', 'Locations / Bins', ...whNames.map(w => `${w} Stock`), 'Total Stock'];
    const rows = filtered.map((item) => [
      item.sku || item.productId || '',
      item.productName || '',
      item.category || '',
      item.uom || '',
      item.poOrderNo || '',
      formatLocations(item.locations),
      ...whNames.map(wh => String(item.warehouseStock[wh] || 0)),
      String(item.totalStock),
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'centralized-stock-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel (CSV) downloaded');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Centralized Stock Ledger</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadPdf}>
            <FileDown className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={downloadExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Download Excel
          </Button>
          <span className="text-sm font-bold text-purple-600 ml-2">LIVE INVENTORY</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap border rounded-lg p-4 bg-white">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Product ID</Label>
          <Select value={filterProductId} onValueChange={setFilterProductId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Products</SelectItem>
              {productIds.map((id) => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Category</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold text-slate-500 uppercase">PO / Order</Label>
          <Select value={filterPo} onValueChange={setFilterPo}>
            <SelectTrigger>
              <SelectValue placeholder="All PO / Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All PO / Orders</SelectItem>
              {poNumbers.map((po) => (
                <SelectItem key={po} value={po}>{po}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white px-8" onClick={applyFilters}>
          Apply
        </Button>
        <Button variant="outline" className="px-8" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search stock ledger..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-sm pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product Name</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Category</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">UOM</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">PO / Order No</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Locations / Bins</TableHead>
              {whNames.map((wh) => (
                <TableHead key={wh} className="text-xs font-bold uppercase whitespace-nowrap text-right">
                  {wh} Stock
                </TableHead>
              ))}
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Total Stock</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8 + whNames.length} className="text-center py-8 text-slate-400">
                  Loading stock ledger...
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8 + whNames.length} className="text-center py-8 text-slate-400">
                  No stock records found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item) => {
                const isLowStock = item.totalStock < LOW_STOCK_THRESHOLD;
                return (
                  <TableRow key={item.sku} className={`border-b ${isLowStock ? 'bg-red-50' : ''}`}>
                    <TableCell className="font-mono text-xs text-slate-700 whitespace-nowrap max-w-[300px] truncate">
                      {item.sku || item.productId}
                    </TableCell>
                    <TableCell className="text-sm max-w-[350px]">{item.productName}</TableCell>
                    <TableCell className="text-sm">{item.category}</TableCell>
                    <TableCell className="text-sm">{item.uom}</TableCell>
                    <TableCell className="text-sm">
                      {item.poOrderNo ? (
                        <span className="text-blue-600 font-medium">{item.poOrderNo}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[300px]">
                      {formatLocations(item.locations)}
                    </TableCell>
                    {whNames.map((wh) => (
                      <TableCell key={wh} className="text-right text-sm">
                        {(item.warehouseStock[wh] || 0).toLocaleString()}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.totalStock.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-4"
                        onClick={() => openRequestDialog(item)}
                      >
                        Request
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {total === 0 ? 0 : (page - 1) * entriesPerPage + 1} to {Math.min(page * entriesPerPage, total)} of {total} entries
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
              &laquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              &lsaquo;
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} className="min-w-[36px]">
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              &rsaquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              &raquo;
            </Button>
          </div>
        )}
      </div>

      {/* Low stock notice */}
      <div className="flex items-center gap-2 text-sm text-red-500">
        <AlertTriangle className="h-4 w-4" />
        Low-stock rows highlighted in red (Count &lt; {LOW_STOCK_THRESHOLD} units).
      </div>

      {/* Request Dialog */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock Transfer Request</DialogTitle>
          </DialogHeader>
          {requestItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-medium max-w-[250px] truncate">{requestItem.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SKU:</span>
                  <span className="font-mono text-xs max-w-[250px] truncate">{requestItem.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Stock:</span>
                  <span className="font-bold">{requestItem.totalStock.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Source Warehouse *</Label>
                <Select value={fromWarehouseId} onValueChange={(v) => { setFromWarehouseId(v); setRequestQty(''); }}>
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList
                      .filter((w: any) => (requestItem.warehouseIdStock?.[w.id] || 0) > 0)
                      .map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} — Available: {(requestItem.warehouseIdStock?.[w.id] || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse *</Label>
                <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList
                      .filter((w: any) => w.id !== fromWarehouseId)
                      .map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="bg-yellow-50"
                  min={1}
                  max={sourceAvailableQty}
                />
                {fromWarehouseId && (
                  <p className="text-xs text-slate-500">
                    Available: {sourceAvailableQty.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequest}
              disabled={requestMutation.isPending || !fromWarehouseId || !toWarehouseId || !requestQty || Number(requestQty) <= 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
