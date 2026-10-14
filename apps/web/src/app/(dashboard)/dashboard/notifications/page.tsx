'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Filter, Search, Trash2, Mail, AlertTriangle, Info, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

import { useNotifications } from '@/hooks/useNotifications';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const {
    notifications: realNotifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    enabled: true,
    modules: ['sales', 'purchase', 'fms', 'product', 'mis', 'rate'],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const mappedNotifications: Notification[] = (realNotifications || []).map((n) => {
    const isRead = n.status === 'read';
    const module = n.moduleName?.toLowerCase();
    
    let actionUrl = '/dashboard';
    if (n.recordId) {
      if (module?.includes('fms')) actionUrl = `/dashboard/fms`;
      else if (module?.includes('sales') || module?.includes('enquiry')) actionUrl = `/dashboard/sales`;
      else if (module?.includes('purchase') || module?.includes('quote')) actionUrl = `/dashboard/purchase`;
      else if (module?.includes('product')) actionUrl = `/dashboard/masters/products`;
      else if (module?.includes('mis')) actionUrl = `/dashboard/mis`;
      else if (module?.includes('rate')) actionUrl = `/dashboard/rate`;
    }

    let type: NotificationType = 'info';
    if (module === 'fms' && n.title.toLowerCase().includes('escalat')) type = 'error';
    else if (module === 'purchase') type = 'warning';
    else if (n.title.toLowerCase().includes('approved') || n.title.toLowerCase().includes('locked')) type = 'success';

    return {
      id: n.notificationId,
      title: n.title,
      message: n.message,
      read: isRead,
      createdAt: n.createdAt,
      type,
      actionUrl,
    };
  });

  const filteredNotifications = mappedNotifications.filter(n => {
    const matchesFilter = filter === 'all' || (filter === 'unread' && !n.read);
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'success': return <Check className="h-5 w-5 text-emerald-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 mt-1">{unreadCount} unread of {mappedNotifications.length} notifications</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={() => markAllAsRead()} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No notifications found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {filter === 'unread' ? 'You have read all notifications' : 'Try a different search term'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notification => (
              <Card key={notification.id} className={`transition-all ${!notification.read ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={`p-2 rounded-lg ${notification.type === 'error' ? 'bg-red-50' : notification.type === 'warning' ? 'bg-amber-50' : notification.type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.actionUrl && (
                              <a href={notification.actionUrl} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                                View details →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
