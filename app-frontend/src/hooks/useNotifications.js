import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notificationsApi';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(),
    staleTime: 30000, // 30 seconds
  });

  const notifications = notificationsData?.notifications || [];

  // Fetch unread count
  const {
    data: unreadData,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 10000, // 10 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read');
      console.error('Mark as read error:', error);
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
      toast.success(`Marked ${data.count || 'all'} notifications as read`);
    },
    onError: (error) => {
      toast.error('Failed to mark all as read');
      console.error('Mark all as read error:', error);
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread']);
      toast.success('Notification deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notification');
      console.error('Delete notification error:', error);
    }
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    refetchUnreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    // Pagination stubs — all notifications are loaded in a single page
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
};

export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();

  // Fetch preferences
  const {
    data: preferencesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  const preferences = preferencesData?.preferences || null;

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error('Update preferences error:', error);
    }
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending
  };
};

export const usePushNotifications = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if push is supported
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        const perm = Notification.permission;
        setPermission(perm);

        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };

    checkSupport();
  }, []);

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const { subscribeToPushNotifications } = await import('../utils/pushNotifications');
      return subscribeToPushNotifications();
    },
    onSuccess: () => {
      setIsSubscribed(true);
      setPermission('granted');
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Push notifications enabled!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enable push notifications');
      console.error('Subscribe error:', error);
    }
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const { unsubscribeFromPush } = await import('../utils/pushNotifications');
      return unsubscribeFromPush();
    },
    onSuccess: () => {
      setIsSubscribed(false);
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Push notifications disabled');
    },
    onError: (error) => {
      toast.error('Failed to disable push notifications');
      console.error('Unsubscribe error:', error);
    }
  });

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending
  };
};

export default useNotifications;
