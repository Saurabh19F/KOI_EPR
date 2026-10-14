'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Bell,
  Shield,
  Database,
  Mail,
  Clock,
  ClipboardList,
  ShoppingCart,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: '',
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailTaskAssigned: true,
    emailTaskDelayed: true,
    emailEnquirySubmitted: false,
    emailRateAnalysis: true,
    inAppTaskAssigned: true,
    inAppTaskDelayed: true,
    inAppEnquirySubmitted: true,
    inAppRateAnalysis: true,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    toast.success('Notification preference updated');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {user?.isSuperAdmin ? 'Super Admin' : user?.roles?.[0]?.roleName || 'User'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={user?.departmentName || 'Not assigned'} disabled />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={() => toast.success('Profile update will be available soon')}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <CardTitle>Roles & Permissions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles?.map((role: any) => (
                      <Badge key={role.roleId || role} variant="outline">
                        {role.roleName || role}
                      </Badge>
                    )) || (
                      <Badge variant="outline">{user?.role || 'User'}</Badge>
                    )}
                  </div>
                  {user?.permissions && user.permissions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.slice(0, 5).map((perm: string) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {user.permissions.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-gray-500" />
                    <CardTitle>System Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">User ID</span>
                    <span className="font-mono text-xs">{user?.userId?.slice(0, 8) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company ID</span>
                    <span className="font-mono text-xs">{user?.companyId?.slice(0, 8) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Version</span>
                    <span>v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Environment</span>
                    <Badge variant={process.env.NODE_ENV === 'production' ? 'default' : 'secondary'}>
                      {process.env.NODE_ENV || 'development'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <CardTitle>Email Notifications</CardTitle>
                </div>
                <CardDescription>Configure email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Task Assigned</p>
                      <p className="text-sm text-gray-500">When a task is assigned to you</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailTaskAssigned}
                    onCheckedChange={(v) => handleNotificationChange('emailTaskAssigned', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Task Delayed</p>
                      <p className="text-sm text-gray-500">When a task becomes overdue</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailTaskDelayed}
                    onCheckedChange={(v) => handleNotificationChange('emailTaskDelayed', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Enquiry Submitted</p>
                      <p className="text-sm text-gray-500">When a new enquiry is submitted</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailEnquirySubmitted}
                    onCheckedChange={(v) => handleNotificationChange('emailEnquirySubmitted', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Rate Analysis</p>
                      <p className="text-sm text-gray-500">When rates are locked/approved</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailRateAnalysis}
                    onCheckedChange={(v) => handleNotificationChange('emailRateAnalysis', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <CardTitle>In-App Notifications</CardTitle>
                </div>
                <CardDescription>Configure in-app notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'inAppTaskAssigned', label: 'Task Assigned', icon: ClipboardList, color: 'purple' },
                  { key: 'inAppTaskDelayed', label: 'Task Delayed', icon: Clock, color: 'red' },
                  { key: 'inAppEnquirySubmitted', label: 'Enquiry Submitted', icon: ShoppingCart, color: 'blue' },
                  { key: 'inAppRateAnalysis', label: 'Rate Analysis', icon: Activity, color: 'green' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${color}-100 rounded-lg`}>
                        <Icon className={`h-4 w-4 text-${color}-600`} />
                      </div>
                      <p className="font-medium">{label}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications] as boolean}
                      onCheckedChange={(v) => handleNotificationChange(key, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium">2FA is not enabled</p>
                      <p className="text-sm text-gray-500">Protect your account with 2FA</p>
                    </div>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Application and infrastructure details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Application</p>
                  <p className="font-semibold">ERP Platform</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Version</p>
                  <p className="font-semibold">v1.0.0</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Database</p>
                  <p className="font-semibold">PostgreSQL</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Cache</p>
                  <p className="font-semibold">Redis (Optional)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
