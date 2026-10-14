'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  Calculator,
  Lock,
  Send,
  Loader2,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate, formatTimeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  entityNo?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
}

type NotificationType =
  | 'RATE_SUBMITTED'
  | 'RATE_APPROVED'
  | 'RATE_REJECTED'
  | 'RATE_LOCKED'
  | 'RATE_REQUOTE'
  | 'RATE_PENDING_APPROVAL'
  | 'PURCHASE_RATE_LOCKED'
  | 'ENQUIRY_SUBMITTED'
  | 'COMMENT_ADDED'
  | 'SYSTEM_ALERT';

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: any; color: string; bgColor: string }> = {
  RATE_SUBMITTED: { icon: Send, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  RATE_APPROVED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  RATE_REJECTED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  RATE_LOCKED: { icon: Lock, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  RATE_REQUOTE: { icon: Calculator, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  RATE_PENDING_APPROVAL: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  PURCHASE_RATE_LOCKED: { icon: Lock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ENQUIRY_SUBMITTED: { icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  SYSTEM_ALERT: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

interface NotificationCenterProps {
  userId?: string;
  showAll?: boolean;
}

export function NotificationCenter({ userId, showAll = false }: NotificationCenterProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'rate'>('unread');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', userId, activeTab],
    queryFn: async () => {
      // Mock data - in real app, this would be an API call
      return {
        data: {
          data: [
            {
              id: 'notif-1',
              type: 'RATE_PENDING_APPROVAL',
              title: 'Rate Analysis Pending Approval',
              message: 'Rate Analysis RA-2026-00123 from ABC Corp requires your approval.',
              entityType: 'RATE_ANALYSIS',
              entityId: 'rate-1',
              entityNo: 'RA-2026-00123',
              isRead: false,
              priority: 'high',
              createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
            },
            {
              id: 'notif-2',
              type: 'RATE_APPROVED',
              title: 'Rate Analysis Approved',
              message: 'Rate Analysis RA-2026-00122 has been approved by Admin.',
              entityType: 'RATE_ANALYSIS',
              entityId: 'rate-2',
              entityNo: 'RA-2026-00122',
              isRead: true,
              priority: 'medium',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            },
            {
              id: 'notif-3',
              type: 'RATE_REJECTED',
              title: 'Rate Analysis Rejected',
              message: 'Rate Analysis RA-2026-00121 was rejected. Please review and resubmit.',
              entityType: 'RATE_ANALYSIS',
              entityId: 'rate-3',
              entityNo: 'RA-2026-00121',
              isRead: false,
              priority: 'high',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
            },
            {
              id: 'notif-4',
              type: 'PURCHASE_RATE_LOCKED',
              title: 'Purchase Rate Locked',
              message: 'Purchase rates for ENQ-2026-00456 have been locked by Purchase team.',
              entityType: 'ENQUIRY',
              entityId: 'enquiry-1',
              entityNo: 'ENQ-2026-00456',
              isRead: false,
              priority: 'medium',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
            },
          ] as Notification[],
          total: 4,
          unreadCount: 3,
        },
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const notifications: Notification[] = notificationsData?.data?.data || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      // In real app: notificationsApi.markAsRead(notificationId)
      Promise.resolve({ notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      // In real app: notificationsApi.markAllAsRead()
      Promise.resolve(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      // In real app: notificationsApi.delete(notificationId)
      Promise.resolve({ notificationId }),
    onSuccess: () => {
      toast.success('Notification deleted');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'rate') return n.entityType === 'RATE_ANALYSIS';
    return true;
  });

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    switch (notification.entityType) {
      case 'RATE_ANALYSIS':
        return `/dashboard/rate/${notification.entityId}`;
      case 'ENQUIRY':
        return `/dashboard/enquiry/${notification.entityId}`;
      default:
        return '#';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rate">Rate Analysis</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* Notifications List */}
        <TabsContent value={activeTab} className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const config = NOTIFICATION_CONFIG[notification.type];
              const Icon = config?.icon || Bell;

              return (
                <Card
                  key={notification.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge className={PRIORITY_COLORS[notification.priority]}>
                              {notification.priority}
                            </Badge>
                            {notification.isRead ? (
                              <Eye className="h-4 w-4 text-gray-400" />
                            ) : (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.entityNo && (
                            <span className="font-mono">#{notification.entityNo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{selectedNotification.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{selectedNotification.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  <Badge className={PRIORITY_COLORS[selectedNotification.priority]}>
                    {selectedNotification.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedNotification.createdAt)}</p>
                </div>
                {selectedNotification.entityNo && (
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p className="font-mono font-medium">{selectedNotification.entityNo}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={getNotificationLink(selectedNotification)}>
                    View {selectedNotification.entityType.replace(/_/g, ' ')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NotificationCenter;