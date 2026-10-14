'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export interface Notification {
  notificationId: string;
  userId: string;
  moduleName?: string;
  recordId?: string;
  title: string;
  message: string;
  notificationType: string;
  status: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  moduleName?: string;
  recordId?: string;
  type?: string;
}

interface UseNotificationsOptions {
  enabled?: boolean;
  modules?: string[];
  onNewNotification?: (notification: Notification) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { enabled = true, modules = [], onNewNotification } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeNotifications, setRealtimeNotifications] = useState<RealtimeNotification[]>([]);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  const queryEnabled = enabled && !!token;

  // Fetch notifications from API
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications();
      return response.data;
    },
    enabled: queryEnabled,
    staleTime: 30000,
    refetchInterval: 60000, // Poll every minute as fallback
  });

  // Unread count query
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.data.count;
    },
    enabled: queryEnabled,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!queryEnabled || !token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/notifications`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      // Subscribe to specific modules if provided
      if (modules.length > 0) {
        socket.emit('subscribe', { modules });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('notification', (notification: RealtimeNotification) => {
      setRealtimeNotifications(prev => [notification, ...prev.slice(0, 49)]);

      // Show toast for new notification
      toast(notification.message, {
        duration: 5000,
        icon: '🔔',
      });

      // Callback
      if (onNewNotification) {
        onNewNotification({
          notificationId: notification.id,
          userId: '',
          title: notification.title,
          message: notification.message,
          moduleName: notification.moduleName,
          recordId: notification.recordId,
          notificationType: notification.type || 'in_app',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }

      // Refresh notifications list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    });

    socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryEnabled, token, modules.join(','), queryClient, onNewNotification]);

  // Manual refresh
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    notifications: notificationsData?.data || [],
    unreadCount: unreadData || 0,
    isLoading,
    isConnected,
    realtimeNotifications,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    refresh,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

// Simple hook for just unread count
export function useUnreadNotificationCount() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;

  const { data: count } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.data.count;
    },
    enabled: !!token,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  return count || 0;
}
