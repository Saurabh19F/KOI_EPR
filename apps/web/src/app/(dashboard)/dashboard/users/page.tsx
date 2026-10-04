'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { mastersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Users, Shield, Mail, Phone, MoreHorizontal, CheckCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => authApi.me(),
  });

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => mastersApi.getRoles(),
  });

  const roles = rolesData?.data || rolesData || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage users and their access</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" onClick={() => window.location.href = '/dashboard/users/roles'}>
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user accounts and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current user info */}
                  <div className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {getInitials(usersData?.data?.name || 'U')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">{usersData?.data?.name || 'User'}</h3>
                          {usersData?.data?.isSuperAdmin && (
                            <Badge variant="destructive">Super Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usersData?.data?.email || 'No email'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{usersData?.data?.role || 'User'}</Badge>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 text-center py-4">
                    Additional users will appear here once added to the system.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab - Quick Link */}
        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Configure user roles and their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rolesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
                  ))
                ) : (
                  roles.map((role: any) => (
                    <div key={role.roleId} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.location.href = '/dashboard/users/roles'}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{role.roleName}</h4>
                          <p className="text-xs text-slate-500">{role.roleCode}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
