'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, inventoryTrackingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Warehouse,
  LayoutGrid,
  ListTree,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BinRackOperationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newBin, setNewBin] = useState('');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });
  const warehouseList: any[] = warehouses?.data || [];

  const defaultWarehouseId = user?.warehouseId || warehouseList[0]?.id || '';
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const activeWarehouseId = selectedWarehouse || defaultWarehouseId;
  const activeWarehouseName = warehouseList.find((w: any) => w.id === activeWarehouseId)?.name || '';

  const { data, isLoading } = useQuery({
    queryKey: ['bin-rack-stock', activeWarehouseId, search, page],
    queryFn: async () => {
      const res = await inventoryTrackingApi.getBinRackStock(activeWarehouseId, {
        search: search || undefined,
        page,
        limit: 50,
      });
      return res.data;
    },
    enabled: !!activeWarehouseId,
  });

  const stockItems = data?.data || [];
  const total = data?.total || 0;
  const stagingTotal = data?.stagingTotal || 0;
  const distinctBins = data?.distinctBins || 0;

  const assignMutation = useMutation({
    mutationFn: (params: { stockId: string; newBin: string }) =>
      inventoryTrackingApi.assignBinRack(params),
    onSuccess: () => {
      toast.success('Bin/Rack assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['bin-rack-stock'] });
      setAssignDialog(false);
      setSelectedItem(null);
      setNewBin('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to assign bin/rack');
    },
  });

  const handleAssign = () => {
    if (!selectedItem || !newBin.trim()) {
      toast.error('Please enter a bin/rack location');
      return;
    }
    assignMutation.mutate({ stockId: selectedItem.stock_id, newBin: newBin.trim() });
  };

  const openAssignDialog = (item: any) => {
    setSelectedItem(item);
    setNewBin(item.bin_location === 'Inward-Staging' ? '' : item.bin_location || '');
    setAssignDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-600 tracking-wider uppercase">Internal Layout Strategy</p>
          <h1 className="text-2xl font-bold text-slate-900">Bin & Rack Operations Console</h1>
        </div>
        <div className="flex items-center gap-3">
          {warehouseList.length > 1 && (
            <Select value={activeWarehouseId} onValueChange={(v) => { setSelectedWarehouse(v); setPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouseList.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-slate-300">
            <Warehouse className="h-4 w-4 mr-2" />
            Active Warehouse ID: <span className="font-bold ml-1">{activeWarehouseName || '—'}</span>
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Warehouse className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Material in Staging Area</p>
                <p className="text-3xl font-bold text-slate-900">{Number(stagingTotal).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <LayoutGrid className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Distinct Tracked Bins</p>
                <p className="text-3xl font-bold text-slate-900">{distinctBins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListTree className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Internal Storage Location Blueprint</h2>
          </div>
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search product/bin..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Product ID</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Product Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Current Bin/Rack</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      Loading stock data...
                    </TableCell>
                  </TableRow>
                ) : stockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No stock items found in this warehouse
                    </TableCell>
                  </TableRow>
                ) : (
                  stockItems.map((item: any) => (
                    <TableRow key={item.stock_id} className="border-b">
                      <TableCell className="font-mono text-xs text-slate-700">{item.sku}</TableCell>
                      <TableCell className="text-sm">{item.product_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            item.bin_location === 'Inward-Staging'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }
                        >
                          {item.bin_location || 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-600">
                        {Number(item.current_stock).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => openAssignDialog(item)}
                        >
                          <ListTree className="h-3.5 w-3.5 mr-1" />
                          Assign Bin/Rack
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              Page {page} of {Math.ceil(total / 50)} ({total} items)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Bin/Rack Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Bin / Rack Location</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-medium text-right max-w-[250px] truncate">{selectedItem.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SKU:</span>
                  <span className="font-mono text-xs">{selectedItem.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Location:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">{selectedItem.bin_location || 'Unassigned'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold">{Number(selectedItem.current_stock).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Bin / Rack Location *</Label>
                <Input
                  value={newBin}
                  onChange={(e) => setNewBin(e.target.value)}
                  placeholder="e.g. A-01-R1-S2, Zone-B-Rack-3"
                  className="bg-yellow-50"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignMutation.isPending || !newBin.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
