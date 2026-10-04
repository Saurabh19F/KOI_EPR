'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Building2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentForm {
  id?: string;
  name: string;
  code: string;
  description: string;
  managerId: string;
  isActive: boolean;
}

const EMPTY_FORM: DepartmentForm = {
  name: '',
  code: '',
  description: '',
  managerId: '',
  isActive: true,
};

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentForm | null>(null);
  const [form, setForm] = useState<DepartmentForm>(EMPTY_FORM);

  // Fetch departments
  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => adminApi.getDepartments(),
  });

  const createMutation = useMutation({
    mutationFn: (data: DepartmentForm) => adminApi.createDepartment(data),
    onSuccess: () => {
      toast.success('Department created successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentForm }) =>
      adminApi.updateDepartment(id, data),
    onSuccess: () => {
      toast.success('Department updated successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeDialog();
    },
    onError: () => toast.error('Failed to update department'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      toast.success('Department deleted');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const departments = data?.data || [];

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
  };

  const openEditDialog = (department: any) => {
    setEditingDepartment(department);
    setForm({
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description || '',
      managerId: department.managerId || '',
      isActive: department.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingDepartment(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error('Please enter department name');
      return;
    }
    if (!form.code) {
      toast.error('Please enter department code');
      return;
    }

    if (editingDepartment?.id) {
      updateMutation.mutate({ id: editingDepartment.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleFieldChange = (field: keyof DepartmentForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 mt-1">Manage company departments and organizational structure</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {departments.filter((d: any) => d.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Building2 className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Inactive</p>
                <p className="text-2xl font-bold text-slate-600">
                  {departments.filter((d: any) => !d.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : departments.length ? (
                departments.map((dept: any) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{dept.code}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {dept.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>{dept.memberCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dept.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(dept)}
                        >
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this department?')) {
                              deleteMutation.mutate(dept.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No departments configured</p>
                    <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Department
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Edit Department' : 'Add Department'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., Sales"
                />
              </div>
              <div>
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., SALES"
                  className="uppercase"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
