'use client';

import { useState, useRef } from 'react';
import { User, Mail, Phone, MapPin, Building2, Shield, Key, Bell, Globe, Camera, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import { filesApi, authApi } from '@/lib/api';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ] as const;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading profile image...');

    try {
      const presignedResponse = await filesApi.getPresignedUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        moduleName: 'user-avatar',
      });

      if (!presignedResponse.data.success) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key, publicUrl } = presignedResponse.data.data;

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      try {
        await filesApi.confirmUpload({
          storageKey: key,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          moduleName: 'user-avatar',
          recordId: user?.userId || 'me',
        });
      } catch (err) {
        console.warn('Confirm upload failed, proceeding with profile update:', err);
      }

      if (user?.userId) {
        const updateResponse = await authApi.updateProfile(user.userId, {
          avatar: publicUrl,
        });

        if (updateResponse.status === 200 || updateResponse.status === 201) {
          setUser({
            ...user,
            avatar: publicUrl,
          });
          toast.success('Profile image updated successfully', { id: toastId });
        } else {
          throw new Error('Failed to update profile');
        }
      } else {
        throw new Error('User not found in session');
      }
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Header Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start gap-6 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  title="Profile Image Selector"
                />
                <button 
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Basic Info */}
              <div className="flex-1 pt-2 sm:pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.name || 'Admin User'}</h2>
                    <p className="text-slate-500 text-sm mt-1">{user?.email || 'admin@koi-erp.com'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {user?.roles?.[0]?.roleName || user?.role || 'Administrator'}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    onClick={() => setIsEditing(!isEditing)}
                    className={isEditing ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin User'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-medium text-slate-900">{user?.email || 'admin@koi-erp.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-slate-900">Mumbai, Maharashtra, India</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization</CardTitle>
                <CardDescription>Your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Company Name</p>
                    <p className="text-sm font-medium text-slate-900">Krishna Overseas Inc.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Subscription Plan</p>
                    <p className="text-sm font-medium text-slate-900">Professional</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Globe className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Tenant ID</p>
                    <p className="text-sm font-medium text-slate-900 font-mono">koi-001</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-800">2FA is not enabled</span>
                  </div>
                  <p className="text-sm text-amber-700">Protect your account with two-factor authentication using an authenticator app.</p>
                </div>
                <Button variant="outline" className="w-full">
                  Enable Two-Factor Authentication
                </Button>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Active Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Chrome on Windows</p>
                        <p className="text-xs text-slate-400">Mumbai, India · Current session</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email notifications', description: 'Receive updates via email', enabled: true },
                  { label: 'Desktop notifications', description: 'Browser push notifications', enabled: true },
                  { label: 'SMS alerts', description: 'Critical alerts via SMS', enabled: false },
                  { label: 'Weekly digest', description: 'Summary of weekly activity', enabled: true },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{pref.label}</p>
                      <p className="text-xs text-slate-400">{pref.description}</p>
                    </div>
                    <button
                      title={pref.label}
                      aria-label={pref.label}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        pref.enabled ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          pref.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Display Preferences</CardTitle>
                <CardDescription>Customize your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Compact mode', description: 'Use denser layout', enabled: false },
                  { label: 'Show welcome banner', description: 'Display welcome message on dashboard', enabled: true },
                  { label: 'Auto-refresh data', description: 'Automatically refresh dashboard data', enabled: true },
                  { label: 'RTL layout', description: 'Right-to-left layout for Arabic/Hebrew', enabled: false },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{pref.label}</p>
                      <p className="text-xs text-slate-400">{pref.description}</p>
                    </div>
                    <button
                      title={pref.label}
                      aria-label={pref.label}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        pref.enabled ? 'bg-amber-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          pref.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
