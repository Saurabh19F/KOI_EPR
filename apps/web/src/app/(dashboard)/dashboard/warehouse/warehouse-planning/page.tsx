'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Warehouse,
  Plus,
  Search,
  MapPin,
  Trash2,
} from 'lucide-react';

export default function WarehousePlanningPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [registerDialog, setRegisterDialog] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', type: 'All' });

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await inventoryApi.getWarehouses();
      return res.data;
    },
  });

  const warehouses = Array.isArray(data) ? data : data?.data || [];

  const createMutation = useMutation({
    mutationFn: async (warehouseData: { name: string; location: string; type: string }) => {
      return inventoryApi.createWarehouse(warehouseData);
    },
    onSuccess: () => {
      toast.success('Warehouse registered successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setRegisterDialog(false);
      setNewWarehouse({ name: '', location: '', type: 'All' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to register warehouse');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return inventoryApi.deleteWarehouse(id);
    },
    onSuccess: () => {
      toast.success('Warehouse de-registered');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to de-register warehouse');
    },
  });

  const handleRegister = () => {
    if (!newWarehouse.name.trim()) {
      toast.error('Warehouse name is required');
      return;
    }
    createMutation.mutate(newWarehouse);
  };

  const filteredWarehouses = warehouses.filter((w: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.name?.toLowerCase().includes(s) ||
      w.location?.toLowerCase().includes(s) ||
      w.code?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Infrastructure Matrix</p>
          <h1 className="text-2xl font-bold text-slate-900">Registered Locations Matrix</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredWarehouses.length} Registered
          </Badge>
          <Button onClick={() => setRegisterDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Register Warehouse
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search ledger..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                    Loading warehouses...
                  </TableCell>
                </TableRow>
              ) : filteredWarehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                    No warehouses registered
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarehouses.map((warehouse: any) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-slate-400" />
                        {warehouse.code || warehouse.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {warehouse.location || warehouse.address || '—'}
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.type || 'All'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`De-register warehouse "${warehouse.name}"?`)) {
                            deleteMutation.mutate(warehouse.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> De-register
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        Showing 1 to {filteredWarehouses.length} of {filteredWarehouses.length} entries
      </p>

      <Dialog open={registerDialog} onOpenChange={setRegisterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Warehouse Name *</Label>
              <Input
                value={newWarehouse.name}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                placeholder="e.g. W1, M1, Delhi Main"
                className="bg-yellow-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={newWarehouse.location}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
                placeholder="e.g. Delhi, Mumbai"
                className="bg-yellow-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newWarehouse.type}
                onValueChange={(v) => setNewWarehouse({ ...newWarehouse, type: v })}
              >
                <SelectTrigger className="bg-yellow-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Raw">Raw Material</SelectItem>
                  <SelectItem value="Finished">Finished Goods</SelectItem>
                  <SelectItem value="Transit">Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRegister}
              disabled={createMutation.isPending || !newWarehouse.name.trim()}
            >
              {createMutation.isPending ? 'Registering...' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
