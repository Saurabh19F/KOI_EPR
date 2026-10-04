'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { authApi } from '@/lib/api';
import {
  User as UserIcon,
  Bell,
  Shield,
  Database,
  Mail,
  Clock,
  ClipboardList,
  ShoppingCart,
  Activity,
  Key,
  Trash2,
  Lock,
  Smartphone,
  CheckCircle,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [is2FADisableOpen, setIs2FADisableOpen] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedApiKey, setGeneratedApiKey] = useState<any | null>(null);

  // Sync state with user profile
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
      });

      if (user.preferences) {
        setNotifications((prev) => ({
          ...prev,
          ...user.preferences,
        }));
      }

      // Fetch 2FA Status, Sessions, API keys
      fetchSecurityDetails();
    }
  }, [user]);

  const fetchSecurityDetails = async () => {
    try {
      const statusRes = await authApi.get2FAStatus();
      setTwoFactorEnabled(statusRes.data.enabled);

      const sessionsRes = await authApi.getSessions();
      setSessions(sessionsRes.data);

      const apiKeysRes = await authApi.getApiKeys();
      setApiKeys(apiKeysRes.data);
    } catch (err) {
      console.error('Failed to load security details', err);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    try {
      const res = await authApi.updateProfile(user.userId, {
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setUser({
        ...user,
        name: profileForm.name,
        phone: profileForm.phone,
      });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!user) return;
    const newPrefs = { ...notifications, [key]: value };
    setNotifications(newPrefs);
    try {
      await authApi.updateProfile(user.userId, {
        preferences: newPrefs,
      });
      setUser({
        ...user,
        preferences: newPrefs,
      });
      toast.success('Notification preference updated');
    } catch (err: any) {
      toast.error('Failed to save notification preferences');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  // 2FA Setup
  const handleSetup2FA = async () => {
    try {
      const res = await authApi.setup2FA('totp');
      setTwoFactorSecret(res.data.secret);
      setOtpauthUrl(res.data.otpauthUrl || '');
      setIs2FASetupOpen(true);
    } catch (err: any) {
      toast.error('Failed to initiate 2FA setup');
    }
  };

  const handleVerify2FASetup = async () => {
    try {
      const res = await authApi.verify2FASetup(verificationCode);
      setBackupCodes(res.data.backupCodes || []);
      setTwoFactorEnabled(true);
      toast.success('2FA successfully enabled!');
      setVerificationCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  // 2FA Disable
  const handleDisable2FA = async () => {
    try {
      await authApi.disable2FA({ password: disablePassword });
      setTwoFactorEnabled(false);
      setIs2FADisableOpen(false);
      setDisablePassword('');
      setBackupCodes([]);
      toast.success('2FA disabled');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  // Sessions Management
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session revoked');
    } catch (err) {
      toast.error('Failed to revoke session');
    }
  };

  // API Key Management
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }
    try {
      const res = await authApi.createApiKey({ name: newKeyName, scopes: ['*'] });
      setGeneratedApiKey(res.data);
      setNewKeyName('');
      // Reload keys list
      const keysRes = await authApi.getApiKeys();
      setApiKeys(keysRes.data);
      toast.success('API key generated');
    } catch (err) {
      toast.error('Failed to generate API key');
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      await authApi.revokeApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('API key revoked');
    } catch (err) {
      toast.error('Failed to revoke API key');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and application settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
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
                      {user?.isSuperAdmin ? 'Super Admin' : user?.role || 'User'}
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
                  <Button onClick={handleProfileSave}>
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
                      <Badge key={role.roleId || role.roleName} variant="outline">
                        {role.roleName}
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
        <TabsContent value="security" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button onClick={handlePasswordChange}>
                  <Shield className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-8 w-8 ${twoFactorEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium">
                        {twoFactorEnabled ? '2FA is active' : '2FA is not enabled'}
                      </p>
                      <p className="text-sm text-gray-500">Protect your account with TOTP</p>
                    </div>
                  </div>
                  {twoFactorEnabled ? (
                    <Button variant="destructive" onClick={() => setIs2FADisableOpen(true)}>
                      Disable
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleSetup2FA}>
                      Enable
                    </Button>
                  )}
                </div>

                {/* Setup Modal/Section Inline */}
                {is2FASetupOpen && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-4">
                    <p className="font-semibold text-sm">Configure Google Authenticator / Duo</p>
                    <p className="text-xs text-gray-500">
                      Scan the QR code or enter this secret code manually in your authenticator app.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-2 py-1 border rounded text-xs select-all">
                        {twoFactorSecret}
                      </code>
                      <Button size="icon" variant="ghost" onClick={() => handleCopy(twoFactorSecret)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {otpauthUrl && (
                      <div className="text-xs text-gray-400 break-all select-all max-h-16 overflow-y-auto border p-1 bg-white">
                        {otpauthUrl}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="verifyCode">Enter verification code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="verifyCode"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                        />
                        <Button onClick={handleVerify2FASetup}>Verify</Button>
                      </div>
                    </div>
                    {backupCodes.length > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
                        <p className="font-bold text-green-800 mb-1">Backup Codes (Save these safely!):</p>
                        <ul className="grid grid-cols-2 gap-1 font-mono">
                          {backupCodes.map((code) => (
                            <li key={code}>{code}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button variant="link" className="p-0 text-xs text-gray-500" onClick={() => setIs2FASetupOpen(false)}>
                      Close Setup
                    </Button>
                  </div>
                )}

                {/* Disable Modal/Section Inline */}
                {is2FADisableOpen && (
                  <div className="mt-4 p-4 border rounded-lg bg-red-50 space-y-4">
                    <p className="font-semibold text-sm text-red-800">Confirm Disabling 2FA</p>
                    <div className="space-y-2">
                      <Label htmlFor="disablePass">Enter your account password</Label>
                      <Input
                        id="disablePass"
                        type="password"
                        placeholder="Password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={handleDisable2FA}>
                        Disable 2FA
                      </Button>
                      <Button variant="outline" onClick={() => setIs2FADisableOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Devices currently logged in to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-500">No other active sessions.</p>
              ) : (
                <div className="divide-y">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-center py-3">
                      <div>
                        <p className="font-medium text-sm">
                          {session.deviceInfo || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-gray-500">
                          IP: {session.ipAddress || 'Unknown'} | Last active:{' '}
                          {new Date(session.lastActivityAt || session.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage credentials for third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Key Name (e.g., Inventory Integration)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateApiKey}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </div>

              {generatedApiKey && (
                <div className="p-4 bg-green-50 border border-green-200 rounded space-y-2">
                  <p className="text-sm font-bold text-green-800">Generated API Key (Copy this now. You won't see it again!):</p>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 border rounded font-mono text-sm select-all">
                    {generatedApiKey.apiKey}
                    <Button size="icon" variant="ghost" onClick={() => handleCopy(generatedApiKey.apiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="divide-y">
                {apiKeys.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3">No API keys generated.</p>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="flex justify-between items-center py-3">
                      <div>
                        <p className="font-medium text-sm">{key.name}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          Prefix: {key.keyPrefix}... | Created:{' '}
                          {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleRevokeApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
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
                  <p className="font-semibold">Redis (Active)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
