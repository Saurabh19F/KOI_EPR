'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function StockReportPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<any>(null);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-ledger', page],
    queryFn: () => inventoryApi.getStock({ limit: 500 }),
  });

  const warehouseList: any[] = warehouses?.data || [];
  const allStock: any[] = stockData?.data?.data || stockData?.data || [];

  const transferMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.transferStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-ledger'] });
      setTransferOpen(false);
      setTransferItem(null);
      setFromWarehouseId('');
      setToWarehouseId('');
      setTransferQty('');
      setTransferRemarks('');
      alert('Transfer request created successfully');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || 'Transfer failed');
    },
  });

  const openTransferDialog = (item: any) => {
    setTransferItem(item);
    setFromWarehouseId('');
    setToWarehouseId('');
    setTransferQty('');
    setTransferRemarks('');
    setTransferOpen(true);
  };

  const handleTransfer = () => {
    if (!fromWarehouseId || !toWarehouseId || !transferQty || Number(transferQty) <= 0) {
      alert('Please fill all required fields');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      alert('Source and destination warehouse must be different');
      return;
    }
    transferMutation.mutate({
      productId: transferItem.productId || transferItem.sku,
      sku: transferItem.sku,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(transferQty),
      remarks: transferRemarks || undefined,
    });
  };

  const sourceWarehouseAvailableQty = useMemo(() => {
    if (!transferItem || !fromWarehouseId) return 0;
    return transferItem.warehouseIdStock?.[fromWarehouseId] || 0;
  }, [transferItem, fromWarehouseId]);

  const grouped = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of allStock) {
      const key = item.productId || item.sku || item.stockId;
      if (!map.has(key)) {
        map.set(key, {
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          category: item.category || 'Raw',
          uom: item.uom || 'Per Kg',
          poOrderNo: item.poOrderNo || '',
          locations: [],
          warehouseStock: {} as Record<string, number>,
          warehouseIdStock: {} as Record<string, number>,
          totalStock: 0,
        });
      }
      const group = map.get(key)!;
      const whName = warehouseList.find((w: any) => w.id === item.warehouseId)?.name || item.warehouseId || '';
      const qty = Math.round(Number(item.currentStock || 0));
      const bin = item.binLocation || 'Inward-Staging';

      group.warehouseStock[whName] = (group.warehouseStock[whName] || 0) + qty;
      if (item.warehouseId) {
        group.warehouseIdStock[item.warehouseId] = (group.warehouseIdStock[item.warehouseId] || 0) + qty;
      }
      group.totalStock += qty;
      group.locations.push({ warehouse: whName, bin, qty });
    }
    return Array.from(map.values());
  }, [allStock, warehouseList]);

  const filtered = useMemo(() => {
    if (!search) return grouped;
    const s = search.toLowerCase();
    return grouped.filter(
      (item) =>
        item.sku?.toLowerCase().includes(s) ||
        item.productName?.toLowerCase().includes(s) ||
        item.poOrderNo?.toLowerCase().includes(s)
    );
  }, [grouped, search]);

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / limit);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const whNames = useMemo(() => {
    const names = new Set<string>();
    for (const g of grouped) {
      for (const wh of Object.keys(g.warehouseStock)) {
        names.add(wh);
      }
    }
    return Array.from(names).sort();
  }, [grouped]);

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

  return (
    <div className="p-4 space-y-4">
      {/* Search */}
      <div className="relative w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search stock ledger..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-amber-400 hover:bg-amber-400">
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">Product ID</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">Product Name</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">Category</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">UOM</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">PO / Order No</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap">Locations / Bins</TableHead>
              {whNames.map((wh) => (
                <TableHead key={wh} className="text-black font-bold text-xs uppercase whitespace-nowrap text-right">
                  {wh} Stock
                </TableHead>
              ))}
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap text-right">Total Stock</TableHead>
              <TableHead className="text-black font-bold text-xs uppercase whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7 + whNames.length} className="text-center py-8 text-slate-400">
                  Loading stock ledger...
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7 + whNames.length} className="text-center py-8 text-slate-400">
                  No stock records found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item, idx) => (
                <TableRow key={item.sku} className="border-b">
                  <TableCell className="font-mono text-xs text-slate-700 whitespace-nowrap max-w-[280px] truncate">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-sm max-w-[320px]">{item.productName}</TableCell>
                  <TableCell className="text-sm">{item.category}</TableCell>
                  <TableCell className="text-sm">{item.uom}</TableCell>
                  <TableCell className="text-sm">
                    {item.poOrderNo ? (
                      <span className="text-blue-600 underline cursor-pointer">{item.poOrderNo}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-[300px]">
                    {formatLocations(item.locations)}
                  </TableCell>
                  {whNames.map((wh) => (
                    <TableCell key={wh} className="text-right text-sm">
                      {item.warehouseStock[wh] != null ? item.warehouseStock[wh].toLocaleString() : 0}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-sm">{item.totalStock.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3"
                      onClick={() => openTransferDialog(item)}
                    >
                      WH Transfer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {totalEntries === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, totalEntries)} of {totalEntries.toLocaleString()} entries
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
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="min-w-[36px]"
                >
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} className="min-w-[36px]">
                  {totalPages}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              &rsaquo;
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
              &raquo;
            </Button>
          </div>
        )}
      </div>

      {/* Warehouse Stock Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Warehouse Stock Transfer</DialogTitle>
            <DialogDescription>
              Transfer stock between warehouses
            </DialogDescription>
          </DialogHeader>

          {transferItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-semibold text-sm">{transferItem.productName}</p>
                <p className="text-xs text-slate-500 font-mono">{transferItem.sku}</p>
              </div>

              <div className="space-y-2">
                <Label>Source Warehouse</Label>
                <Select value={fromWarehouseId} onValueChange={(val) => { setFromWarehouseId(val); setTransferQty(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList
                      .filter((w: any) => {
                        const whStock = transferItem.warehouseIdStock?.[w.id] || 0;
                        if (whStock <= 0) return false;
                        if (user?.warehouseId) return w.id === user.warehouseId;
                        return true;
                      })
                      .map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} — Available: {(transferItem.warehouseIdStock?.[w.id] || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination Warehouse</Label>
                <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseList
                      .filter((w: any) => w.id !== fromWarehouseId)
                      .map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Transfer Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={sourceWarehouseAvailableQty}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  placeholder="Enter quantity"
                />
                {fromWarehouseId && (
                  <p className="text-xs text-slate-500">
                    Available in {warehouseList.find((w: any) => w.id === fromWarehouseId)?.name}: {sourceWarehouseAvailableQty.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Input
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="Reason for transfer"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleTransfer}
              disabled={transferMutation.isPending || !fromWarehouseId || !toWarehouseId || !transferQty || Number(transferQty) <= 0}
            >
              {transferMutation.isPending ? 'Transferring...' : 'Create Transfer Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
