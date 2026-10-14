'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import {
  Grid3X3,
  Plus,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BinRack {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouseName?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  isActive: boolean;
}

export default function BinRackManagementPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<BinRack | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseId: '',
    zone: '',
    aisle: '',
    rack: '',
    shelf: '',
    capacity: '',
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const warehouseList = warehouses?.data || [];

  const bins: BinRack[] = warehouseList.flatMap((wh: any) => {
    if (wh.bins && Array.isArray(wh.bins)) {
      return wh.bins.map((b: any) => ({ ...b, warehouseName: wh.name, warehouseId: wh.id }));
    }
    return [];
  });

  const filteredBins = bins.filter((b) => {
    const matchesWarehouse = selectedWarehouse === 'all' || b.warehouseId === selectedWarehouse;
    const matchesSearch = !search ||
      b.code?.toLowerCase().includes(search.toLowerCase()) ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.zone?.toLowerCase().includes(search.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  const handleOpenDialog = (item?: BinRack) => {
    if (item) {
      setEditItem(item);
      setFormData({
        code: item.code || '',
        name: item.name || '',
        warehouseId: item.warehouseId || '',
        zone: item.zone || '',
        aisle: item.aisle || '',
        rack: item.rack || '',
        shelf: item.shelf || '',
        capacity: item.capacity?.toString() || '',
      });
    } else {
      setEditItem(null);
      setFormData({ code: '', name: '', warehouseId: '', zone: '', aisle: '', rack: '', shelf: '', capacity: '' });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    toast.success(editItem ? 'Bin/Rack updated' : 'Bin/Rack created');
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bin / Rack Management</h1>
          <p className="text-muted-foreground">Manage warehouse storage locations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bin / Rack
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{bins.filter(b => b.isActive !== false).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseList.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, name, or zone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouseList.map((wh: any) => (
                  <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Aisle / Rack / Shelf</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBins.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium font-mono">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.warehouseName || '-'}</TableCell>
                  <TableCell>{item.zone || '-'}</TableCell>
                  <TableCell>
                    {[item.aisle, item.rack, item.shelf].filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.capacity ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive !== false ? 'default' : 'secondary'}>
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toast.success('Delete feature coming soon')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {bins.length === 0 ? 'No bin/rack locations configured. Click "Add Bin / Rack" to get started.' : 'No matching locations found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Add'} Bin / Rack</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={formData.code} onChange={(e) => setFormData(f => ({ ...f, code: e.target.value }))} placeholder="e.g. A-01-01" />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="Location name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={formData.warehouseId} onValueChange={(v) => setFormData(f => ({ ...f, warehouseId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseList.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone</Label>
                <Input value={formData.zone} onChange={(e) => setFormData(f => ({ ...f, zone: e.target.value }))} placeholder="Zone A" />
              </div>
              <div className="space-y-2">
                <Label>Aisle</Label>
                <Input value={formData.aisle} onChange={(e) => setFormData(f => ({ ...f, aisle: e.target.value }))} placeholder="Aisle 1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Rack</Label>
                <Input value={formData.rack} onChange={(e) => setFormData(f => ({ ...f, rack: e.target.value }))} placeholder="R1" />
              </div>
              <div className="space-y-2">
                <Label>Shelf</Label>
                <Input value={formData.shelf} onChange={(e) => setFormData(f => ({ ...f, shelf: e.target.value }))} placeholder="S1" />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData(f => ({ ...f, capacity: e.target.value }))} placeholder="100" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
