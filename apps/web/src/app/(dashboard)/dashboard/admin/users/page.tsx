'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  UserPlus,
  Search,
  Users,
  Shield,
  Mail,
  Edit2,
  Trash2,
  Lock,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    roleId: '',
    isActive: true,
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers', search, departmentFilter, statusFilter],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (search) params.search = search;
      if (departmentFilter !== 'all') params.departmentId = departmentFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      const res = await usersApi.getUsers(params);
      return res.data;
    },
  });

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['adminDepartments'],
    queryFn: async () => {
      const res = await usersApi.getDepartments();
      return res.data || res || [];
    },
  });

  // Fetch roles filtered by selected department
  const { data: rolesData } = useQuery({
    queryKey: ['adminRoles', formData.departmentId],
    queryFn: async () => {
      const params = formData.departmentId ? { departmentId: formData.departmentId } : undefined;
      const res = await usersApi.getRoles(params);
      return res.data || res || [];
    },
  });

  const usersList = usersData?.data || [];
  const departments = departmentsData || [];
  const roles = rolesData || [];

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (data: any) => usersApi.createUser(data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { roleIds, ...userData } = data;
      const result = await usersApi.updateUser(id, userData);
      if (roleIds && roleIds.length > 0) {
        await usersApi.assignRoles(id, roleIds);
      }
      return result;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  // Delete/Deactivate User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      departmentId: '',
      roleId: '',
      isActive: true,
    });
    setEditingUser(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Password is not loaded back for editing
      departmentId: user.departmentId || '',
      roleId: user.role?.roleId || user.roleId || '',
      isActive: user.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload: any = {
      name: formData.name,
      email: formData.email,
      departmentId: formData.departmentId || null,
      isActive: formData.isActive,
    };

    if (formData.roleId) {
      payload.roleIds = [formData.roleId];
    }

    if (!editingUser) {
      payload.password = formData.password;
      createUserMutation.mutate(payload);
    } else {
      updateUserMutation.mutate({ id: editingUser.userId, data: payload });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage users, departments, and roles access</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" onClick={() => window.location.href = '/dashboard/admin/roles'}>
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="w-full sm:w-[180px]">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.departmentId} value={dept.departmentId}>
                        {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users Directory</CardTitle>
          <CardDescription>
            A list of all users registered in the system and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No users found matching the filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((user: any) => {
                    const userRole = user.role?.roleName || 'No Role';
                    const userDept = user.department?.departmentName || 'Not Assigned';
                    return (
                      <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-semibold shadow-sm">
                              {getInitials(user.name || 'U')}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 flex items-center gap-2">
                                {user.name}
                                {user.isSuperAdmin && (
                                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">Super Admin</Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {userDept}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant="outline" className="font-medium">
                            {userRole}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {user.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-full text-xs font-medium border border-slate-100">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditDialog(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {user.isActive !== false && !user.isSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.userId)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Deactivate</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="userName">Name *</Label>
              <Input
                id="userName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="userEmail">Email Address *</Label>
              <Input
                id="userEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                required
                disabled={!!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="space-y-1.5">
                <Label htmlFor="userPassword">Password *</Label>
                <div className="relative">
                  <Input
                    id="userPassword"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) => setFormData(prev => ({ ...prev, departmentId: val, roleId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(val) => setFormData(prev => ({ ...prev, roleId: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.roleId} value={role.roleId}>
                      {role.roleName} ({role.roleCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="space-y-0.5">
                <Label>User Status</Label>
                <div className="text-xs text-slate-500">
                  Allow user to log in and access modules
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, isActive: val }))}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createUserMutation.isPending || updateUserMutation.isPending}>
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
