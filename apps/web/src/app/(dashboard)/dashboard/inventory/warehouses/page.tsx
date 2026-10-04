'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Pencil,
  Trash2,
  Warehouse,
  MapPin,
  Phone,
  Mail,
  Search,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isDefault: boolean;
}

const EMPTY_FORM = {
  code: '',
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  contactPerson: '',
  phone: '',
  email: '',
  isDefault: false,
};

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Fetch warehouses
  const { data: warehousesData, isLoading, refetch } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const warehouses: Warehouse[] = warehousesData?.data || [];
  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(search.toLowerCase()) ||
      wh.code.toLowerCase().includes(search.toLowerCase()) ||
      wh.city?.toLowerCase().includes(search.toLowerCase())
  );

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: (data: any) =>
      editingWarehouse
        ? inventoryApi.updateWarehouse(editingWarehouse.id, data)
        : inventoryApi.createWarehouse(data),
    onSuccess: () => {
      toast.success(`Warehouse ${editingWarehouse ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save warehouse');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Warehouse deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    },
  });

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        country: warehouse.country || '',
        postalCode: warehouse.postalCode || '',
        contactPerson: warehouse.contactPerson || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        isDefault: warehouse.isDefault,
      });
    } else {
      setEditingWarehouse(null);
      setFormData(EMPTY_FORM);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWarehouse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }
    mutation.mutate(formData);
  };

  const handleDelete = (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) return;
    deleteMutation.mutate(warehouse.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-500">Manage warehouse locations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {warehouses.filter(w => w.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Default</p>
                <p className="text-2xl font-bold text-purple-600">
                  {warehouses.filter(w => w.isDefault).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search warehouses..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse List</CardTitle>
          <CardDescription>
            {filteredWarehouses.length} warehouse{filteredWarehouses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredWarehouses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Warehouse className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">{warehouse.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{warehouse.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {[warehouse.address, warehouse.city, warehouse.state, warehouse.country]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {warehouse.contactPerson && <p>{warehouse.contactPerson}</p>}
                        <div className="flex items-center gap-3 text-gray-500">
                          {warehouse.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {warehouse.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {warehouse.isDefault && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            Default
                          </Badge>
                        )}
                        <Badge variant={warehouse.isActive ? 'secondary' : 'outline'}>
                          {warehouse.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(warehouse)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(warehouse)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={warehouse.isDefault}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Warehouse className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No warehouses found</h3>
              <p className="text-gray-500 mt-1">
                {search ? 'Try a different search term' : 'Get started by adding your first warehouse'}
              </p>
              {!search && (
                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warehouse
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warehouse Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WH-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Warehouse Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Warehouse"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Postal code"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Set as default warehouse
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
