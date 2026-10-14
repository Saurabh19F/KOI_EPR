'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Shield, Key, Users, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Permission {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  moduleName?: string;
  action?: string;
}

interface Role {
  roleId: string;
  roleCode: string;
  roleName: string;
  description?: string;
  isActive: boolean;
  level: number;
  permissions: Permission[];
}

// Module groups for permissions
const permissionModules = [
  { name: 'Masters', key: 'masters', actions: ['view', 'create', 'edit', 'delete'] },
  { name: 'Products', key: 'products', actions: ['view', 'create', 'edit', 'delete'] },
  { name: 'Customers', key: 'customers', actions: ['view', 'create', 'edit', 'delete'] },
  { name: 'Sales', key: 'sales', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { name: 'Purchase', key: 'purchase', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { name: 'Rate Analysis', key: 'rate', actions: ['view', 'create', 'edit', 'delete', 'approve', 'lock'] },
  { name: 'FMS Tasks', key: 'fms', actions: ['view', 'create', 'edit', 'update', 'assign'] },
  { name: 'Reports', key: 'reports', actions: ['view', 'export'] },
  { name: 'Admin', key: 'admin', actions: ['full'] },
];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('roles');

  // Form state
  const [formData, setFormData] = useState({
    roleName: '',
    roleCode: '',
    description: '',
  });

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => mastersApi.getRoles(),
  });

  // Fetch permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => mastersApi.getPermissions(),
  });

  const roles: Role[] = rolesData?.data || rolesData || [];
  const permissions: Permission[] = permissionsData?.data || permissionsData || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => mastersApi.createRole(data),
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mastersApi.updateRole(id, data),
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update role'),
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      mastersApi.assignRolePermissions(id, permissionIds),
    onSuccess: () => {
      toast.success('Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('Failed to update permissions'),
  });

  const resetForm = () => {
    setFormData({ roleName: '', roleCode: '', description: '' });
    setEditingRole(null);
    setSelectedPermissions(new Set());
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description || '',
    });
    setSelectedPermissions(new Set(role.permissions.map(p => p.permissionId)));
    setIsDialogOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      permissionIds: Array.from(selectedPermissions),
    };

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.roleId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAssignPermissions = (roleId: string) => {
    assignPermissionsMutation.mutate({ id: roleId, permissionIds: Array.from(selectedPermissions) });
  };

  const getPermissionCode = (module: string, action: string) => {
    return `${module.toUpperCase()}_${action.toUpperCase()}`;
  };

  const isPermissionSelected = (module: string, action: string) => {
    const code = getPermissionCode(module, action);
    const perm = permissions.find(p => p.permissionCode === code);
    return perm ? selectedPermissions.has(perm.permissionId) : false;
  };

  const togglePermissionByCode = (module: string, action: string) => {
    const code = getPermissionCode(module, action);
    const perm = permissions.find(p => p.permissionCode === code);
    if (perm) {
      togglePermission(perm.permissionId);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(search.toLowerCase()) ||
    role.roleCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 mt-1">Manage user roles and their permissions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search roles..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-24 bg-slate-100 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            ) : filteredRoles.length ? (
              filteredRoles.map((role) => (
                <Card key={role.roleId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{role.roleName}</CardTitle>
                          <CardDescription className="font-mono text-xs">{role.roleCode}</CardDescription>
                        </div>
                      </div>
                      {role.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {role.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Key className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(role)}>
                        <Shield className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No roles found</p>
                <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Role
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                View all available permissions grouped by module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {permissionModules.map((module) => (
                  <div key={module.key} className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">{module.name}</h4>
                    <div className="space-y-1">
                      {module.actions.map((action) => (
                        <div key={action} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-primary-600" />
                          <span className="text-slate-600 capitalize">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-1">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role Name *</Label>
                    <Input
                      value={formData.roleName}
                      onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                      placeholder="e.g., Sales Manager"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role Code *</Label>
                    <Input
                      value={formData.roleCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, roleCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g., SALES_MGR"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this role"
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      {permissionModules.map((module) => (
                        <div key={module.key} className="space-y-2">
                          <h4 className="font-medium text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {module.name}
                          </h4>
                          <div className="space-y-1 pl-2">
                            {module.actions.map((action) => (
                              <label key={action} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={isPermissionSelected(module.key, action)}
                                  onCheckedChange={() => togglePermissionByCode(module.key, action)}
                                />
                                <span className="text-sm text-slate-700 capitalize">{action}</span>
                                <span className="text-xs text-slate-400 ml-auto">
                                  {getPermissionCode(module.key, action)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
