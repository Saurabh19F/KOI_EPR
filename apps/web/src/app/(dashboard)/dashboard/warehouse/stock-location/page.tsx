'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
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
import { RotateCcw, CheckSquare, Search } from 'lucide-react';


export default function StockLocationPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [returnDialog, setReturnDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnWarehouseId, setReturnWarehouseId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-location', warehouseId],
    queryFn: () => inventoryApi.getStock({ warehouseId, limit: 5000 }),
    enabled: !!warehouseId,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const allStock: any[] = useMemo(() => {
    const raw = stockData?.data?.data || stockData?.data || [];
    return raw.filter((item: any) => {
      const qty = Number(item.currentStock || 0);
      return qty > 0 && item.warehouseId === warehouseId;
    });
  }, [stockData, warehouseId]);

  const warehouseList: any[] = warehousesData?.data || [];
  const otherWarehouses = warehouseList.filter((w: any) => w.id !== warehouseId);

  const filteredStock = useMemo(() => {
    if (!search) return allStock;
    const s = search.toLowerCase();
    return allStock.filter((item: any) =>
      item.productId?.toLowerCase().includes(s) ||
      item.sku?.toLowerCase().includes(s) ||
      item.productName?.toLowerCase().includes(s) ||
      item.category?.toLowerCase().includes(s)
    );
  }, [allStock, search]);

  const total = filteredStock.length;
  const totalPages = Math.ceil(total / entriesPerPage);
  const paginatedStock = filteredStock.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const returnMutation = useMutation({
    mutationFn: async (data: any) => {
      return inventoryApi.transferStock(data);
    },
    onSuccess: () => {
      toast.success('Return to warehouse initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setReturnDialog(false);
      setSelectedItem(null);
      setReturnQty('');
      setReturnWarehouseId('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to initiate return');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      return inventoryApi.transferStock({
        sourceWarehouseId: warehouseId,
        destinationWarehouseId: warehouseId,
        requestType: 'reject',
        items: [{ productId, quantity: 0 }],
        remarks: reason,
      });
    },
    onSuccess: () => {
      toast.success('Material rejected');
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setRejectDialog(false);
      setSelectedItem(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reject material');
    },
  });

  const openReturnDialog = (item: any) => {
    setSelectedItem(item);
    setReturnQty(String(Math.round(Number(item.currentStock || 0))));
    setReturnWarehouseId('');
    setReturnDialog(true);
  };

  const handleReturn = () => {
    if (!selectedItem || !returnQty || !returnWarehouseId) {
      toast.error('Please fill all required fields');
      return;
    }
    const qty = Number(returnQty);
    if (qty <= 0) {
      toast.error('Return quantity must be greater than 0');
      return;
    }
    if (qty > Number(selectedItem.currentStock || 0)) {
      toast.error('Return quantity cannot exceed available stock');
      return;
    }
    const destWarehouse = warehouseList.find((w: any) => w.id === returnWarehouseId);
    returnMutation.mutate({
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: returnWarehouseId,
      sourceWarehouseName: warehouseList.find((w: any) => w.id === warehouseId)?.name || warehouseId,
      destinationWarehouseName: destWarehouse?.name || returnWarehouseId,
      requestType: 'return',
      items: [{
        productId: selectedItem.productId || selectedItem.sku,
        productName: selectedItem.productName,
        sku: selectedItem.sku,
        quantity: qty,
        uom: selectedItem.uom || 'Per Kg',
      }],
    });
  };

  const openRejectDialog = (item: any) => {
    setSelectedItem(item);
    setRejectReason('');
    setRejectDialog(true);
  };

  const handleReject = () => {
    if (!selectedItem) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({
      productId: selectedItem.productId || selectedItem.sku,
      reason: rejectReason.trim(),
    });
  };

  const handleReturnSelected = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one item');
      return;
    }
    setSelectedItem(null);
    setReturnWarehouseId('');
    setReturnDialog(true);
  };

  const handleBulkReturn = async () => {
    if (!returnWarehouseId) {
      toast.error('Please select a destination warehouse');
      return;
    }
    const selected = allStock.filter((item: any) => selectedIds.has(item.productId || item.sku));
    const destWarehouse = warehouseList.find((w: any) => w.id === returnWarehouseId);
    try {
      await inventoryApi.transferStock({
        sourceWarehouseId: warehouseId,
        destinationWarehouseId: returnWarehouseId,
        sourceWarehouseName: warehouseList.find((w: any) => w.id === warehouseId)?.name || warehouseId,
        destinationWarehouseName: destWarehouse?.name || returnWarehouseId,
        requestType: 'return',
        items: selected.map((item: any) => ({
          productId: item.productId || item.sku,
          productName: item.productName,
          sku: item.sku,
          quantity: Math.round(Number(item.currentStock || 0)),
          uom: item.uom || 'Per Kg',
        })),
      });
      toast.success(`${selected.length} item(s) returned to warehouse`);
      queryClient.invalidateQueries({ queryKey: ['stock-location'] });
      setReturnDialog(false);
      setSelectedIds(new Set());
      setReturnWarehouseId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to return items');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedStock.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedStock.map((item: any) => item.productId || item.sku)));
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My Stock Location Quantities</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="font-semibold"
            onClick={toggleSelectAll}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={handleReturnSelected}
            disabled={selectedIds.size === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Return Selected to Warehouse
          </Button>
        </div>
      </div>

      {/* Search + Entries per page */}
      <div className="flex items-center gap-4">
        <div className="relative w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search ledger..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="text-sm pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(entriesPerPage)} onValueChange={(v) => { setEntriesPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">entries per page</span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={paginatedStock.length > 0 && selectedIds.size === paginatedStock.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product Name</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Category</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Available Stock</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Loading stock data...
                </TableCell>
              </TableRow>
            ) : paginatedStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  No stock items found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStock.map((item: any, idx: number) => {
                const itemId = item.productId || item.sku || `item-${idx}`;
                return (
                  <TableRow key={itemId} className="border-b">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(itemId)}
                        onChange={() => toggleSelect(itemId)}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700 max-w-[350px] truncate">
                      {item.sku || item.productId || '—'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">
                      {item.productName || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {item.category || 'Raw'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-green-600">{Math.round(Number(item.currentStock || 0)).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3"
                          onClick={() => openReturnDialog(item)}
                        >
                          Return to Warehouse
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3"
                          onClick={() => openRejectDialog(item)}
                        >
                          Reject Material
                        </Button>
                      </div>
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

      {/* Return to Warehouse Dialog */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return to Warehouse</DialogTitle>
          </DialogHeader>
          {selectedItem ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product ID:</span>
                  <span className="font-mono text-xs max-w-[200px] truncate">{selectedItem.sku || selectedItem.productId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product Name:</span>
                  <span className="max-w-[200px] truncate">{selectedItem.productName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Stock:</span>
                  <span className="font-bold text-green-600">{Math.round(Number(selectedItem.currentStock || 0)).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse *</Label>
                <Select value={returnWarehouseId} onValueChange={setReturnWarehouseId}>
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherWarehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Return Quantity *</Label>
                <Input
                  type="number"
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  placeholder="Enter quantity to return"
                  className="bg-yellow-50"
                  min={1}
                  max={Number(selectedItem.currentStock || 0)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Return {selectedIds.size} selected item(s) to warehouse:
              </p>
              <div className="space-y-2">
                <Label>Destination Warehouse *</Label>
                <Select value={returnWarehouseId} onValueChange={setReturnWarehouseId}>
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherWarehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedItem ? handleReturn : handleBulkReturn}
              disabled={returnMutation.isPending || !returnWarehouseId}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Material Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Material</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product ID:</span>
                  <span className="font-mono text-xs max-w-[200px] truncate">{selectedItem.sku || selectedItem.productId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product Name:</span>
                  <span className="max-w-[200px] truncate">{selectedItem.productName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Stock:</span>
                  <span className="font-bold text-green-600">{Math.round(Number(selectedItem.currentStock || 0)).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Rejection *</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejecting this material..."
                  className="bg-yellow-50"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
