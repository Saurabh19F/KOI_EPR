'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, Clock, AlertTriangle, ShoppingCart, Activity, ClipboardList, Package, Wifi, WifiOff } from 'lucide-react';
import { Badge } from './ui/badge';
import { notificationsApi, NotificationRecord } from '@/lib/api';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

const NOTIFICATION_ICONS: Record<string, any> = {
  fms: ClipboardList,
  sales: ShoppingCart,
  purchase: Activity,
  product: Package,
  mis: ClipboardList,
  rate: Activity,
  fms_task_assigned: ClipboardList,
  fms_task_escalated: AlertTriangle,
  enquiry_submitted: ShoppingCart,
  rate_locked: Activity,
  price_analysis_approved: Activity,
  default: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  fms_task_assigned: 'bg-violet-100 text-violet-700',
  fms_task_escalated: 'bg-red-100 text-red-600',
  enquiry_submitted: 'bg-sky-100 text-sky-700',
  rate_locked: 'bg-emerald-100 text-emerald-700',
  price_analysis_approved: 'bg-emerald-100 text-emerald-700',
  sales: 'bg-sky-100 text-sky-700',
  purchase: 'bg-orange-100 text-orange-600',
  fms: 'bg-violet-100 text-violet-700',
  mis: 'bg-[#f4eadc] text-[#8a5b25]',
  rate: 'bg-emerald-100 text-emerald-700',
  default: 'bg-[#efe8dc] text-slate-600',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Use the notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    enabled: true,
    modules: ['sales', 'purchase', 'fms', 'product', 'mis', 'rate'],
  });

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh when panel opens
  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const getNotificationLink = (notification: NotificationRecord) => {
    const module = notification.moduleName?.toLowerCase();
    if (notification.recordId) {
      if (module?.includes('fms')) return `/dashboard/fms`;
      if (module?.includes('sales') || module?.includes('enquiry')) return `/dashboard/sales`;
      if (module?.includes('purchase') || module?.includes('quote')) return `/dashboard/purchase`;
      if (module?.includes('product')) return `/dashboard/masters/products`;
      if (module?.includes('mis')) return `/dashboard/mis`;
      if (module?.includes('rate')) return `/dashboard/rate`;
    }
    return '/dashboard';
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="relative rounded-lg p-2 transition-colors hover:bg-[#efe8dc]"
        title="Notifications active"
      >
        <Wifi className="h-4 w-4 text-green-500 absolute -top-0.5 -right-0.5" />
        <Bell className="h-5 w-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#eee8de] bg-[#fbfaf6] px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
              {/* Connection status */}
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600">Active</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="rounded p-1.5 text-slate-500 hover:bg-[#efe8dc] hover:text-slate-800"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={refresh}
                className="rounded p-1.5 text-slate-500 hover:bg-[#efe8dc] hover:text-slate-800"
                title="Refresh"
              >
                <Clock className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-slate-500 hover:bg-[#efe8dc] hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-2 text-sm text-slate-500">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.moduleName || 'default'] || NOTIFICATION_ICONS.default;
                const colorClass = NOTIFICATION_COLORS[notification.moduleName || 'default'] || NOTIFICATION_COLORS.default;
                const isUnread = notification.status === 'pending';

                return (
                  <div
                    key={notification.notificationId}
                    className={`relative border-b border-[#f2ede4] px-4 py-3 transition-colors hover:bg-[#fbfaf6] ${
                      isUnread ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        if (isUnread) handleMarkAsRead(notification.notificationId);
                        setIsOpen(false);
                      }}
                      className="block"
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-slate-800 text-sm">
                              {notification.title}
                            </p>
                            {isUnread && (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#9a6b36]" />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteNotification(notification.notificationId);
                      }}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-3 text-slate-500">No notifications</p>
                <p className="text-sm text-gray-400">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[#eee8de] bg-[#fbfaf6] px-4 py-2">
              <Link
                href="/dashboard/notifications"
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium block"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
