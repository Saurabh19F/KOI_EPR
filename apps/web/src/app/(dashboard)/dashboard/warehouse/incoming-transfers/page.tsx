'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
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
import { PackageCheck, CheckSquare } from 'lucide-react';


export default function IncomingTransfersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [receiveDialog, setReceiveDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [targetBin, setTargetBin] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incoming-transfers', warehouseId, page, entriesPerPage],
    queryFn: async () => {
      const params: any = { page, limit: entriesPerPage, status: 'in_transit' };
      if (warehouseId) params.destinationWarehouseId = warehouseId;
      const res = await inventoryTrackingApi.getTransfers(params);
      return res.data;
    },
  });

  const transfers = data?.data || data?.transfers || [];
  const total = data?.total || data?.count || 0;
  const totalPages = Math.ceil(total / entriesPerPage);

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

  const handleReceive = () => {
    if (!selectedTransfer || !receivedQty) return;
    const qty = Number(receivedQty);
    if (qty <= 0) {
      toast.error('Received quantity must be greater than 0');
      return;
    }
    receiveMutation.mutate({
      transferId: selectedTransfer.transferId,
      receivedQty: qty,
      targetBin: targetBin || undefined,
    });
  };

  const openReceiveDialog = (transfer: any) => {
    setSelectedTransfer(transfer);
    setReceivedQty(String(transfer.dispatchedQty || transfer.totalQuantity || ''));
    setTargetBin('');
    setReceiveDialog(true);
  };

  const handleReceiveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one transfer to receive');
      return;
    }
    const selected = transfers.filter((t: any) => selectedIds.has(t.transferId));
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
      setSelectedIds(new Set());
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
    if (selectedIds.size === transfers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transfers.map((t: any) => t.transferId)));
    }
  };

  const filteredTransfers = transfers.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.transferNumber?.toLowerCase().includes(s) ||
      t.orderNo?.toLowerCase().includes(s) ||
      t.sku?.toLowerCase().includes(s) ||
      t.finalProductName?.toLowerCase().includes(s) ||
      t.productName?.toLowerCase().includes(s) ||
      t.sourceWarehouseName?.toLowerCase().includes(s) ||
      t.poNumber?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Incoming Transferred Material (Receive Material)</h1>
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
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={handleReceiveSelected}
            disabled={selectedIds.size === 0}
          >
            <PackageCheck className="h-4 w-4 mr-1" />
            Receive Selected
          </Button>
        </div>
      </div>

      {/* Entries per page */}
      <div className="flex items-center gap-4">
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
                  checked={transfers.length > 0 && selectedIds.size === transfers.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </TableHead>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                  Loading incoming transfers...
                </TableCell>
              </TableRow>
            ) : filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                  No incoming transfers found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((transfer: any) => (
                <TableRow key={transfer.transferId} className="border-b">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(transfer.transferId)}
                      onChange={() => toggleSelect(transfer.transferId)}
                      className="rounded border-slate-300"
                    />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {transfer.transferNumber || `REQ-${transfer.transferId?.slice(-5) || '—'}`}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-blue-600 font-medium">{transfer.orderNo || transfer.referenceNumber || '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[350px]">
                    <div className="font-mono text-xs text-slate-700 truncate">{transfer.sku || transfer.productId || '—'}</div>
                    <div className="text-xs text-slate-500 truncate">{transfer.finalProductName || transfer.productName || '—'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-slate-900">{Number(transfer.dispatchedQty || transfer.totalQuantity || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-sm">{transfer.uom || 'Per Kg'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{transfer.poNumber || transfer.purchaseOrderNumber || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{transfer.sourceWarehouseName || transfer.sourceWarehouseId || '—'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                      onClick={() => openReceiveDialog(transfer)}
                    >
                      Receive Material
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

      {/* Receive Material Dialog */}
      <Dialog open={receiveDialog} onOpenChange={setReceiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Material</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transfer No:</span>
                  <span className="font-medium">{selectedTransfer.transferNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order No:</span>
                  <span>{selectedTransfer.orderNo || selectedTransfer.referenceNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">From Warehouse:</span>
                  <span>{selectedTransfer.sourceWarehouseName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="max-w-[200px] truncate">{selectedTransfer.finalProductName || selectedTransfer.productName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispatched Qty:</span>
                  <span className="font-medium">{Number(selectedTransfer.dispatchedQty || selectedTransfer.totalQuantity || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Received Quantity *</Label>
                <Input
                  type="number"
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)}
                  placeholder="Enter quantity received"
                  className="bg-yellow-50"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Bin / Rack (Optional)</Label>
                <Input
                  type="text"
                  value={targetBin}
                  onChange={(e) => setTargetBin(e.target.value)}
                  placeholder="e.g. A1-R3-B5"
                  className="bg-yellow-50"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReceive}
              disabled={receiveMutation.isPending || !receivedQty || Number(receivedQty) <= 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {receiveMutation.isPending ? 'Receiving...' : 'Confirm Receive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
