'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Shield,
  Key,
  Users,
  ChevronRight,
  Check,
  X,
  Edit2,
  Lock,
  Eye,
  FileEdit,
  Trash2,
  CheckCircle2,
  Settings2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

const MODULE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  dashboard: { label: 'Dashboard', icon: '📊', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  masters: { label: 'Masters', icon: '📋', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  products: { label: 'Products', icon: '📦', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  customers: { label: 'Customers', icon: '👥', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  vendors: { label: 'Vendors', icon: '🏭', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  sales: { label: 'Sales', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200' },
  purchase: { label: 'Purchase', icon: '🛒', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  rate: { label: 'Rate Analysis', icon: '📈', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  inventory: { label: 'Inventory', icon: '🏪', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  production: { label: 'Production', icon: '⚙️', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  quality: { label: 'Quality', icon: '✅', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  fms: { label: 'FMS Tasks', icon: '📝', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  reports: { label: 'Reports', icon: '📑', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  admin: { label: 'Admin', icon: '🔐', color: 'bg-red-50 text-red-700 border-red-200' },
  labels: { label: 'Labels', icon: '🏷️', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  'receiving-plan': { label: 'Receiving Plan', icon: '📥', color: 'bg-lime-50 text-lime-700 border-lime-200' },
  'stock-adjustment': { label: 'Stock Adjustment', icon: '🔄', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'system-error-log': { label: 'Error Logs', icon: '⚠️', color: 'bg-red-50 text-red-600 border-red-200' },
  accounts: { label: 'Accounts', icon: '💳', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
};

const ACTION_ICONS: Record<string, typeof Eye> = {
  view: Eye,
  create: Plus,
  edit: FileEdit,
  delete: Trash2,
  approve: CheckCircle2,
  lock: Lock,
  export: FileEdit,
  users: Users,
  roles: Shield,
  settings: Settings2,
  assign: ChevronRight,
  transfer: ChevronRight,
  review: Eye,
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  MANAGEMENT: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
    'SALES_VIEW', 'SALES_APPROVE', 'PURCHASE_VIEW', 'PURCHASE_APPROVE',
    'RATE_VIEW', 'RATE_APPROVE', 'FMS_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT',
    'RECEIVING_PLAN_VIEW', 'PRODUCTION_VIEW', 'QUALITY_VIEW', 'REJECT_ACTION_VIEW',
    'INVENTORY_VIEW', 'ACCOUNTS_VIEW', 'ACCOUNTS_APPROVE',
    'STOCK_ADJUSTMENT_VIEW', 'ERROR_LOG_VIEW',
  ],
  SALES_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW',
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  SALES_USER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW',
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT',
    'REPORTS_VIEW',
  ],
  PURCHASE_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
    'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
    'LABELS_VIEW', 'LABELS_CREATE', 'LABELS_EDIT',
    'RECEIVING_PLAN_VIEW',
    'REJECT_ACTION_VIEW', 'REJECT_ACTION_EDIT',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  PURCHASE_USER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'MASTERS_CREATE', 'MASTERS_EDIT', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
    'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT',
    'LABELS_VIEW', 'LABELS_CREATE', 'LABELS_EDIT',
    'RECEIVING_PLAN_VIEW',
    'REPORTS_VIEW',
  ],
  COSTING_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
    'SALES_VIEW', 'PURCHASE_VIEW',
    'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  COSTING_USER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
    'SALES_VIEW', 'PURCHASE_VIEW',
    'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT',
    'REPORTS_VIEW',
  ],
  MIS_USER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
    'MASTERS_CREATE', 'MASTERS_EDIT',
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
    'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
    'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  PLANNER_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW',
    'PURCHASE_VIEW',
    'RECEIVING_PLAN_VIEW', 'RECEIVING_PLAN_CREATE', 'RECEIVING_PLAN_EDIT', 'RECEIVING_PLAN_DELETE',
    'INVENTORY_VIEW',
    'REPORTS_VIEW',
  ],
  PLANNER_USER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'PURCHASE_VIEW',
    'RECEIVING_PLAN_VIEW', 'RECEIVING_PLAN_CREATE', 'RECEIVING_PLAN_EDIT',
    'INVENTORY_VIEW',
    'REPORTS_VIEW',
  ],
  INVENTORY_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW',
    'PURCHASE_VIEW',
    'RECEIVING_PLAN_VIEW',
    'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_EDIT', 'INVENTORY_TRANSFER',
    'STOCK_ADJUSTMENT_VIEW', 'STOCK_ADJUSTMENT_CREATE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  INVENTORY_USER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'RECEIVING_PLAN_VIEW',
    'INVENTORY_VIEW', 'INVENTORY_CREATE', 'INVENTORY_EDIT', 'INVENTORY_TRANSFER',
    'STOCK_ADJUSTMENT_VIEW', 'STOCK_ADJUSTMENT_CREATE',
    'REPORTS_VIEW',
  ],
  PRODUCTION_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW',
    'PRODUCTION_VIEW', 'PRODUCTION_CREATE', 'PRODUCTION_EDIT', 'PRODUCTION_DELETE',
    'INVENTORY_VIEW', 'INVENTORY_TRANSFER',
    'QUALITY_VIEW',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  PRODUCTION_USER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'PRODUCTION_VIEW', 'PRODUCTION_CREATE', 'PRODUCTION_EDIT',
    'INVENTORY_VIEW', 'INVENTORY_TRANSFER',
    'QUALITY_VIEW',
    'REPORTS_VIEW',
  ],
  QUALITY_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW',
    'QUALITY_VIEW', 'QUALITY_CREATE', 'QUALITY_EDIT', 'QUALITY_DELETE',
    'REJECT_ACTION_VIEW', 'REJECT_ACTION_CREATE', 'REJECT_ACTION_EDIT',
    'PRODUCTION_VIEW',
    'PURCHASE_VIEW',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  QUALITY_USER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'QUALITY_VIEW', 'QUALITY_CREATE', 'QUALITY_EDIT',
    'REJECT_ACTION_VIEW', 'REJECT_ACTION_CREATE',
    'PRODUCTION_VIEW',
    'REPORTS_VIEW',
  ],
  FINANCE_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW',
    'PURCHASE_VIEW', 'PURCHASE_APPROVE',
    'SALES_VIEW',
    'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_APPROVE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  CHIEF_ACCOUNTANT: [
    'DASHBOARD_VIEW',
    'PURCHASE_VIEW',
    'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_APPROVE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  ACCOUNTANT: [
    'DASHBOARD_VIEW',
    'PURCHASE_VIEW',
    'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE',
    'REPORTS_VIEW',
  ],
  LOGISTICS_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW',
    'INVENTORY_VIEW', 'INVENTORY_TRANSFER',
    'SALES_VIEW',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  LOGISTICS_USER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'INVENTORY_VIEW', 'INVENTORY_TRANSFER',
    'SALES_VIEW',
    'REPORTS_VIEW',
  ],
  DESIGNER: [
    'DASHBOARD_VIEW', 'PRODUCTS_VIEW',
    'SALES_VIEW',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT',
    'REPORTS_VIEW',
  ],
  HR_MANAGER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW',
    'ADMIN_USERS', 'ADMIN_ROLES',
    'REPORTS_VIEW',
  ],
  FINANCE_USER: [
    'DASHBOARD_VIEW',
    'PURCHASE_VIEW',
    'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE',
    'REPORTS_VIEW',
  ],
  MIS: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
    'MASTERS_CREATE', 'MASTERS_EDIT',
    'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
    'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
    'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT', 'RATE_APPROVE', 'RATE_LOCK',
    'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  ACCOUNTS: [
    'DASHBOARD_VIEW',
    'PURCHASE_VIEW',
    'SALES_VIEW',
    'ACCOUNTS_VIEW', 'ACCOUNTS_CREATE', 'ACCOUNTS_APPROVE',
    'REPORTS_VIEW', 'REPORTS_EXPORT',
  ],
  VIEWER: [
    'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
    'SALES_VIEW', 'PURCHASE_VIEW',
    'FMS_VIEW',
    'RECEIVING_PLAN_VIEW', 'PRODUCTION_VIEW', 'QUALITY_VIEW',
    'INVENTORY_VIEW', 'ACCOUNTS_VIEW',
  ],
};

function groupPermissionsByModule(perms: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    const key = p.moduleName || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ roleName: '', description: '' });
  const [permissionSearch, setPermissionSearch] = useState('');

  const [createFormData, setCreateFormData] = useState({
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
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => mastersApi.getPermissions(),
  });

  const roles: Role[] = rolesData?.data || rolesData || [];
  const permissions: Permission[] = permissionsData?.data || permissionsData || [];
  const permissionGroups = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  const selectedRole = roles.find(r => r.roleId === selectedRoleId) || null;
  const selectedPermissionIds = useMemo(
    () => new Set(selectedRole?.permissions?.map(p => p.permissionId) || []),
    [selectedRole]
  );

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(search.toLowerCase()) ||
    role.roleCode.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => mastersApi.createRole(data),
    onSuccess: (res: any) => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({ roleName: '', roleCode: '', description: '' });
      const newRole = res?.data || res;
      if (newRole?.roleId) setSelectedRoleId(newRole.roleId);
    },
    onError: () => toast.error('Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mastersApi.updateRole(id, data),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update role'),
  });

  const togglePermissionMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      mastersApi.updateRole(roleId, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('Failed to update permissions'),
  });

  const handleTogglePermission = (permissionId: string) => {
    if (!selectedRole) return;
    const currentIds = selectedRole.permissions.map(p => p.permissionId);
    const newIds = currentIds.includes(permissionId)
      ? currentIds.filter(id => id !== permissionId)
      : [...currentIds, permissionId];
    togglePermissionMutation.mutate({ roleId: selectedRole.roleId, permissionIds: newIds });
  };

  const handleToggleModule = (modulePerms: Permission[], selectAll: boolean) => {
    if (!selectedRole) return;
    const currentIds = new Set(selectedRole.permissions.map(p => p.permissionId));
    for (const p of modulePerms) {
      if (selectAll) currentIds.add(p.permissionId);
      else currentIds.delete(p.permissionId);
    }
    togglePermissionMutation.mutate({ roleId: selectedRole.roleId, permissionIds: Array.from(currentIds) });
  };

  const handleSelectAll = () => {
    if (!selectedRole) return;
    togglePermissionMutation.mutate({
      roleId: selectedRole.roleId,
      permissionIds: permissions.map(p => p.permissionId),
    });
  };

  const handleDeselectAll = () => {
    if (!selectedRole) return;
    togglePermissionMutation.mutate({ roleId: selectedRole.roleId, permissionIds: [] });
  };

  const resolveDefaultPermissionIds = (roleCode: string): string[] | null => {
    const codes = DEFAULT_ROLE_PERMISSIONS[roleCode];
    if (!codes) return null;
    if (codes[0] === '*') return permissions.map(p => p.permissionId);
    const codeToId = new Map(permissions.map(p => [p.permissionCode, p.permissionId]));
    return codes.map(c => codeToId.get(c)).filter((id): id is string => !!id);
  };

  const handleResetToDefault = () => {
    if (!selectedRole) return;
    const ids = resolveDefaultPermissionIds(selectedRole.roleCode);
    if (!ids) {
      toast.error('No default permissions defined for this role');
      return;
    }
    togglePermissionMutation.mutate(
      { roleId: selectedRole.roleId, permissionIds: ids },
      { onSuccess: () => toast.success(`Default permissions applied for ${selectedRole.roleName}`) }
    );
  };

  const applyAllDefaultsMutation = useMutation({
    mutationFn: async () => {
      let applied = 0;
      for (const role of roles) {
        const ids = resolveDefaultPermissionIds(role.roleCode);
        if (!ids) continue;
        const currentIds = new Set((role.permissions || []).map(p => p.permissionId));
        const defaultSet = new Set(ids);
        const same = currentIds.size === defaultSet.size && [...currentIds].every(id => defaultSet.has(id));
        if (same) continue;
        await mastersApi.updateRole(role.roleId, { permissionIds: ids });
        applied++;
      }
      return applied;
    },
    onSuccess: (count) => {
      toast.success(`Default permissions applied to ${count} role${count !== 1 ? 's' : ''}`);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: () => toast.error('Failed to apply default permissions'),
  });

  const handleEditSave = () => {
    if (!selectedRole) return;
    updateMutation.mutate({
      id: selectedRole.roleId,
      data: { roleName: editFormData.roleName, description: editFormData.description },
    });
  };

  const startEditing = () => {
    if (!selectedRole) return;
    setEditFormData({ roleName: selectedRole.roleName, description: selectedRole.description || '' });
    setIsEditing(true);
  };

  const filteredPermissionGroups = useMemo(() => {
    if (!permissionSearch.trim()) return permissionGroups;
    const q = permissionSearch.toLowerCase();
    const filtered: Record<string, Permission[]> = {};
    for (const [mod, perms] of Object.entries(permissionGroups)) {
      const modConfig = MODULE_CONFIG[mod];
      const modLabel = modConfig?.label || mod;
      if (modLabel.toLowerCase().includes(q)) {
        filtered[mod] = perms;
      } else {
        const matchingPerms = perms.filter(
          p => p.permissionName.toLowerCase().includes(q) || p.permissionCode.toLowerCase().includes(q)
        );
        if (matchingPerms.length > 0) filtered[mod] = matchingPerms;
      }
    }
    return filtered;
  }, [permissionGroups, permissionSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 mt-1">
            Configure access control for your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/admin/users'}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button
            variant="outline"
            onClick={() => applyAllDefaultsMutation.mutate()}
            disabled={applyAllDefaultsMutation.isPending || permissions.length === 0}
          >
            <RotateCcw className={cn('h-4 w-4 mr-2', applyAllDefaultsMutation.isPending && 'animate-spin')} />
            {applyAllDefaultsMutation.isPending ? 'Applying...' : 'Apply All Defaults'}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Role
          </Button>
        </div>
      </div>

      {/* Main Content - Master Detail */}
      <div className="flex gap-6 min-h-[calc(100vh-220px)]">
        {/* Left Panel: Role List */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search roles..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {rolesLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="h-5 bg-slate-100 animate-pulse rounded w-3/4 mb-2" />
                      <div className="h-4 bg-slate-50 animate-pulse rounded w-1/2" />
                    </div>
                  ))
                ) : filteredRoles.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No roles found</p>
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = selectedRoleId === role.roleId;
                    const permCount = role.permissions?.length || 0;
                    return (
                      <button
                        key={role.roleId}
                        onClick={() => {
                          setSelectedRoleId(role.roleId);
                          setIsEditing(false);
                          setPermissionSearch('');
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 transition-all hover:bg-slate-50',
                          isSelected && 'bg-indigo-50 border-l-4 border-indigo-600 hover:bg-indigo-50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'font-medium text-sm truncate',
                                isSelected ? 'text-indigo-900' : 'text-slate-900'
                              )}>
                                {role.roleName}
                              </span>
                              {!role.isActive && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">Off</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400 font-mono">{role.roleCode}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-500">
                                {permCount} permission{permCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Permission Editor */}
        <div className="flex-1 min-w-0">
          {!selectedRole ? (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-1">Select a Role</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Choose a role from the list to view and manage its permissions
                </p>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
              {/* Role Header */}
              <CardHeader className="border-b border-slate-100 pb-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Role Name</Label>
                        <Input
                          value={editFormData.roleName}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, roleName: e.target.value }))}
                          className="font-medium"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">Role Code</Label>
                        <Input value={selectedRole.roleCode} disabled className="font-mono bg-slate-50" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Description</Label>
                      <Input
                        value={editFormData.description}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of this role"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEditSave} isLoading={updateMutation.isPending}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{selectedRole.roleName}</CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedRole.roleCode}
                          </Badge>
                          {selectedRole.isActive ? (
                            <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {selectedRole.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            {selectedRole.permissions?.length || 0} of {permissions.length} permissions
                          </span>
                          <span className="flex items-center gap-1">
                            Level {selectedRole.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit Details
                    </Button>
                  </div>
                )}
              </CardHeader>

              {/* Permission Toolbar */}
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Filter permissions..."
                    className="pl-10 h-9 text-sm bg-white"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {DEFAULT_ROLE_PERMISSIONS[selectedRole.roleCode] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetToDefault}
                      className="text-xs h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      disabled={togglePermissionMutation.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset to Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs h-8"
                    disabled={togglePermissionMutation.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="text-xs h-8"
                    disabled={togglePermissionMutation.isPending}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Permissions Grid */}
              <CardContent className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {Object.entries(filteredPermissionGroups).map(([moduleName, modulePerms]) => {
                    const config = MODULE_CONFIG[moduleName] || {
                      label: moduleName,
                      icon: '📌',
                      color: 'bg-slate-50 text-slate-700 border-slate-200',
                    };
                    const selectedCount = modulePerms.filter(p => selectedPermissionIds.has(p.permissionId)).length;
                    const allSelected = selectedCount === modulePerms.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <div
                        key={moduleName}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm"
                      >
                        {/* Module Header */}
                        <div
                          className={cn(
                            'flex items-center justify-between px-4 py-2.5 border-b',
                            config.color
                          )}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <Checkbox
                              checked={allSelected}
                              data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
                              onCheckedChange={(checked) => handleToggleModule(modulePerms, !!checked)}
                            />
                            <span className="text-lg leading-none">{config.icon}</span>
                            <span className="font-semibold text-sm">{config.label}</span>
                          </label>
                          <Badge variant="outline" className="text-[10px] bg-white/70 border-current/20">
                            {selectedCount}/{modulePerms.length}
                          </Badge>
                        </div>

                        {/* Permission Items */}
                        <div className="p-2">
                          {modulePerms.map((perm) => {
                            const isChecked = selectedPermissionIds.has(perm.permissionId);
                            const ActionIcon = ACTION_ICONS[perm.action || ''] || Key;
                            return (
                              <label
                                key={perm.permissionId}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all',
                                  isChecked
                                    ? 'bg-indigo-50/60 hover:bg-indigo-50'
                                    : 'hover:bg-slate-50'
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => handleTogglePermission(perm.permissionId)}
                                />
                                <ActionIcon className={cn(
                                  'h-3.5 w-3.5 flex-shrink-0',
                                  isChecked ? 'text-indigo-500' : 'text-slate-400'
                                )} />
                                <span className={cn(
                                  'text-sm flex-1',
                                  isChecked ? 'text-slate-900 font-medium' : 'text-slate-600'
                                )}>
                                  {perm.permissionName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                                  {perm.action?.toUpperCase()}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {Object.keys(filteredPermissionGroups).length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Search className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No permissions match your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!createFormData.roleName || !createFormData.roleCode) {
                toast.error('Role name and code are required');
                return;
              }
              createMutation.mutate({
                roleName: createFormData.roleName,
                roleCode: createFormData.roleCode,
                description: createFormData.description,
                permissionIds: [],
              });
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input
                value={createFormData.roleName}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, roleName: e.target.value }))}
                placeholder="e.g., Sales Manager"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role Code *</Label>
              <Input
                value={createFormData.roleCode}
                onChange={(e) => setCreateFormData(prev => ({
                  ...prev,
                  roleCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''),
                }))}
                placeholder="e.g., SALES_MANAGER"
                required
              />
              <p className="text-xs text-slate-500">Uppercase letters, numbers, and underscores only</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={createFormData.description}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this role's purpose"
              />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
