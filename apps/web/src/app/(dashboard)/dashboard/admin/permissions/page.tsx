'use client';

import { useQuery } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Users, CheckCircle2 } from 'lucide-react';

interface Permission {
  permissionId: string;
  permissionCode: string;
  permissionName: string;
  moduleName?: string;
  action?: string;
}

// Module groups for permissions mapping
const permissionModules = [
  { name: 'Masters', key: 'masters', actions: ['view', 'create', 'edit', 'delete'], description: 'Manage base lookup tables and reference data' },
  { name: 'Products', key: 'products', actions: ['view', 'create', 'edit', 'delete'], description: 'Manage products list, SKUs, and categories' },
  { name: 'Customers', key: 'customers', actions: ['view', 'create', 'edit', 'delete'], description: 'Manage customer accounts and shipping addresses' },
  { name: 'Sales', key: 'sales', actions: ['view', 'create', 'edit', 'delete', 'approve'], description: 'Manage sales enquiries and transitions' },
  { name: 'Purchase', key: 'purchase', actions: ['view', 'create', 'edit', 'delete', 'approve'], description: 'Manage vendor quotes, labels, and purchase workflows' },
  { name: 'Rate Analysis', key: 'rate', actions: ['view', 'create', 'edit', 'delete', 'approve', 'lock'], description: 'Manage cost estimations, formulas, and pricing analysis' },
  { name: 'FMS Tasks', key: 'fms', actions: ['view', 'create', 'edit', 'update', 'assign'], description: 'Manage operations tasks and workflow milestones' },
  { name: 'Reports', key: 'reports', actions: ['view', 'export'], description: 'View system summaries, audits, and business reports' },
  { name: 'Admin', key: 'admin', actions: ['full'], description: 'Full administrative controls and configurations' },
];

export default function PermissionsPage() {
  // Fetch actual permissions to verify what exists in DB
  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => mastersApi.getPermissions(),
  });

  const dbPermissions: Permission[] = permissionsData?.data || permissionsData || [];

  const getPermissionCode = (module: string, action: string) => {
    return `${module.toUpperCase()}_${action.toUpperCase()}`;
  };

  const isPermissionInDb = (module: string, action: string) => {
    const code = getPermissionCode(module, action);
    return dbPermissions.some(p => p.permissionCode === code);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permissions</h1>
        <p className="text-slate-500 mt-1">Review system permissions matrix and module operations</p>
      </div>

      {/* Tabs */}
      <Tabs value="permissions">
        <TabsList>
          <TabsTrigger value="users" onClick={() => window.location.href = '/dashboard/admin/users'}>
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" onClick={() => window.location.href = '/dashboard/admin/roles'}>
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>System Permissions Matrix</CardTitle>
          <CardDescription>
            A comprehensive list of system permissions mapped by module and actions. Active DB permissions are marked with a checkmark.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissionModules.map((module) => (
              <div key={module.key} className="flex flex-col border border-slate-100 bg-slate-50/50 p-4 rounded-xl hover:shadow-sm transition-shadow">
                <div className="mb-2">
                  <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                    <Key className="h-4 w-4 text-indigo-500" />
                    {module.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 min-h-[32px]">{module.description}</p>
                </div>

                <div className="space-y-2 mt-auto border-t border-slate-100 pt-3">
                  {module.actions.map((action) => {
                    const code = getPermissionCode(module.key, action);
                    const activeInDb = isPermissionInDb(module.key, action);
                    return (
                      <div key={action} className="flex items-center justify-between text-sm bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-700 capitalize font-medium">{action}</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">{code}</code>
                          {isLoading ? (
                            <div className="h-4 w-4 rounded-full bg-slate-100 animate-pulse" />
                          ) : activeInDb ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 py-0 px-1">Implicit</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
