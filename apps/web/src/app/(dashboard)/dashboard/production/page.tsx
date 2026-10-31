'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, inventoryTrackingApi, productionApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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
import { Textarea } from '@/components/ui/textarea';
import { PackageCheck, CheckSquare, RotateCcw, Search, Info } from 'lucide-react';

const QC_DISPLAY: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending QC', className: 'text-orange-500 font-semibold' },
  passed: { label: 'QC Passed', className: 'text-green-600 font-semibold' },
  failed: { label: 'QC Failed', className: 'text-red-600 font-semibold' },
  in_progress: { label: 'QC In Progress', className: 'text-blue-600 font-semibold' },
};

function getWarehouseShort(name?: string): string {
  if (!name) return '—';
  const match = name.match(/^([A-Z]\d+)/i);
  return match ? match[1].toUpperCase() : name;
}

export default function ProductionDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const warehouseId = user?.warehouseId;

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehousesData?.data || [];
  const activeWarehouse = warehouseList.find((w: any) => w.id === warehouseId);
  const activeWarehouseName = getWarehouseShort(activeWarehouse?.name);

  const [itemFilter, setItemFilter] = useState('');

  // Section 1: Incoming Transferred Material
  const [incomingPage, setIncomingPage] = useState(1);
  const [incomingPerPage, setIncomingPerPage] = useState(10);
  const [incomingSelectedIds, setIncomingSelectedIds] = useState<Set<string>>(new Set());
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [targetBin, setTargetBin] = useState('');

  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['incoming-transfers', warehouseId, incomingPage, incomingPerPage],
    queryFn: async () => {
      const params: any = { page: incomingPage, limit: incomingPerPage, status: 'in_transit' };
      if (warehouseId) params.destinationWarehouseId = warehouseId;
      const res = await inventoryTrackingApi.getTransfers(params);
      return res.data;
    },
  });

  const incomingTransfers = incomingData?.data || incomingData?.transfers || [];
  const incomingTotal = incomingData?.total || incomingData?.count || 0;
  const incomingTotalPages = Math.ceil(incomingTotal / incomingPerPage);

  const filteredIncoming = incomingTransfers.filter((t: any) => {
    if (!itemFilter) return true;
    const s = itemFilter.toLowerCase();
    return (
      t.transferNumber?.toLowerCase().includes(s) ||
      t.orderNo?.toLowerCase().includes(s) ||
      t.sku?.toLowerCase().includes(s) ||
      t.finalProductName?.toLowerCase().includes(s) ||
      t.productName?.toLowerCase().includes(s)
    );
  });

  const receiveMutation = useMutation({
    mutationFn: async ({ transferId, receivedQty, targetBin }: { transferId: string; receivedQty: number; targetBin?: string }) => {
      return inventoryTrackingApi.receiveTransferMaterial(transferId, { receivedQty, targetBin });
    },
    onSuccess: () => {
      toast.success('Material received successfully');
      queryClient.invalidateQueries({ queryKey: ['incoming-transfers'] });
      setReceiveDialog(false);
      setSelectedTransfer(null);
      setReceivedQty('');
      setTargetBin('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to receive material');
    },
  });

  const openReceiveDialog = (transfer: any) => {
    setSelectedTransfer(transfer);
    setReceivedQty(String(transfer.dispatchedQty || transfer.totalQuantity || ''));
    setTargetBin('');
    setReceiveDialog(true);
  };

  const handleReceive = () => {
    if (!selectedTransfer || !receivedQty) return;
    const qty = Number(receivedQty);
    if (qty <= 0) { toast.error('Received quantity must be greater than 0'); return; }
    receiveMutation.mutate({ transferId: selectedTransfer.transferId, receivedQty: qty, targetBin: targetBin || undefined });
  };

  const handleReceiveSelected = async () => {
    if (incomingSelectedIds.size === 0) { toast.error('Please select at least one transfer to receive'); return; }
    const selected = incomingTransfers.filter((t: any) => incomingSelectedIds.has(t.transferId));
    let successCount = 0;
    for (const transfer of selected) {
      try {
        await inventoryTrackingApi.receiveTransferMaterial(transfer.transferId, {
          receivedQty: Number(transfer.dispatchedQty || transfer.totalQuantity || 0),
        });
        successCount++;
      } catch (err: any) {
        toast.error(`Failed to receive ${transfer.transferNumber || transfer.transferId}: ${err?.response?.data?.message || 'Error'}`);
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} transfer(s) received successfully`);
      queryClient.invalidateQueries({ queryKey: ['incoming-transfers'] });
      setIncomingSelectedIds(new Set());
    }
  };

  const toggleIncomingSelect = (id: string) => {
    setIncomingSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleIncomingSelectAll = () => {
    if (incomingSelectedIds.size === filteredIncoming.length) setIncomingSelectedIds(new Set());
    else setIncomingSelectedIds(new Set(filteredIncoming.map((t: any) => t.transferId)));
  };

  // Section 2: My Stock Location Quantities
  const [stockPage, setStockPage] = useState(1);
  const [stockPerPage, setStockPerPage] = useState(10);
  const [stockSelectedIds, setStockSelectedIds] = useState<Set<string>>(new Set());
  const [stockSearch, setStockSearch] = useState('');
  const [returnDialog, setReturnDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnWarehouseId, setReturnWarehouseId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock-location', warehouseId],
    queryFn: () => inventoryApi.getStock({ warehouseId, limit: 5000 }),
    enabled: !!warehouseId,
  });

  const otherWarehouses = warehouseList.filter((w: any) => w.id !== warehouseId);

  const allStock: any[] = useMemo(() => {
    const raw = stockData?.data?.data || stockData?.data || [];
    return raw.filter((item: any) => Number(item.currentStock || 0) > 0 && item.warehouseId === warehouseId);
  }, [stockData, warehouseId]);

  const filteredStock = useMemo(() => {
    let result = allStock;
    if (stockSearch) {
      const s = stockSearch.toLowerCase();
      result = result.filter((item: any) =>
        item.productId?.toLowerCase().includes(s) || item.sku?.toLowerCase().includes(s) ||
        item.productName?.toLowerCase().includes(s) || item.category?.toLowerCase().includes(s)
      );
    }
    if (itemFilter) {
      const s = itemFilter.toLowerCase();
      result = result.filter((item: any) =>
        item.productName?.toLowerCase().includes(s) || item.sku?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allStock, stockSearch, itemFilter]);

  const stockTotal = filteredStock.length;
  const stockTotalPages = Math.ceil(stockTotal / stockPerPage);
  const paginatedStock = filteredStock.slice((stockPage - 1) * stockPerPage, stockPage * stockPerPage);

  const returnMutation = useMutation({
    mutationFn: async (data: any) => inventoryApi.transferStock(data),
    onSuccess: () => {
      toast.success('Return to warehouse initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setReturnDialog(false); setSelectedStockItem(null); setReturnQty(''); setReturnWarehouseId('');
    },
    onError: (err: any) => { toast.error(err?.response?.data?.message || 'Failed to initiate return'); },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) =>
      inventoryApi.transferStock({ sourceWarehouseId: warehouseId, destinationWarehouseId: warehouseId, requestType: 'reject', items: [{ productId, quantity: 0 }], remarks: reason }),
    onSuccess: () => {
      toast.success('Material rejected');
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setRejectDialog(false); setSelectedStockItem(null); setRejectReason('');
    },
    onError: (err: any) => { toast.error(err?.response?.data?.message || 'Failed to reject material'); },
  });

  const openReturnDialog = (item: any) => {
    setSelectedStockItem(item); setReturnQty(String(Math.round(Number(item.currentStock || 0)))); setReturnWarehouseId(''); setReturnDialog(true);
  };
  const handleReturn = () => {
    if (!selectedStockItem || !returnQty || !returnWarehouseId) { toast.error('Please fill all required fields'); return; }
    const qty = Number(returnQty);
    if (qty <= 0) { toast.error('Return quantity must be greater than 0'); return; }
    if (qty > Number(selectedStockItem.currentStock || 0)) { toast.error('Return quantity cannot exceed available stock'); return; }
    const destWarehouse = warehouseList.find((w: any) => w.id === returnWarehouseId);
    returnMutation.mutate({
      sourceWarehouseId: warehouseId, destinationWarehouseId: returnWarehouseId,
      sourceWarehouseName: activeWarehouse?.name || warehouseId, destinationWarehouseName: destWarehouse?.name || returnWarehouseId,
      requestType: 'return',
      items: [{ productId: selectedStockItem.productId || selectedStockItem.sku, productName: selectedStockItem.productName, sku: selectedStockItem.sku, quantity: qty, uom: selectedStockItem.uom || 'Per Kg' }],
    });
  };
  const openRejectDialog = (item: any) => { setSelectedStockItem(item); setRejectReason(''); setRejectDialog(true); };
  const handleReject = () => {
    if (!selectedStockItem || !rejectReason.trim()) { toast.error('Please provide a reason for rejection'); return; }
    rejectMutation.mutate({ productId: selectedStockItem.productId || selectedStockItem.sku, reason: rejectReason.trim() });
  };
  const handleReturnSelected = () => {
    if (stockSelectedIds.size === 0) { toast.error('Please select at least one item'); return; }
    setSelectedStockItem(null); setReturnWarehouseId(''); setReturnDialog(true);
  };
  const handleBulkReturn = async () => {
    if (!returnWarehouseId) { toast.error('Please select a destination warehouse'); return; }
    const selected = allStock.filter((item: any) => stockSelectedIds.has(item.productId || item.sku));
    const destWarehouse = warehouseList.find((w: any) => w.id === returnWarehouseId);
    try {
      await inventoryApi.transferStock({
        sourceWarehouseId: warehouseId, destinationWarehouseId: returnWarehouseId,
        sourceWarehouseName: activeWarehouse?.name || warehouseId, destinationWarehouseName: destWarehouse?.name || returnWarehouseId,
        requestType: 'return',
        items: selected.map((item: any) => ({ productId: item.productId || item.sku, productName: item.productName, sku: item.sku, quantity: Math.round(Number(item.currentStock || 0)), uom: item.uom || 'Per Kg' })),
      });
      toast.success(`${selected.length} item(s) returned to warehouse`);
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setReturnDialog(false); setStockSelectedIds(new Set()); setReturnWarehouseId('');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to return items'); }
  };
  const toggleStockSelect = (id: string) => { setStockSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleStockSelectAll = () => {
    if (stockSelectedIds.size === paginatedStock.length) setStockSelectedIds(new Set());
    else setStockSelectedIds(new Set(paginatedStock.map((item: any) => item.productId || item.sku)));
  };

  // Section 3: Production History & QC
  const [histPage, setHistPage] = useState(1);
  const [histPerPage, setHistPerPage] = useState(10);
  const [histSearch, setHistSearch] = useState('');

  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['production-history-logs', histPage, histPerPage, histSearch],
    queryFn: () => productionApi.getLogs({ page: histPage, limit: histPerPage, search: histSearch || undefined }).then((res) => res.data),
  });

  const histLogs: any[] = histData?.data || [];
  const histTotal = histData?.total || 0;
  const histTotalPages = Math.ceil(histTotal / histPerPage);

  const renderPagination = (currentPage: number, tp: number, setP: (p: number) => void) => (
    tp > 1 ? (
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setP(1)}>&laquo;</Button>
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setP(currentPage - 1)}>&lsaquo;</Button>
        {Array.from({ length: Math.min(5, tp) }, (_, i) => {
          let p: number;
          if (tp <= 5) p = i + 1;
          else if (currentPage <= 3) p = i + 1;
          else if (currentPage >= tp - 2) p = tp - 4 + i;
          else p = currentPage - 2 + i;
          return <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setP(p)} className="min-w-[36px]">{p}</Button>;
        })}
        {tp > 5 && currentPage < tp - 2 && <span className="px-1 text-slate-400">...</span>}
        {tp > 5 && currentPage < tp - 2 && <Button variant="outline" size="sm" onClick={() => setP(tp)} className="min-w-[36px]">{tp}</Button>}
        <Button variant="outline" size="sm" disabled={currentPage >= tp} onClick={() => setP(currentPage + 1)}>&rsaquo;</Button>
        <Button variant="outline" size="sm" disabled={currentPage >= tp} onClick={() => setP(tp)}>&raquo;</Button>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Production Console</p>
          <h1 className="text-2xl font-bold">Active Warehouse: <span className="text-indigo-600">{activeWarehouseName}</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border rounded-lg px-4 py-2">
          <Info className="h-4 w-4 text-green-600" />
          <span className="text-sm text-slate-600">Review inbound inventory allocations and physical logs below.</span>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">Item Name</Label>
          <Input
            placeholder="All Item Names"
            value={itemFilter}
            onChange={(e) => { setItemFilter(e.target.value); setIncomingPage(1); setStockPage(1); }}
            className="flex-1"
          />
          <Button variant="default" onClick={() => setItemFilter('')}>Reset</Button>
        </div>
      </div>

      {/* Section 1: Incoming Transferred Material */}
      <div className="bg-white border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">Incoming Transferred Material (Receive Material)</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="font-semibold" onClick={toggleIncomingSelectAll}>
              <CheckSquare className="h-4 w-4 mr-1" /> Select All
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={handleReceiveSelected} disabled={incomingSelectedIds.size === 0}>
              <PackageCheck className="h-4 w-4 mr-1" /> Receive Selected
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Select value={String(incomingPerPage)} onValueChange={(v) => { setIncomingPerPage(Number(v)); setIncomingPage(1); }}>
              <SelectTrigger className="w-[70px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-slate-500">entries per page</span>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"><input type="checkbox" checked={filteredIncoming.length > 0 && incomingSelectedIds.size === filteredIncoming.length} onChange={toggleIncomingSelectAll} className="rounded border-slate-300" /></TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Request ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Order No</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product Details</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Dispatched Qty</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">UOM</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">PO No</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">From WH</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">Loading incoming transfers...</TableCell></TableRow>
                ) : filteredIncoming.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">No incoming transfers found</TableCell></TableRow>
                ) : (
                  filteredIncoming.map((transfer: any) => (
                    <TableRow key={transfer.transferId} className="border-b">
                      <TableCell><input type="checkbox" checked={incomingSelectedIds.has(transfer.transferId)} onChange={() => toggleIncomingSelect(transfer.transferId)} className="rounded border-slate-300" /></TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{transfer.transferNumber || `REQ-${transfer.transferId?.slice(-5) || '—'}`}</TableCell>
                      <TableCell className="text-sm"><span className="text-blue-600 font-medium">{transfer.orderNo || transfer.referenceNumber || '—'}</span></TableCell>
                      <TableCell className="text-sm max-w-[350px]">
                        <div className="font-mono text-xs text-slate-700 truncate">{transfer.sku || transfer.productId || '—'}</div>
                        <div className="text-xs text-slate-500 truncate">{transfer.finalProductName || transfer.productName || '—'}</div>
                      </TableCell>
                      <TableCell className="text-right"><span className="font-bold text-slate-900">{Number(transfer.dispatchedQty || transfer.totalQuantity || 0).toLocaleString()}</span></TableCell>
                      <TableCell className="text-sm">{transfer.uom || 'Per Kg'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{transfer.poNumber || transfer.purchaseOrderNumber || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{transfer.sourceWarehouseName || transfer.sourceWarehouseId || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3" onClick={() => openReceiveDialog(transfer)}>Receive Material</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {incomingTotal === 0 ? 0 : (incomingPage - 1) * incomingPerPage + 1} to {Math.min(incomingPage * incomingPerPage, incomingTotal)} of {incomingTotal} entries</p>
            {renderPagination(incomingPage, incomingTotalPages, setIncomingPage)}
          </div>
        </div>
      </div>

      {/* Section 2: My Stock Location Quantities */}
      <div className="bg-white border rounded-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">My Stock Location Quantities</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="font-semibold" onClick={toggleStockSelectAll}>
              <CheckSquare className="h-4 w-4 mr-1" /> Select All
            </Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold" onClick={handleReturnSelected} disabled={stockSelectedIds.size === 0}>
              <RotateCcw className="h-4 w-4 mr-1" /> Return Selected to Warehouse
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search ledger..." value={stockSearch} onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }} className="text-sm pl-9" />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10"><input type="checkbox" checked={paginatedStock.length > 0 && stockSelectedIds.size === paginatedStock.length} onChange={toggleStockSelectAll} className="rounded border-slate-300" /></TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Category</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Available Stock</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading stock data...</TableCell></TableRow>
                ) : paginatedStock.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No stock items found</TableCell></TableRow>
                ) : (
                  paginatedStock.map((item: any, idx: number) => {
                    const itemId = item.productId || item.sku || `item-${idx}`;
                    return (
                      <TableRow key={itemId} className="border-b">
                        <TableCell><input type="checkbox" checked={stockSelectedIds.has(itemId)} onChange={() => toggleStockSelect(itemId)} className="rounded border-slate-300" /></TableCell>
                        <TableCell className="text-xs font-mono text-slate-700 max-w-[350px] truncate">{item.sku || item.productId || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{item.productName || '—'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{item.category || 'Raw'}</TableCell>
                        <TableCell className="text-right"><span className="font-bold text-green-600">{Math.round(Number(item.currentStock || 0)).toLocaleString()}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3" onClick={() => openReturnDialog(item)}>Return to Warehouse</Button>
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white text-xs px-3" onClick={() => openRejectDialog(item)}>Reject Material</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {stockTotal === 0 ? 0 : (stockPage - 1) * stockPerPage + 1} to {Math.min(stockPage * stockPerPage, stockTotal)} of {stockTotal} entries</p>
            {renderPagination(stockPage, stockTotalPages, setStockPage)}
          </div>
        </div>
      </div>

      {/* Section 3: Production History & Quality Verification Console */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">Production History &amp; Quality Verification Console</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search ledger..." value={histSearch} onChange={(e) => { setHistSearch(e.target.value); setHistPage(1); }} className="text-sm pl-9" />
            </div>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Run Log ID</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Consumed Raw SKU</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Produced Finished SKU</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Produced Qty</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Dest Warehouse</TableHead>
                  <TableHead className="text-xs font-bold uppercase whitespace-nowrap">QC Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading production history...</TableCell></TableRow>
                ) : histLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No production logs found</TableCell></TableRow>
                ) : (
                  histLogs.map((log: any) => {
                    const qc = QC_DISPLAY[log.qcStatus] || QC_DISPLAY.pending;
                    const consumedQty = Math.round(Number(log.qtyConsumed || 0));
                    const rawSkuDisplay = `${log.rawMaterialId || log.rawMaterialName || '—'} (${consumedQty})`;
                    return (
                      <TableRow key={log.logId} className="border-b">
                        <TableCell className="text-sm font-medium whitespace-nowrap">{log.logNumber || `PROD-${log.logId?.slice(-4) || '—'}`}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{log.date ? new Date(log.date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="text-sm max-w-[400px]"><span className="font-mono text-xs break-all">{rawSkuDisplay}</span></TableCell>
                        <TableCell className="text-sm max-w-[300px]"><span className="text-amber-600 font-medium cursor-pointer hover:underline">{log.finishedProductName || '—'}</span></TableCell>
                        <TableCell className="text-right"><span className="font-bold text-slate-900">{Math.round(Number(log.qtyProduced || 0)).toLocaleString()}</span></TableCell>
                        <TableCell className="text-sm">{log.destinationWarehouseName || log.destinationWarehouseId || '—'}</TableCell>
                        <TableCell><span className={qc.className}>{qc.label}</span></TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {histTotal === 0 ? 0 : (histPage - 1) * histPerPage + 1} to {Math.min(histPage * histPerPage, histTotal)} of {histTotal} entries</p>
            {renderPagination(histPage, histTotalPages, setHistPage)}
          </div>
        </div>
      </div>

      {/* Receive Material Dialog */}
      <Dialog open={receiveDialog} onOpenChange={setReceiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Receive Material</DialogTitle></DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Transfer No:</span><span className="font-medium">{selectedTransfer.transferNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Order No:</span><span>{selectedTransfer.orderNo || selectedTransfer.referenceNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">From Warehouse:</span><span>{selectedTransfer.sourceWarehouseName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Product:</span><span className="max-w-[200px] truncate">{selectedTransfer.finalProductName || selectedTransfer.productName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Dispatched Qty:</span><span className="font-medium">{Number(selectedTransfer.dispatchedQty || selectedTransfer.totalQuantity || 0).toLocaleString()}</span></div>
              </div>
              <div className="space-y-2"><Label>Received Quantity *</Label><Input type="number" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} placeholder="Enter quantity received" className="bg-yellow-50" min={1} /></div>
              <div className="space-y-2"><Label>Target Bin / Rack (Optional)</Label><Input type="text" value={targetBin} onChange={(e) => setTargetBin(e.target.value)} placeholder="e.g. A1-R3-B5" className="bg-yellow-50" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialog(false)}>Cancel</Button>
            <Button onClick={handleReceive} disabled={receiveMutation.isPending || !receivedQty || Number(receivedQty) <= 0} className="bg-green-600 hover:bg-green-700 text-white">{receiveMutation.isPending ? 'Receiving...' : 'Confirm Receive'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return to Warehouse Dialog */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Return to Warehouse</DialogTitle></DialogHeader>
          {selectedStockItem ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Product ID:</span><span className="font-mono text-xs max-w-[200px] truncate">{selectedStockItem.sku || selectedStockItem.productId || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Product Name:</span><span className="max-w-[200px] truncate">{selectedStockItem.productName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Available Stock:</span><span className="font-bold text-green-600">{Math.round(Number(selectedStockItem.currentStock || 0)).toLocaleString()}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse *</Label>
                <Select value={returnWarehouseId} onValueChange={setReturnWarehouseId}><SelectTrigger className="bg-yellow-50"><SelectValue placeholder="Select warehouse" /></SelectTrigger><SelectContent>{otherWarehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Return Quantity *</Label><Input type="number" value={returnQty} onChange={(e) => setReturnQty(e.target.value)} placeholder="Enter quantity to return" className="bg-yellow-50" min={1} max={Number(selectedStockItem.currentStock || 0)} /></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Return {stockSelectedIds.size} selected item(s) to warehouse:</p>
              <div className="space-y-2">
                <Label>Destination Warehouse *</Label>
                <Select value={returnWarehouseId} onValueChange={setReturnWarehouseId}><SelectTrigger className="bg-yellow-50"><SelectValue placeholder="Select warehouse" /></SelectTrigger><SelectContent>{otherWarehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(false)}>Cancel</Button>
            <Button onClick={selectedStockItem ? handleReturn : handleBulkReturn} disabled={returnMutation.isPending || !returnWarehouseId} className="bg-amber-500 hover:bg-amber-600 text-white">{returnMutation.isPending ? 'Processing...' : 'Confirm Return'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Material Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Material</DialogTitle></DialogHeader>
          {selectedStockItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Product ID:</span><span className="font-mono text-xs max-w-[200px] truncate">{selectedStockItem.sku || selectedStockItem.productId || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Product Name:</span><span className="max-w-[200px] truncate">{selectedStockItem.productName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Available Stock:</span><span className="font-bold text-green-600">{Math.round(Number(selectedStockItem.currentStock || 0)).toLocaleString()}</span></div>
              </div>
              <div className="space-y-2"><Label>Reason for Rejection *</Label><Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason for rejecting this material..." className="bg-yellow-50" rows={3} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleReject} disabled={rejectMutation.isPending || !rejectReason.trim()} className="bg-red-500 hover:bg-red-600 text-white">{rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
