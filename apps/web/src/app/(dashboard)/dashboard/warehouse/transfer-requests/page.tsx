'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryTrackingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { generateTransferNotePDF } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Package,
  TruckIcon,
} from 'lucide-react';


export default function TransferRequestsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const warehouseId = user?.warehouseId;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [dispatchDialog, setDispatchDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [dispatchQty, setDispatchQty] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transfer-requests', warehouseId, page],
    queryFn: async () => {
      const params: any = { page, limit: 20, status: 'in_transit' };
      if (warehouseId) params.sourceWarehouseId = warehouseId;
      const res = await inventoryTrackingApi.getTransfers(params);
      return res.data;
    },
  });

  const transfers = data?.data || data?.transfers || [];
  const total = data?.total || data?.count || 0;

  const dispatchMutation = useMutation({
    mutationFn: async ({ transferId, dispatchedQty }: { transferId: string; dispatchedQty: number }) => {
      return inventoryTrackingApi.dispatchMaterial(transferId, { dispatchedQty });
    },
    onSuccess: () => {
      toast.success('Material dispatched successfully');
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      setDispatchDialog(false);
      setSelectedTransfer(null);
      setDispatchQty('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to dispatch material');
    },
  });

  const handleDispatch = () => {
    if (!selectedTransfer || !dispatchQty) return;
    const qty = Number(dispatchQty);
    if (qty <= 0) {
      toast.error('Dispatch quantity must be greater than 0');
      return;
    }
    dispatchMutation.mutate({
      transferId: selectedTransfer.transferId,
      dispatchedQty: qty,
    });
  };

  const openDispatchDialog = (transfer: any) => {
    setSelectedTransfer(transfer);
    setDispatchQty(String(transfer.totalQuantity || ''));
    setDispatchDialog(true);
  };

  const filteredTransfers = transfers.filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.transferNumber?.toLowerCase().includes(s) ||
      t.orderNo?.toLowerCase().includes(s) ||
      t.finalProductName?.toLowerCase().includes(s) ||
      t.destinationWarehouseName?.toLowerCase().includes(s) ||
      t.requestedByUsername?.toLowerCase().includes(s)
    );
  });

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Approved Transfer Requests (Send Material)</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Package className="h-4 w-4 mr-1" /> Download PDF
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Package className="h-4 w-4 mr-1" /> Download Excel
          </Button>
          <Button variant="link" size="sm" className="text-blue-600 font-medium">
            Action Queue
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-[200px]">
        <Input
          placeholder="Search ledger..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Req ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Order No</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Production For</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Product ID</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Item Description</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">UOM</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Requester</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Req Qty</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">To Warehouse</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap">Last Edit Status</TableHead>
              <TableHead className="text-xs font-bold uppercase whitespace-nowrap text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-slate-400">
                  Loading transfer requests...
                </TableCell>
              </TableRow>
            ) : filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-slate-400">
                  No transfer requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((transfer: any) => (
                <TableRow key={transfer.transferId} className="border-b">
                  <TableCell className="text-sm whitespace-nowrap">{transfer.transferNumber || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-blue-600 font-medium">{transfer.orderNo || '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm">{transfer.productionFor || '—'}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-600 max-w-[280px] truncate">{transfer.sku || transfer.productId || '—'}</TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">{transfer.finalProductName || transfer.productName || '—'}</TableCell>
                  <TableCell className="text-sm">{transfer.uom || 'Per Kg'}</TableCell>
                  <TableCell className="text-sm">{transfer.requestedByUsername || transfer.requesterName || '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600 font-bold">{Number(transfer.totalQuantity || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-sm">{transfer.destinationWarehouseName || '—'}</TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[180px]">
                    {transfer.lastEditBy || transfer.requestedByUsername || '—'}
                    {transfer.updatedAt && (
                      <span className="block">{new Date(transfer.updatedAt).toLocaleString()}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" className="text-xs px-2" onClick={() => generateTransferNotePDF(transfer)}>
                        <Package className="h-3 w-3 mr-1" /> PDF
                      </Button>
                      {(transfer.status === 'in_transit' || transfer.status === 'approved') && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3"
                          onClick={() => openDispatchDialog(transfer)}
                        >
                          Send Material
                        </Button>
                      )}
                      {transfer.status === 'in_transit' && (
                        <Badge variant="outline" className="text-blue-600">
                          <TruckIcon className="h-3 w-3 mr-1" /> In Transit
                        </Badge>
                      )}
                    </div>
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
          Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
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

      {/* Dispatch Material Dialog */}
      <Dialog open={dispatchDialog} onOpenChange={setDispatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Material</DialogTitle>
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
                  <span>{selectedTransfer.orderNo || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span>{selectedTransfer.destinationWarehouseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Qty:</span>
                  <span className="font-medium">{Number(selectedTransfer.totalQuantity || 0).toLocaleString()}</span>
                </div>
                {selectedTransfer.requestRemarks && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remarks:</span>
                    <span>{selectedTransfer.requestRemarks}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Dispatch Quantity *</Label>
                <Input
                  type="number"
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(e.target.value)}
                  placeholder="Enter quantity to dispatch"
                  className="bg-yellow-50"
                  min={1}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispatchDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDispatch}
              disabled={dispatchMutation.isPending || !dispatchQty || Number(dispatchQty) <= 0}
            >
              {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
